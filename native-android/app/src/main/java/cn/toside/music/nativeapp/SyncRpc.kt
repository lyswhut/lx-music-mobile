package cn.toside.music.nativeapp

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** The request/response envelopes used by message2call 0.1.3. */
internal class SyncRpc(
    private val send: (JSONObject) -> Unit,
    private val handlers: Map<String, suspend (JSONArray) -> Any?>,
    private val timeoutMs: Long = 120_000,
    private val onHandlerError: (Throwable) -> Unit = {},
) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val lock = Any()
    private val pending = mutableMapOf<String, CompletableDeferred<Any?>>()
    private var closed = false

    suspend fun call(path: List<String>, arguments: JSONArray = JSONArray()): Any? {
        require(path.isNotEmpty() && path.all { it.isNotBlank() })
        val name = path.joinToString(".") + "__" + UUID.randomUUID().toString().replace("-", "")
        val result = CompletableDeferred<Any?>()
        synchronized(lock) {
            check(!closed) { "同步连接已关闭" }
            pending[name] = result
        }
        try {
            send(JSONObject().put("name", name).put("path", JSONArray(path)).put("data", arguments))
            return withTimeout(timeoutMs) { result.await() }
        } finally { synchronized(lock) { pending.remove(name) } }
    }

    fun receive(message: JSONObject) {
        val name = message.optString("name").takeIf { it.isNotBlank() } ?: return
        val path = message.optJSONArray("path")
        if (path != null && path.length() > 0) {
            val components = (0 until path.length()).map { path.optString(it) }
            val handler = handlers[components.joinToString(".")]
            scope.launch {
                val response = JSONObject().put("name", name)
                var failure: Throwable? = null
                try {
                    if (handler == null) error("${components.last()} is not defined")
                    val data = handler(message.optJSONArray("data") ?: JSONArray())
                    response.put("error", JSONObject.NULL).put("data", data ?: JSONObject.NULL)
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { failure = e; response.put("error", e.message ?: "同步处理失败") }
                if (synchronized(lock) { !closed }) {
                    try { send(response) } catch (e: Exception) { failure = e }
                }
                failure?.let(onHandlerError)
            }
        } else {
            val deferred = synchronized(lock) { pending.remove(name) } ?: return
            if (message.isNull("error")) deferred.complete(message.opt("data").let { if (it == JSONObject.NULL) null else it })
            else deferred.completeExceptionally(IllegalStateException(message.optString("error", "同步请求失败")))
        }
    }

    override fun close() {
        synchronized(lock) {
            if (closed) return
            closed = true
            pending.values.forEach { it.completeExceptionally(IllegalStateException("同步连接已关闭")) }
            pending.clear()
        }
        scope.cancel()
    }
}
