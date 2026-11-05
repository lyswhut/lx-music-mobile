package cn.toside.music.nativeapp

import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import com.whl.quickjs.android.QuickJSLoader
import com.whl.quickjs.wrapper.QuickJSContext
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLDecoder
import java.net.URLEncoder
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.spec.X509EncodedKeySpec
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.coroutines.coroutineContext

/** Runs the original LX source API on its own thread; it is independent of React Native. */
data class UserSourceUpdate(val id: String, val name: String, val log: String, val url: String?)
class UserSource(private val context: Context) {
    private val thread = HandlerThread("lx-user-source").apply { start() }
    private val handler = Handler(thread.looper)
    private val dispatcher = handler.asCoroutineDispatcher("lx-user-source")
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    private val pending = mutableMapOf<String, CompletableDeferred<JSONObject>>()
    private val networkJobs = mutableMapOf<String, Job>()
    private val networkConnections = ConcurrentHashMap<String, HttpURLConnection>()
    private var runtime: QuickJSContext? = null
    private var sourceInfo = JSONObject()
    private var initialization: CompletableDeferred<JSONObject>? = null
    private var key = ""
    private var generation = 0
    private val library = UserSourceLibrary(context)
    private val mutableUpdate = MutableStateFlow<UserSourceUpdate?>(null)
    val updates = mutableUpdate.asStateFlow()
    private var loadedEntry: UserSourceEntry? = null

    suspend fun loadSaved(): Boolean {
        val entry = withContext(Dispatchers.IO) { library.selected() } ?: return false
        load(entry.script)
        return true
    }

    suspend fun import(script: String): JSONObject {
        require(script.toByteArray(Charsets.UTF_8).size <= 2 * 1024 * 1024) { "音源文件超过 2 MB" }
        val result = try {
            val loaded = load(script)
            withContext(Dispatchers.IO) { library.addValidated(script) }
            loaded
        } catch (error: Exception) {
            // Keep the previously selected source usable if validation fails.
            withContext(NonCancellable) {
                val restored = try { loadSaved() } catch (_: Exception) { false }
                if (!restored) withContext(dispatcher) { reset() }
            }
            throw error
        }
        return result
    }
    internal suspend fun catalog(): UserSourceCatalog = withContext(Dispatchers.IO) { library.read() }
    internal suspend fun select(id: String?) {
        try {
            val data = catalog()
            val selected = if (id == null) null else data.entries.firstOrNull { it.id == id } ?: error("音源不存在")
            if (selected == null) withContext(dispatcher) { reset() } else load(selected.script)
            withContext(Dispatchers.IO) { library.select(id) }
        } catch (e: Exception) {
            withContext(NonCancellable) { if (!runCatching { loadSaved() }.getOrDefault(false)) withContext(dispatcher) { reset() } }
            throw e
        }
    }
    internal suspend fun remove(id: String) {
        if (catalog().selected == id) select(null)
        withContext(Dispatchers.IO) { library.remove(id) }
        if (mutableUpdate.value?.id == id) mutableUpdate.value = null
    }
    internal suspend fun allowUpdates(id: String, enabled: Boolean) {
        withContext(Dispatchers.IO) { library.allowUpdates(id, enabled) }
        if (!enabled && mutableUpdate.value?.id == id) mutableUpdate.value = null
    }
    fun dismissUpdate() { mutableUpdate.value = null }

    private suspend fun load(script: String): JSONObject {
        val initialized = withContext(dispatcher) {
            reset()
            val entry = UserSourceLibrary.metadata(script)
            loadedEntry = entry
            QuickJSLoader.init()
            key = UUID.randomUUID().toString()
            val js = QuickJSContext.create().also { runtime = it; it.setMemoryLimit(32 * 1024 * 1024) }
            js.setConsole(object : QuickJSContext.Console {
                override fun log(info: String?) { DiagnosticLog(context).record("source", info.orEmpty(), "LOG") }
                override fun info(info: String?) { DiagnosticLog(context).record("source", info.orEmpty(), "INFO") }
                override fun warn(info: String?) { DiagnosticLog(context).record("source", info.orEmpty(), "WARN") }
                override fun error(info: String?) { DiagnosticLog(context).record("source", info.orEmpty()) }
            })
            val result = CompletableDeferred<JSONObject>().also { initialization = it }
            val obj = js.globalObject
            obj.setProperty("__lx_native_call__") { args ->
                if (args[0] == key) onEvent(args[1] as String, args[2] as String)
                null
            }
            obj.setProperty("__lx_native_call__utils_str2b64") { args -> Base64.encodeToString((args[0] as String).toByteArray(), Base64.NO_WRAP) }
            obj.setProperty("__lx_native_call__utils_b642buf") { args -> JSONArray(Base64.decode(args[0] as String, Base64.DEFAULT).map { it.toInt() }).toString() }
            obj.setProperty("__lx_native_call__utils_str2md5") { args ->
                val value = URLDecoder.decode(args[0] as String, "UTF-8")
                MessageDigest.getInstance("MD5").digest(value.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
            }
            obj.setProperty("__lx_native_call__utils_aes_encrypt") { args ->
                runCatching {
                    val data = Base64.decode(args[0] as String, Base64.DEFAULT)
                    val secret = SecretKeySpec(Base64.decode(args[1] as String, Base64.DEFAULT), "AES")
                    val iv = args[2] as String
                    val cipher = Cipher.getInstance(args[3] as String)
                    if (iv.isEmpty()) cipher.init(Cipher.ENCRYPT_MODE, secret)
                    else cipher.init(Cipher.ENCRYPT_MODE, secret, IvParameterSpec(Base64.decode(iv, Base64.DEFAULT).copyOf(16)))
                    Base64.encodeToString(cipher.doFinal(data), Base64.NO_WRAP)
                }.getOrDefault("")
            }
            obj.setProperty("__lx_native_call__utils_rsa_encrypt") { args ->
                runCatching {
                    val publicKey = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(args[1] as String, Base64.DEFAULT)))
                    val cipher = Cipher.getInstance(args[2] as String)
                    cipher.init(Cipher.ENCRYPT_MODE, publicKey)
                    Base64.encodeToString(cipher.doFinal(Base64.decode(args[0] as String, Base64.DEFAULT)), Base64.NO_WRAP)
                }.getOrDefault("")
            }
            obj.setProperty("__lx_native_call__set_timeout") { args ->
                val id = args[0]
                val delay = (args[1] as Number).toLong().coerceIn(0, 60_000)
                val expected = generation
                handler.postDelayed({
                    if (generation == expected) runCatching { callJs("__set_timeout__", id.toString()) }
                        .onFailure { failPending(it) }
                }, delay)
                null
            }
            try {
                val preload = context.assets.open("script/user-api-preload.js").bufferedReader().use { it.readText() }
                js.evaluate(preload)
                js.globalObject.getJSFunction("lx_setup").call(key, entry.id, entry.name, entry.description, entry.version, entry.author, entry.homepage, script)
                js.evaluate(script)
            } catch (e: Exception) { result.completeExceptionally(e) }
            result
        }
        return withTimeout(20_000) { initialized.await() }
    }

    suspend fun musicUrl(source: String, info: JSONObject, quality: String = "128k"): String {
        return sourceRequest(source, "musicUrl", info, quality).getJSONObject("data").getString("url")
    }
    internal suspend fun supports(source: String, action: String): Boolean = withContext(dispatcher) {
        val actions = sourceInfo.optJSONObject("sources")?.optJSONObject(source)?.optJSONArray("actions") ?: return@withContext false
        (0 until actions.length()).any { actions.optString(it) == action }
    }
    internal suspend fun sourceRequest(source: String, action: String, info: JSONObject, quality: String = "128k"): JSONObject {
        val result = withContext(dispatcher) {
            check(runtime != null) { "请先导入并启用自定义音源" }
            val requestKey = UUID.randomUUID().toString()
            val deferred = CompletableDeferred<JSONObject>()
            pending[requestKey] = deferred
            val supported = sourceInfo.optJSONObject("sources")?.optJSONObject(source)?.optJSONArray("qualitys") ?: JSONArray()
            val available = (0 until supported.length()).map { supported.optString(it) }.toSet()
            val selectedQuality = selectQuality(quality, info.optJSONObject("_types") ?: JSONObject(), available)
            val data = JSONObject().put("requestKey", requestKey).put("data", JSONObject().put("source", source)
                .put("action", action).put("info", JSONObject().put("type", selectedQuality).put("musicInfo", info)))
            try { callJs("request", data.toString()) } catch (e: Exception) { pending.remove(requestKey); deferred.completeExceptionally(e) }
            requestKey to deferred
        }
        return try { withTimeout(20_000) { result.second.await() } }
        finally { withContext(dispatcher) { pending.remove(result.first) } }
    }

    private fun callJs(action: String, data: String) {
        runtime?.globalObject?.getJSFunction("__lx_native__")?.call(key, action, data)
    }
    private fun onEvent(action: String, raw: String) {
        when (action) {
            "showUpdateAlert" -> {
                val entry = loadedEntry ?: return
                val event = JSONObject(raw)
                val expected = generation
                scope.launch {
                    val allowed = withContext(Dispatchers.IO) { library.read().entries.firstOrNull { it.id == entry.id }?.allowUpdateAlert ?: true }
                    if (allowed && generation == expected) mutableUpdate.value = UserSourceUpdate(entry.id, entry.name, event.optString("log").take(1200),
                        event.optString("updateUrl").takeIf { it.startsWith("https://") || it.startsWith("http://") })
                }
            }
            "init" -> {
                val event = JSONObject(raw)
                if (event.optBoolean("status")) {
                    sourceInfo = event.getJSONObject("info")
                    initialization?.complete(sourceInfo)
                }
                else initialization?.completeExceptionally(IllegalStateException(event.optString("errorMessage", "音源初始化失败")))
            }
            "response" -> {
                val event = JSONObject(raw)
                val result = pending.remove(event.optString("requestKey")) ?: return
                if (event.optBoolean("status")) result.complete(event.getJSONObject("result"))
                else result.completeExceptionally(IllegalStateException(event.optString("errorMessage", "音源请求失败")))
            }
            "request" -> {
                val event = JSONObject(raw)
                val requestKey = event.getString("requestKey")
                val expected = generation
                networkJobs[requestKey] = scope.launch {
                    val response = try {
                        val result = withContext(Dispatchers.IO) { request(requestKey, event.getString("url"), event.optJSONObject("options") ?: JSONObject()) }
                        JSONObject().put("requestKey", requestKey).put("error", JSONObject.NULL).put("response", result)
                    } catch (e: CancellationException) { throw e }
                    catch (e: Exception) {
                        JSONObject().put("requestKey", requestKey).put("error", e.message ?: "网络请求失败").put("response", JSONObject.NULL)
                    }
                    networkJobs.remove(requestKey)
                    if (expected == generation) runCatching { callJs("response", response.toString()) }.onFailure { failPending(it) }
                }
            }
            "cancelRequest" -> {
                val requestKey = JSONTokener(raw).nextValue().toString()
                if (networkJobs.remove(requestKey)?.let { it.cancel(); true } == true) {
                    networkConnections.remove(requestKey)?.let { connection -> disconnectAsync(connection) }
                    val response = JSONObject().put("requestKey", requestKey).put("error", "request canceled").put("response", JSONObject.NULL)
                    runCatching { callJs("response", response.toString()) }.onFailure { failPending(it) }
                }
            }
        }
    }
    private suspend fun request(requestKey: String, url: String, options: JSONObject): JSONObject {
        val connection = URL(url).openConnection() as HttpURLConnection
        networkConnections[requestKey] = connection
        try {
            coroutineContext.ensureActive()
            connection.connectTimeout = options.optInt("timeout", 13_000).coerceIn(1, 60_000)
            connection.readTimeout = connection.connectTimeout
            connection.requestMethod = options.optString("method", "get").uppercase()
            connection.setRequestProperty("Accept", "application/json")
            val headers = options.optJSONObject("headers") ?: JSONObject()
            headers.keys().forEach { connection.setRequestProperty(it, headers.optString(it)) }
            fun hasHeader(name: String) = headers.keys().asSequence().any { it.equals(name, ignoreCase = true) }
            val form = options.optJSONObject("form")
            val formData = options.optJSONObject("formData")
            val body = when {
                form != null -> form.keys().asSequence().joinToString("&") {
                    "${URLEncoder.encode(it, "UTF-8")}=${URLEncoder.encode(form.optString(it), "UTF-8")}"
                }.also { if (!hasHeader("Content-Type")) connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded") }.toByteArray(Charsets.UTF_8)
                formData != null -> {
                    val boundary = "lx-${UUID.randomUUID()}"
                    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                    multipartForm(formData, boundary)
                }
                options.has("body") && !options.isNull("body") -> {
                    val value = options.get("body")
                    if (!hasHeader("Content-Type")) connection.setRequestProperty("Content-Type", "application/json")
                    (if (value is String) value else value.toString()).toByteArray(Charsets.UTF_8)
                }
                else -> null
            }
            if (body != null) { connection.doOutput = true; connection.outputStream.use { it.write(body) } }
            val status = connection.responseCode
            val bytes = (if (status >= 400) connection.errorStream else connection.inputStream)?.use { it.readBounded(16 * 1024 * 1024) } ?: ByteArray(0)
            val responseBody: Any = if (options.optBoolean("binary")) JSONObject().put("type", "Buffer").put("data", JSONArray(bytes.map { it.toInt() and 255 }))
                else bytes.toString(Charsets.UTF_8).let { runCatching { JSONTokener(it).nextValue() }.getOrDefault(it) }
            val responseHeaders = JSONObject()
            connection.headerFields.forEach { (name, values) -> if (name != null) responseHeaders.put(name.lowercase(), values.joinToString(", ")) }
            return JSONObject().put("statusCode", status).put("statusMessage", connection.responseMessage ?: "")
                .put("headers", responseHeaders).put("body", responseBody).put("url", connection.url.toString()).put("ok", status in 200..299)
        } finally { networkConnections.remove(requestKey, connection); connection.disconnect() }
    }
    private fun reset() {
        generation++
        networkJobs.values.forEach { it.cancel() }; networkJobs.clear()
        networkConnections.values.toList().forEach(::disconnectAsync)
        networkConnections.clear()
        pending.values.forEach { it.completeExceptionally(IllegalStateException("音源已切换")) }; pending.clear()
        initialization?.cancel(); initialization = null
        sourceInfo = JSONObject()
        loadedEntry = null; mutableUpdate.value = null
        runtime?.destroy(); runtime = null
    }
    private fun failPending(error: Throwable) {
        DiagnosticLog(context).record("source", "${error.javaClass.simpleName}: ${error.message}")
        pending.values.forEach { it.completeExceptionally(error) }
        pending.clear()
        initialization?.completeExceptionally(error)
    }
    private fun disconnectAsync(connection: HttpURLConnection) {
        // The source scope is canceled immediately on close; cleanup must still run.
        scope.launch(Dispatchers.IO + NonCancellable) { connection.disconnect() }
    }
    fun close() { scope.launch { reset(); scope.cancel(); thread.quitSafely() } }
}

/** Match the original preference: use the highest supported quality up to the requested level. */
internal fun selectQuality(preferred: String, types: JSONObject, supported: Set<String>): String {
    val order = listOf("flac24bit", "flac", "320k", "128k")
    val start = order.indexOf(preferred).takeIf { it >= 0 } ?: order.lastIndex
    return order.drop(start).firstOrNull { it != "128k" && types.has(it) && it in supported } ?: "128k"
}
