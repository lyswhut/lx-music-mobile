package cn.toside.music.nativeapp

import android.content.Context
import android.util.AtomicFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/** A bounded, private log. Reads, clears and exports share the writer's ordering. */
internal class DiagnosticLog(context: Context) {
    private val preferences = AppPreferences(context)
    private val file = File(context.filesDir, "diagnostics.json")

    fun record(category: String, message: String, level: String = "ERROR") {
        if (category == "sync" && !preferences.bool(SYNC) || category == "source" && !preferences.bool(SOURCE)) return
        if (pending.incrementAndGet() > 512) { pending.decrementAndGet(); return }
        val entry = JSONObject().put("time", Instant.now().toString()).put("category", category.take(32))
            .put("level", level.take(8)).put("message", redact(message).take(MAX_MESSAGE))
        writer.execute { try { runCatching {
            val entries = readEntries().takeLast(MAX_ENTRIES - 1).toMutableList().apply { add(entry) }
            while (JSONArray(entries).toString().toByteArray().size > MAX_BYTES && entries.size > 1) entries.removeAt(0)
            val atomic = AtomicFile(file); val stream = atomic.startWrite()
            try { stream.write(JSONArray(entries).toString().toByteArray()); atomic.finishWrite(stream) }
            catch (e: Exception) { atomic.failWrite(stream); throw e }
        } } finally { pending.decrementAndGet() } }
    }
    suspend fun read(): String = withContext(Dispatchers.IO) {
        writer.submit<String> { readEntries().asReversed().joinToString("\n\n") {
            "${it.optString("time")} [${it.optString("category")}/${it.optString("level")}]\n${it.optString("message")}"
        } }.get()
    }
    suspend fun clear() = withContext(Dispatchers.IO) { writer.submit { AtomicFile(file).delete() }.get(); Unit }
    private fun readEntries(): List<JSONObject> = runCatching {
        val data = AtomicFile(file).openRead().use { JSONArray(it.readBounded(MAX_BYTES).toString(Charsets.UTF_8)) }
        (0 until data.length()).mapNotNull { data.optJSONObject(it) }
    }.getOrDefault(emptyList())

    companion object {
        const val SYNC = "diagnostics.sync"
        const val SOURCE = "diagnostics.source"
        internal const val MAX_ENTRIES = 200
        internal const val MAX_BYTES = 256 * 1024
        private const val MAX_MESSAGE = 4000
        private val writer = Executors.newSingleThreadExecutor { task -> Thread(task, "lx-diagnostics").apply { isDaemon = true } }
        private val pending = AtomicInteger()
        internal fun redact(value: String): String = value
            .replace(Regex("(?i)bearer\\s+[^\\s,;\"']+"), "Bearer [REDACTED]")
            .replace(Regex("https?://[^\\s\"'<>]+", RegexOption.IGNORE_CASE), "[URL]")
            .replace(Regex("(?i)(authorization|cookie|music_u|token|password|secret|authCode|code|key)([\"']?\\s*[:=]\\s*[\"']?)[^\\s,;\"'}]+"), "$1$2[REDACTED]")
    }
}
