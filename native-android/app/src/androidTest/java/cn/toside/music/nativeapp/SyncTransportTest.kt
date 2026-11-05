package cn.toside.music.nativeapp

import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.InputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.URI
import java.net.URLDecoder
import java.security.MessageDigest
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread

@RunWith(AndroidJUnit4::class)
class SyncTransportTest {
    @Test fun exchangesAuthenticatedWebSocketRpc() = runBlocking {
        val server = ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))
        val failure = AtomicReference<Throwable?>()
        val finished = CountDownLatch(1)
        val key = "0123456789abcdef".toByteArray()
        val worker = thread {
            try { server.accept().use { connection ->
                connection.soTimeout = 8000
                val input = connection.getInputStream()
                fun line(): String {
                    val out = java.io.ByteArrayOutputStream()
                    while (true) { val b = input.read(); check(b >= 0); if (b == 10) break; if (b != 13) out.write(b) }
                    return out.toString("UTF-8")
                }
                val target = line().split(' ')[1]
                val headers = mutableMapOf<String, String>()
                while (true) {
                    val item = line(); if (item.isEmpty()) break
                    val pos = item.indexOf(':'); if (pos > 0) headers[item.substring(0, pos).lowercase()] = item.substring(pos + 1).trim()
                }
                val query = URI("http://localhost$target").rawQuery.split('&').associate {
                    val pair = it.split('=', limit = 2); pair[0] to URLDecoder.decode(pair[1], "UTF-8")
                }
                check(query["i"] == "device-1")
                check(SyncAuth.decrypt(query.getValue("t"), key) == "lx-music connect")
                val sha = MessageDigest.getInstance("SHA-1").digest((headers.getValue("sec-websocket-key") + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").toByteArray())
                val accept = Base64.encodeToString(sha, Base64.NO_WRAP)
                val out = connection.getOutputStream()
                out.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: $accept\r\n\r\n".toByteArray())
                val request = """{"name":"test__1","path":["getEnabledFeatures"],"data":["server",{"list":1}]}""".toByteArray()
                out.write(byteArrayOf(0x81.toByte(), request.size.toByte())); out.write(request); out.flush()
                val response = JSONObject(readClientText(input))
                check(response.getString("name") == "test__1" && response.isNull("error"))
                check(response.getJSONObject("data").getJSONObject("list").getBoolean("skipSnapshot") == false)
                finished.countDown()
            } } catch (e: Throwable) { failure.set(e); finished.countDown() }
        }
        val credentials = SyncCredentials("server", "device-1", Base64.encodeToString(key, Base64.NO_WRAP))
        val transport = SyncTransport("http://127.0.0.1:${server.localPort}", credentials, mapOf(
            "getEnabledFeatures" to { args ->
                check(args.getString(0) == "server")
                JSONObject().put("list", JSONObject().put("skipSnapshot", false))
            },
        ))
        try {
            transport.connect()
            assertTrue("No WebSocket response", finished.await(8, TimeUnit.SECONDS))
            assertEquals(null, failure.get())
        } finally { transport.close(); server.close(); worker.join(2000) }
    }

    private fun readClientText(input: InputStream): String {
        val first = input.read(); check(first and 0x0f == 1)
        val second = input.read(); check(second and 0x80 != 0)
        var size = second and 0x7f
        if (size == 126) size = (input.read() shl 8) or input.read()
        check(size < 65536)
        val mask = ByteArray(4); readFully(input, mask)
        val data = ByteArray(size); readFully(input, data)
        for (i in data.indices) data[i] = (data[i].toInt() xor mask[i % 4].toInt()).toByte()
        return SyncWire.decode(data.toString(Charsets.UTF_8))
    }
    private fun readFully(input: InputStream, data: ByteArray) {
        var pos = 0
        while (pos < data.size) { val count = input.read(data, pos, data.size - pos); check(count > 0); pos += count }
    }
}
