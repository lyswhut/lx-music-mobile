package cn.toside.music.nativeapp.sync

import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.net.InetAddress
import java.net.ServerSocket
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.spec.X509EncodedKeySpec
import java.util.concurrent.atomic.AtomicReference
import javax.crypto.Cipher
import kotlin.concurrent.thread

@RunWith(AndroidJUnit4::class)
class SyncAuthTest {
    @Test fun aesMatchesNodeProtocolVector() {
        val key = "0123456789abcdef".toByteArray()
        val ciphertext = "a1JfzN+xsi65exL38u3Qu8wXGk3dGRJYvZV0Xyz+Rn8="
        assertEquals(ciphertext, SyncAuth.encrypt("lx-music auth::Test Device", key))
        assertEquals("lx-music auth::Test Device", SyncAuth.decrypt(ciphertext, key))
    }
    @Test fun authenticatesWithCodeAndPreviouslyIssuedKey() = runBlocking {
        val server = ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))
        val failure = AtomicReference<Throwable?>()
        val key = "0123456789abcdef".toByteArray()
        val code = "123456"
        val codeKey = MessageDigest.getInstance("MD5").digest(code.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }.take(16).toByteArray()
        val worker = thread {
            try {
                repeat(6) {
                    server.accept().use { socket ->
                        socket.soTimeout = 10_000
                        val reader = socket.getInputStream().bufferedReader()
                        val path = reader.readLine().split(' ')[1]
                        val headers = mutableMapOf<String, String>()
                        while (true) {
                            val line = reader.readLine() ?: break
                            if (line.isEmpty()) break
                            val split = line.indexOf(':')
                            if (split > 0) headers[line.substring(0, split).lowercase()] = line.substring(split + 1).trim()
                        }
                        val body = when (path) {
                            "/hello" -> SyncAuth.HELLO
                            "/id" -> SyncAuth.ID_PREFIX + "test-server"
                            "/ah" -> if (headers["i"] == null) {
                                val message = SyncAuth.decrypt(headers.getValue("m"), codeKey).split('\n')
                                check(message[0] == SyncAuth.AUTH && message[2] == "Test Device" && message[3] == "lx_music_mobile")
                                val publicKey = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(message[1], Base64.DEFAULT)))
                                val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA1AndMGF1Padding")
                                cipher.init(Cipher.ENCRYPT_MODE, publicKey)
                                val info = JSONObject().put("clientId", "client-1").put("key", Base64.encodeToString(key, Base64.NO_WRAP)).toString()
                                Base64.encodeToString(cipher.doFinal(info.toByteArray()), Base64.NO_WRAP)
                            } else {
                                check(headers["i"] == "client-1")
                                check(SyncAuth.decrypt(headers.getValue("m"), key) == SyncAuth.AUTH + "Test Device")
                                SyncAuth.encrypt(SyncAuth.HELLO, key)
                            }
                            else -> error("unexpected path")
                        }
                        val bytes = body.toByteArray(Charsets.UTF_8)
                        socket.getOutputStream().apply {
                            write("HTTP/1.1 200 OK\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n".toByteArray())
                            write(bytes)
                        }
                    }
                }
            } catch (e: Throwable) { failure.set(e) }
        }
        try {
            val auth = SyncAuth("http://127.0.0.1:${server.localPort}", "Test Device")
            val credentials = auth.authenticate(code)
            assertEquals("test-server", credentials.serverId)
            assertEquals("client-1", credentials.clientId)
            assertEquals(credentials, auth.authenticate(saved = credentials))
            worker.join(2000)
            assertTrue(failure.get()?.toString() ?: "server still running", failure.get() == null && !worker.isAlive)
        } finally { server.close(); worker.join(2000) }
    }
}
