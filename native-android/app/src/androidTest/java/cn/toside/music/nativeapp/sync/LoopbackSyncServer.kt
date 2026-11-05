package cn.toside.music.nativeapp.sync

import android.util.Base64
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import java.io.EOFException
import java.io.InputStream
import java.io.IOException
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.net.URI
import java.net.URLDecoder
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread

/** Real HTTP authentication and WebSocket/RPC traffic; no production service hooks or external servers. */
internal class LoopbackSyncServer : AutoCloseable {
    private val server = ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"))
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val stopped = AtomicBoolean()
    private val sockets = ConcurrentHashMap.newKeySet<Socket>()
    private val peers = Channel<Peer>(Channel.UNLIMITED)
    val events = Channel<Pair<String, JSONObject>>(Channel.UNLIMITED)
    val listSnapshots = Channel<JSONObject>(Channel.UNLIMITED)
    val connections = AtomicInteger()
    val failure = AtomicReference<Throwable?>()
    val address = "http://127.0.0.1:${server.localPort}"
    private val key = "0123456789abcdef".toByteArray()
    val credentials = SyncCredentials("background-test", "device-1", Base64.encodeToString(key, Base64.NO_WRAP), "Test server")
    @Volatile var requestDislikeConflict = false
    @Volatile var rejectNextSocket = false

    inner class Peer(private val socket: Socket) : AutoCloseable {
        private val output = socket.getOutputStream()
        val rpc = SyncRpc({ send(it.toString()) }, mapOf(
            "onListSyncAction" to { args -> events.send("list" to JSONObject(args.getJSONObject(0).toString())); null },
            "onDislikeSyncAction" to { args -> events.send("dislike" to JSONObject(args.getJSONObject(0).toString())); null },
        ), 15_000)
        suspend fun call(name: String, args: JSONArray = JSONArray()): Any? = rpc.call(listOf(name), args)
        @Synchronized fun send(message: String) {
            val bytes = SyncWire.encode(message).toByteArray(Charsets.UTF_8)
            output.write(0x81)
            if (bytes.size < 126) output.write(bytes.size)
            else { check(bytes.size <= 65535); output.write(126); output.write(bytes.size ushr 8); output.write(bytes.size and 255) }
            output.write(bytes); output.flush()
        }
        override fun close() { socket.close(); rpc.close() }
    }
    private val worker = thread(isDaemon = true, name = "sync-test-accept") {
        while (!stopped.get()) {
            try {
                val socket = server.accept()
                sockets.add(socket)
                thread(isDaemon = true, name = "sync-test-client") {
                    try { socket.use { handle(it) } }
                    catch (_: EOFException) { }
                    catch (_: SocketException) { }
                    catch (e: Throwable) { if (!stopped.get()) failure.compareAndSet(null, e) }
                    finally { sockets.remove(socket) }
                }
            } catch (_: SocketException) { break }
        }
    }
    private fun handle(socket: Socket) {
        socket.soTimeout = 30_000
        val input = socket.getInputStream()
        fun line(): String {
            val bytes = java.io.ByteArrayOutputStream()
            while (true) { val b = input.read(); if (b < 0) throw EOFException(); if (b == 10) break; if (b != 13) bytes.write(b) }
            return bytes.toString("UTF-8")
        }
        val path = line().split(' ')[1]
        val headers = mutableMapOf<String, String>()
        while (true) {
            val value = line(); if (value.isEmpty()) break
            val split = value.indexOf(':')
            if (split > 0) headers[value.substring(0, split).lowercase()] = value.substring(split + 1).trim()
        }
        if (!path.startsWith("/socket?")) {
            val text = when (path) {
                "/hello" -> SyncAuth.HELLO
                "/id" -> SyncAuth.ID_PREFIX + credentials.serverId
                "/ah" -> {
                    check(headers["i"] == credentials.clientId)
                    check(SyncAuth.decrypt(headers.getValue("m"), key).startsWith(SyncAuth.AUTH))
                    SyncAuth.encrypt(SyncAuth.HELLO, key)
                }
                else -> error("Unexpected HTTP request: $path")
            }
            val bytes = text.toByteArray(Charsets.UTF_8)
            socket.getOutputStream().apply {
                write("HTTP/1.1 200 OK\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n".toByteArray())
                write(bytes); flush()
            }
            return
        }
        val query = URI("http://localhost$path").rawQuery.split('&').associate {
            val pair = it.split('=', limit = 2); pair[0] to URLDecoder.decode(pair[1], "UTF-8")
        }
        check(query["i"] == credentials.clientId)
        check(SyncAuth.decrypt(query.getValue("t"), key) == "lx-music connect")
        if (rejectNextSocket) {
            rejectNextSocket = false
            socket.getOutputStream().apply { write("HTTP/1.1 503 Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".toByteArray()); flush() }
            return
        }
        val digest = MessageDigest.getInstance("SHA-1").digest((headers.getValue("sec-websocket-key") +
            "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").toByteArray())
        val accept = Base64.encodeToString(digest, Base64.NO_WRAP)
        socket.getOutputStream().apply {
            write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: $accept\r\n\r\n".toByteArray()); flush()
        }
        val peer = Peer(socket)
        connections.incrementAndGet()
        val handshake = scope.launch {
            try {
                val enabled = peer.call("getEnabledFeatures", JSONArray().put("server").put(JSONObject().put("list", 1).put("dislike", 1))) as JSONObject
                check(enabled.has("list") && enabled.has("dislike"))
                listSnapshots.send(peer.call("list_sync_get_list_data") as JSONObject)
                peer.call("dislike_sync_get_list_data")
                if (requestDislikeConflict) peer.call("dislike_sync_get_sync_mode")
                peer.call("list_sync_finished"); peer.call("dislike_sync_finished"); peer.call("finished")
                peers.send(peer)
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (!socket.isClosed && !stopped.get()) failure.compareAndSet(null, e) }
        }
        val heartbeat = scope.launch { try { while (isActive) { delay(5000); peer.send("ping") } } catch (_: IOException) { } }
        try {
            while (true) {
                val first = input.read(); if (first < 0) break
                val second = input.read(); if (second < 0) break
                val opcode = first and 15
                var size = second and 127
                check(size != 127)
                if (size == 126) size = (input.read() shl 8) or input.read()
                check(size in 0..65535)
                val mask = if (second and 128 != 0) ByteArray(4).also { fully(input, it) } else null
                val bytes = ByteArray(size); fully(input, bytes)
                if (mask != null) for (index in bytes.indices) bytes[index] = (bytes[index].toInt() xor mask[index % 4].toInt()).toByte()
                if (opcode == 8) break
                check(opcode == 1)
                peer.rpc.receive(JSONObject(SyncWire.decode(bytes.toString(Charsets.UTF_8))))
            }
        } finally { handshake.cancel(); heartbeat.cancel(); peer.rpc.close() }
    }
    suspend fun nextPeer(): Peer = withTimeout(15_000) { peers.receive() }
    suspend fun nextEvent(module: String, action: String): JSONObject = withTimeout(5000) {
        while (true) {
            val event = events.receive()
            if (event.first == module && event.second.getString("action") == action) return@withTimeout event.second
        }
        @Suppress("UNREACHABLE_CODE") error("unreachable")
    }
    private fun fully(input: InputStream, bytes: ByteArray) {
        var position = 0
        while (position < bytes.size) { val read = input.read(bytes, position, bytes.size - position); if (read < 0) throw EOFException(); position += read }
    }
    override fun close() {
        stopped.set(true); server.close(); sockets.forEach { it.close() }; scope.cancel(); worker.join(2000)
    }
}
