package cn.toside.music.nativeapp.source

import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeoutOrNull
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import java.io.File
import java.io.ByteArrayOutputStream
import java.net.ServerSocket
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

@RunWith(AndroidJUnit4::class)
class UserSourceTest {
    @Test fun testScriptInitializationAndAsyncRequest() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val testDirectory = File(target.cacheDir, "user-source-instrumentation").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = testDirectory }
        val source = UserSource(context)
        val server = ServerSocket(0, 1, java.net.InetAddress.getByName("127.0.0.1"))
        val serverThread = thread {
            try { repeat(3) { server.accept().use { socket ->
                val reader = socket.getInputStream().bufferedReader()
                while (reader.readLine()?.isNotEmpty() == true) { }
                val body = "{\"url\":\"https://example.org/audio.mp3\"}"
                socket.getOutputStream().write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.toByteArray().size}\r\nConnection: close\r\n\r\n$body".toByteArray())
            } } } catch (_: java.net.SocketException) { }
        }
        try {
            val script = """
                lx.on(lx.EVENT_NAMES.request, async ({source, action, info}) => {
                  if (source !== 'kg' || action !== 'musicUrl' || info.musicInfo.songmid !== 123 || info.type !== '320k') throw new Error('bad request');
                  await new Promise(resolve => setTimeout(resolve, 5));
                  return await new Promise((resolve, reject) => {
                    lx.request('http://127.0.0.1:${server.localPort}/', {}, (err, resp, body) => err ? reject(err) : resolve(body.url));
                  });
                });
                lx.send(lx.EVENT_NAMES.inited, {sources:{kg:{type:'music',actions:['musicUrl'],qualitys:['128k','320k']}}});
            """.trimIndent()
            source.import(script)
            val musicInfo = JSONObject().put("songmid", 123).put("_types", JSONObject().put("320k", JSONObject()).put("flac", JSONObject()))
            assertEquals("https://example.org/audio.mp3", source.musicUrl("kg", musicInfo, "flac"))
            try { source.import("throw new Error('invalid')") ; fail("invalid source should fail") } catch (_: Exception) { }
            assertEquals("https://example.org/audio.mp3", source.musicUrl("kg", musicInfo, "flac"))
            withTimeoutOrNull(50) { source.import("// no initialization event") }
            assertEquals("https://example.org/audio.mp3", source.musicUrl("kg", musicInfo, "flac"))
        } finally {
            source.close()
            server.close()
            serverThread.join(2_000)
            testDirectory.deleteRecursively()
        }
    }
    @Test fun qualitySelectionRespectsPreferenceSongAndSource() {
        val types = JSONObject().put("320k", JSONObject()).put("flac", JSONObject())
        assertEquals("flac", selectQuality("flac24bit", types, setOf("flac", "320k")))
        assertEquals("320k", selectQuality("flac", types, setOf("320k")))
        assertEquals("128k", selectQuality("128k", types, setOf("flac", "320k")))
        assertEquals("128k", selectQuality("flac", JSONObject(), setOf("flac")))
    }
    @Test fun cancelRequestReportsErrorWithoutWaitingForServer() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val testDirectory = File(target.cacheDir, "user-source-cancel-test").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = testDirectory }
        val source = UserSource(context)
        val server = ServerSocket(0, 1, java.net.InetAddress.getByName("127.0.0.1"))
        val accepted = CountDownLatch(1)
        val release = CountDownLatch(1)
        val worker = thread {
            try { server.accept().use { socket ->
                val reader = socket.getInputStream().bufferedReader()
                while (reader.readLine()?.isNotEmpty() == true) { }
                accepted.countDown(); release.await(8, TimeUnit.SECONDS)
            } } catch (_: java.net.SocketException) { }
        }
        try {
            source.import("""
                lx.on(lx.EVENT_NAMES.request, async () => await new Promise((resolve, reject) => {
                    const abort = lx.request('http://127.0.0.1:${server.localPort}/', {}, (err) => {
                        if (err && err.message === 'request canceled') resolve('https://example.org/canceled.mp3');
                        else reject(new Error('unexpected response'));
                    });
                    setTimeout(abort, 500);
                }));
                lx.send(lx.EVENT_NAMES.inited, {sources:{kg:{type:'music',actions:['musicUrl'],qualitys:['128k']}}});
            """.trimIndent())
            val result = withTimeoutOrNull(4000) { source.musicUrl("kg", JSONObject()) }
            assertEquals("https://example.org/canceled.mp3", result)
            org.junit.Assert.assertTrue("request never reached the server", accepted.await(1, TimeUnit.SECONDS))
        } finally {
            release.countDown(); source.close(); server.close(); worker.join(2000); testDirectory.deleteRecursively()
        }
    }
    @Test fun multipartAndBinaryResponseWorkAcrossScriptBridge() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val testDirectory = File(target.cacheDir, "user-source-multipart-test").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = testDirectory }
        val source = UserSource(context)
        val server = ServerSocket(0, 1, java.net.InetAddress.getByName("127.0.0.1"))
        var requestHeaders = ""
        var requestBody = ByteArray(0)
        val worker = thread {
            try { server.accept().use { socket ->
                socket.soTimeout = 5000
                val input = socket.getInputStream(); val header = ByteArrayOutputStream()
                var tail = ""
                while (!tail.endsWith("\r\n\r\n")) {
                    val byte = input.read(); if (byte < 0) error("missing HTTP headers")
                    header.write(byte); tail = (tail + byte.toChar()).takeLast(4)
                }
                requestHeaders = header.toString("UTF-8")
                val length = Regex("(?im)^Content-Length: (\\d+)").find(requestHeaders)?.groupValues?.get(1)?.toInt() ?: 0
                requestBody = ByteArray(length)
                var offset = 0
                while (offset < length) { val count = input.read(requestBody, offset, length - offset); if (count < 0) break; offset += count }
                socket.getOutputStream().apply {
                    write("HTTP/1.1 200 OK\r\nContent-Length: 3\r\nConnection: close\r\n\r\n".toByteArray())
                    write(byteArrayOf(0, 0x80.toByte(), 0xff.toByte()))
                }
            } } catch (_: java.net.SocketException) { }
        }
        try {
            source.import("""
                lx.on(lx.EVENT_NAMES.request, async () => await new Promise((resolve, reject) => {
                    lx.request('http://127.0.0.1:${server.localPort}/', {
                        method: 'post', binary: true, formData: {
                            title: '中文', upload: {value: {type: 'Buffer', data: [0,128,255]},
                            options: {filename: 'a.bin', contentType: 'application/octet-stream'}}
                        }
                    }, (err, response, body) => {
                        if (err) return reject(err);
                        if (body.type !== 'Buffer' || body.data.join(',') !== '0,128,255') return reject(new Error('bad binary'));
                        resolve('https://example.org/multipart.mp3');
                    });
                }));
                lx.send(lx.EVENT_NAMES.inited, {sources:{kg:{type:'music',actions:['musicUrl'],qualitys:['128k']}}});
            """.trimIndent())
            assertEquals("https://example.org/multipart.mp3", source.musicUrl("kg", JSONObject()))
            worker.join(2000)
            org.junit.Assert.assertTrue(requestHeaders.contains("multipart/form-data; boundary="))
            val text = requestBody.toString(Charsets.ISO_8859_1)
            org.junit.Assert.assertTrue(text.contains("name=\"title\""))
            org.junit.Assert.assertTrue(text.contains("filename=\"a.bin\""))
            org.junit.Assert.assertTrue(requestBody.toList().windowed(3).any { it == listOf(0.toByte(), 0x80.toByte(), 0xff.toByte()) })
            org.junit.Assert.assertTrue(requestBody.toString(Charsets.UTF_8).contains("中文"))
        } finally {
            source.close(); server.close(); worker.join(2000); testDirectory.deleteRecursively()
        }
    }
}
