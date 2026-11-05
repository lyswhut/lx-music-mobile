package cn.toside.music.nativeapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

internal object NativeHttp {
    fun encode(value: String): String = URLEncoder.encode(value, "UTF-8")
    suspend fun text(url: String, body: JSONObject? = null, headers: Map<String, String> = emptyMap(), form: Map<String, String>? = null, maxBytes: Int = 8 * 1024 * 1024): String = withContext(Dispatchers.IO) {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
            if (body != null || form != null) {
                connection.requestMethod = "POST"; connection.doOutput = true
                connection.setRequestProperty("Content-Type", if (form == null) "application/json" else "application/x-www-form-urlencoded")
                val data = form?.entries?.joinToString("&") { "${encode(it.key)}=${encode(it.value)}" } ?: body.toString()
                connection.outputStream.use { it.write(data.toByteArray(Charsets.UTF_8)) }
            }
            check(connection.responseCode in 200..299) { "请求失败：${connection.responseCode}" }
            connection.inputStream.use { it.readBounded(maxBytes).toString(Charsets.UTF_8) }
        } finally { connection.disconnect() }
    }
    suspend fun json(url: String, body: JSONObject? = null, headers: Map<String, String> = emptyMap(), form: Map<String, String>? = null): JSONObject = JSONObject(text(url, body, headers, form))
}
