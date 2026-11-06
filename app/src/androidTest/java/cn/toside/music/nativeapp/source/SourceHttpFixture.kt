package cn.toside.music.nativeapp.source

import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

/** Local script downloads, including redirects and responses without Content-Length. */
internal class SourceHttpFixture : AutoCloseable {
    private val server = ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"))
    private val sockets = ConcurrentHashMap.newKeySet<Socket>()
    val started = CountDownLatch(1)
    private val release = CountDownLatch(1)
    val address = "http://127.0.0.1:${server.localPort}"
    val script = """
        /**
         * @name Settings import fixture
         * @version 1.0
         * @author 测试
         */
        lx.on(lx.EVENT_NAMES.request, async () => 'https://example.org/test.mp3');
        lx.send(lx.EVENT_NAMES.inited,{sources:{kw:{type:'music',actions:['musicUrl'],qualitys:['128k']}}});
    """.trimIndent()
    private val worker = thread(isDaemon = true, name = "source-http-fixture") {
        while (!server.isClosed) {
            val socket = try { server.accept() } catch (_: Exception) { break }
            sockets.add(socket)
            thread(isDaemon = true) {
                try { socket.use {
                    val reader = it.getInputStream().bufferedReader()
                    val path = reader.readLine().split(' ')[1]
                    while (!reader.readLine().isNullOrEmpty()) { }
                    if (path == "/slow") { started.countDown(); release.await(5, TimeUnit.SECONDS) }
                    val body = when (path) {
                        "/empty" -> ""
                        "/html" -> "  <!DOCTYPE html><html>download page</html>"
                        "/invalid" -> "throw Error('invalid fixture script');"
                        "/large", "/unbounded" -> "x".repeat(2 * 1024 * 1024 + 1)
                        else -> "\uFEFF$script"
                    }.toByteArray(Charsets.UTF_8)
                    val code = when (path) { "/redirect" -> "302 Found"; "/missing" -> "404 Not Found"; else -> "200 OK" }
                    val headers = buildString {
                        append("HTTP/1.1 $code\r\nConnection: close\r\n")
                        if (path == "/redirect") append("Location: /script\r\n")
                        if (path != "/unbounded") append("Content-Length: ${body.size}\r\n")
                        append("\r\n")
                    }
                    it.getOutputStream().apply { write(headers.toByteArray()); write(body); flush() }
                } } catch (_: Exception) { /* Cancellation closes sockets while writing. */ }
                finally { sockets.remove(socket) }
            }
        }
    }
    override fun close() { release.countDown(); server.close(); sockets.forEach { it.close() }; worker.join(1000) }
}
