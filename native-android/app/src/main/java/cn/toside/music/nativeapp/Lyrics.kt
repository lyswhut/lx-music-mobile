package cn.toside.music.nativeapp

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject

data class LyricWord(val startMs: Long, val durationMs: Long, val start: Int, val end: Int)
data class LyricLine(val timeMs: Long, val text: String, val words: List<LyricWord> = emptyList(),
    val translation: String = "", val romanization: String = "")

object LrcParser {
    private val tag = Regex("\\[(\\d{1,3}):(\\d{1,2})(?:[.:](\\d{1,3}))?]")
    private val offsetTag = Regex("\\[offset:([+-]?\\d+)]", RegexOption.IGNORE_CASE)
    fun parse(text: String): List<LyricLine> {
        val offset = offsetTag.find(text)?.groupValues?.get(1)?.toLongOrNull() ?: 0L
        return text.lineSequence().flatMap { line ->
            val matches = tag.findAll(line).toList()
            val content = tag.replace(line, "").trim()
            matches.asSequence().mapNotNull { match ->
                val minute = match.groupValues[1].toLongOrNull() ?: return@mapNotNull null
                val second = match.groupValues[2].toLongOrNull() ?: return@mapNotNull null
                if (second >= 60) return@mapNotNull null
                val fraction = match.groupValues[3].padEnd(3, '0').take(3).toLongOrNull() ?: 0
                val time = (minute * 60_000 + second * 1_000 + fraction + offset).coerceAtLeast(0)
                LyricFormats.relativeWords(time, content)
            }
        }.sortedBy { it.timeMs }.toList()
    }
    fun lineAt(lines: List<LyricLine>, positionMs: Long): String? {
        return lines.getOrNull(indexAt(lines, positionMs))?.text
    }
    fun indexAt(lines: List<LyricLine>, positionMs: Long): Int {
        var low = 0
        var high = lines.size
        while (low < high) {
            val middle = (low + high) ushr 1
            if (lines[middle].timeMs <= positionMs) low = middle + 1 else high = middle
        }
        return low - 1
    }
}

class Lyrics(private val context: Context) {
    private fun file(songId: Long, source: String): File {
        require(source in setOf("local", "kg", "kw", "tx", "wy", "mg"))
        return File(context.filesDir, if (source == "local") "lyrics/$songId.lrc" else "lyrics/${source}_$songId.lrc")
    }
    suspend fun load(songId: Long, source: String): List<LyricLine> = withContext(Dispatchers.IO) {
        val file = file(songId, source)
        if (file.isFile) LrcParser.parse(file.readText(Charsets.UTF_8)) else {
            val cached = File(file.parentFile, file.nameWithoutExtension + ".json")
            if (!cached.isFile) emptyList() else runCatching {
                decode(cached.inputStream().use { it.readBounded(MAX_SIZE) }.toString(Charsets.UTF_8))
            }.getOrDefault(emptyList())
        }
    }
    suspend fun cache(song: Song, lines: List<LyricLine>) = withContext(Dispatchers.IO) {
        if (lines.isEmpty()) return@withContext
        val original = file(song.id, song.source)
        val target = File(original.parentFile, original.nameWithoutExtension + ".json")
        val bytes = encode(lines).toByteArray(Charsets.UTF_8)
        require(bytes.size <= MAX_SIZE) { "歌词数据过大" }
        writeAtomic(target, bytes)
    }
    suspend fun clearOnlineCache(song: Song) = withContext(Dispatchers.IO) {
        val original = file(song.id, song.source)
        File(original.parentFile, original.nameWithoutExtension + ".json").delete()
    }
    suspend fun import(songId: Long, source: String, uri: Uri) = withContext(Dispatchers.IO) {
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBounded(MAX_SIZE) }
            ?: error("无法读取歌词文件")
        val text = bytes.toString(Charsets.UTF_8)
        require(LrcParser.parse(text).isNotEmpty()) { "未找到有效的 LRC 时间标签" }
        val target = file(songId, source)
        writeAtomic(target, bytes)
    }
    private fun writeAtomic(target: File, bytes: ByteArray) {
        target.parentFile?.mkdirs()
        val atomic = AtomicFile(target); val stream = atomic.startWrite()
        try { stream.write(bytes); atomic.finishWrite(stream) } catch (e: Exception) { atomic.failWrite(stream); throw e }
    }
    companion object {
        private const val MAX_SIZE = 2 * 1024 * 1024
        internal fun encode(lines: List<LyricLine>): String = JSONArray().apply {
            lines.forEach { line -> put(JSONObject().put("time", line.timeMs).put("text", line.text).put("translation", line.translation)
                .put("romanization", line.romanization).put("words", JSONArray().apply {
                    line.words.forEach { put(JSONArray().put(it.startMs).put(it.durationMs).put(it.start).put(it.end)) }
                })) }
        }.toString()
        internal fun decode(text: String): List<LyricLine> {
            val items = JSONArray(text)
            return (0 until items.length()).map { index ->
                val item = items.getJSONObject(index); val value = item.getString("text")
                val words = item.optJSONArray("words") ?: JSONArray()
                LyricLine(item.getLong("time").coerceAtLeast(0), value, (0 until words.length()).map { wordIndex ->
                    val word = words.getJSONArray(wordIndex)
                    require(word.getInt(2) in 0..value.length && word.getInt(3) in word.getInt(2)..value.length)
                    LyricWord(word.getLong(0), word.getLong(1).coerceAtLeast(0), word.getInt(2), word.getInt(3))
                }, item.optString("translation"), item.optString("romanization"))
            }.sortedBy { it.timeMs }
        }
    }
}
