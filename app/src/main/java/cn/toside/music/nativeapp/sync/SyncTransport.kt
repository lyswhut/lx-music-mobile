package cn.toside.music.nativeapp.sync

import android.os.SystemClock
import android.util.Base64
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

internal interface SyncConnection : AutoCloseable {
    suspend fun connect()
    suspend fun call(path: List<String>, arguments: JSONArray = JSONArray()): Any?
}
internal data class SyncDisconnect(val message: String, val retryable: Boolean)

internal fun interface SyncConnectionFactory {
    fun create(address: String, credentials: SyncCredentials, handlers: Map<String, suspend (JSONArray) -> Any?>,
        onDisconnected: (SyncDisconnect) -> Unit): SyncConnection
}

/** WebSocket transport only; handlers decide which data may be read or changed. */
internal class SyncTransport(
    address: String,
    credentials: SyncCredentials,
    handlers: Map<String, suspend (JSONArray) -> Any?>,
    private val onDisconnected: (SyncDisconnect) -> Unit = {},
) : SyncConnection {
    private val client = OkHttpClient()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val incoming = Channel<String>(32)
    private val ready = CompletableDeferred<Unit>()
    private val stopped = AtomicBoolean(false)
    private val started = AtomicBoolean(false)
    @Volatile private var socket: WebSocket? = null
    @Volatile private var lastMessage = SystemClock.elapsedRealtime()
    private val rpc = SyncRpc(::send, handlers, onHandlerError = { fail("同步处理失败：${it.message}") })
    private val request: Request

    init {
        val key = Base64.decode(credentials.key, Base64.DEFAULT)
        require(key.size == 16 && credentials.clientId.isNotBlank()) { "同步认证信息无效" }
        val token = SyncAuth.encrypt("lx-music connect", key)
        val base = address.trim().trimEnd('/').toHttpUrl()
        require(base.username.isEmpty() && base.password.isEmpty() && base.query == null && base.fragment == null) { "同步服务地址无效" }
        val url = base.newBuilder().addPathSegment("socket")
            .addQueryParameter("i", credentials.clientId).addQueryParameter("t", token).build()
        request = Request.Builder().url(url).build()
    }

    override suspend fun connect() {
        check(!stopped.get()) { "同步连接已关闭" }
        check(started.compareAndSet(false, true)) { "同步连接已经启动" }
        scope.launch {
            try {
                for (message in incoming) {
                    if (message == "ping") continue
                    rpc.receive(JSONObject(SyncWire.decode(message)))
                }
            } catch (e: Exception) { fail("同步消息无效：${e.message}") }
        }
        scope.launch {
            while (!stopped.get()) {
                delay(5000)
                if (ready.isCompleted && SystemClock.elapsedRealtime() - lastMessage > 31_000) {
                    fail("同步连接心跳超时", retryable = true); break
                }
            }
        }
        socket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (stopped.get()) { webSocket.cancel(); return }
                socket = webSocket; lastMessage = SystemClock.elapsedRealtime(); ready.complete(Unit)
            }
            override fun onMessage(webSocket: WebSocket, text: String) {
                lastMessage = SystemClock.elapsedRealtime()
                if (text.length > 32 * 1024 * 1024 || !incoming.trySend(text).isSuccess) fail("同步消息过多或过大")
            }
            override fun onMessage(webSocket: WebSocket, bytes: ByteString) { fail("不支持的同步消息格式") }
            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) { webSocket.close(code, reason) }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                fail("同步连接已断开：$code $reason", retryable = code != 4100)
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                val status = response?.code
                fail("同步连接失败：${t.message}", retryable = status == null || status >= 500 || status in setOf(408, 429))
            }
        })
        try { withTimeout(20_000) { ready.await() } }
        catch (e: Exception) { close(); throw e }
    }

    override suspend fun call(path: List<String>, arguments: JSONArray): Any? = rpc.call(path, arguments)

    private fun send(message: JSONObject) {
        check(!stopped.get() && ready.isCompleted && socket?.send(SyncWire.encode(message.toString())) == true) { "同步连接不可用" }
    }
    private fun fail(message: String, retryable: Boolean = false) {
        if (!stopped.compareAndSet(false, true)) return
        ready.completeExceptionally(if (retryable) SyncConnectionException(message) else IllegalStateException(message))
        // Publish the disconnect before failing pending calls so callers retain the retryable connection status.
        onDisconnected(SyncDisconnect(message, retryable))
        rpc.close(); incoming.close(); socket?.cancel(); scope.cancel()
        client.dispatcher.executorService.shutdown(); client.connectionPool.evictAll()
    }
    override fun close() {
        if (!stopped.compareAndSet(false, true)) return
        ready.cancel(); rpc.close(); incoming.close(); socket?.close(1000, "")
        scope.cancel(); client.dispatcher.executorService.shutdown(); client.connectionPool.evictAll()
    }
}
