package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.lyrics.LrcParser
import cn.toside.music.nativeapp.lyrics.LyricFormats
import cn.toside.music.nativeapp.lyrics.LyricLine
import cn.toside.music.nativeapp.lyrics.MrcCipher
import cn.toside.music.nativeapp.lyrics.QrcCipher
import cn.toside.music.nativeapp.utils.readBounded

import android.text.Html
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.zip.InflaterInputStream

/** Provider lyrics preserve translations, romanization and word timing in one native model. */
class OnlineLyrics {
    suspend fun forSong(song: Song): List<LyricLine> = withContext(Dispatchers.IO) {
        when (song.source) {
            "kg" -> kugou(song)
            "kw" -> kuwo(song)
            "wy" -> netease(song)
            "mg" -> migu(song)
            "tx" -> qq(song)
            else -> emptyList()
        }
    }
    private fun kugou(song: Song): List<LyricLine> {
        val info = JSONObject(song.sourceInfo ?: return emptyList())
        val hash = info.optString("hash")
        val name = URLEncoder.encode(song.title, "UTF-8")
        val result = get("http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=$name&hash=$hash&timelength=${song.duration / 1000}&lrctxt=1")
        val candidate = result.optJSONArray("candidates")?.optJSONObject(0) ?: return emptyList()
        val format = if (candidate.optInt("krctype") == 1 && candidate.optInt("contenttype") != 1) "krc" else "lrc"
        val id = URLEncoder.encode(candidate.getString("id"), "UTF-8")
        val access = URLEncoder.encode(candidate.getString("accesskey"), "UTF-8")
        val data = get("http://lyrics.kugou.com/download?ver=1&client=pc&id=$id&accesskey=$access&fmt=$format&charset=utf8")
        val content = Base64.decode(data.getString("content"), Base64.DEFAULT)
        return when (data.optString("fmt")) {
            "lrc" -> LrcParser.parse(content.toString(Charsets.UTF_8))
            "krc" -> parseKrc(content)
            else -> emptyList()
        }
    }
    private fun kuwo(song: Song): List<LyricLine> {
        val info = JSONObject(song.sourceInfo ?: return emptyList())
        val id = URLEncoder.encode(info.getString("songmid"), "UTF-8")
        val raw = fetch("http://mlyric.kuwo.cn/mobi.s?f=web&type=lyric&lrcx=1&rid=$id&encode=utf8")
        return parseKuwo(decodeKuwo(raw))
    }
    internal fun decodeKuwo(raw: ByteArray): String {
        if (raw.size < 10 || !raw.copyOfRange(0, 10).toString(Charsets.UTF_8).equals("tp=content", true)) return ""
        val divider = byteArrayOf(13, 10, 13, 10)
        val offset = (0..raw.size - divider.size).firstOrNull { i -> divider.indices.all { raw[i + it] == divider[it] } }
            ?: return ""
        val inflated = InflaterInputStream(ByteArrayInputStream(raw, offset + divider.size, raw.size - offset - divider.size))
            .use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) }
        val text = if (LrcParser.parse(inflated).isNotEmpty()) inflated else {
            val encrypted = Base64.decode(inflated, Base64.DEFAULT)
            val key = "yeelion".toByteArray()
            for (i in encrypted.indices) encrypted[i] = (encrypted[i].toInt() xor key[i % key.size].toInt()).toByte()
            encrypted.toString(Charsets.UTF_8)
        }
        val marker = Regex("\\[kuwo:(\\d+)]").find(text)?.groupValues?.get(1)?.toIntOrNull(8)
        val divisor1 = marker?.let { it / 10 }?.takeIf { it > 0 } ?: 1
        val divisor2 = marker?.let { it % 10 }?.takeIf { it > 0 } ?: 1
        return Regex("<(-?\\d+),(-?\\d+)(?:,-?\\d+)?>").replace(text) { match ->
            val a = match.groupValues[1].toLong(); val b = match.groupValues[2].toLong()
            val start = kotlin.math.abs((a + b) / (divisor1 * 2))
            val duration = kotlin.math.abs((a - b) / (divisor2 * 2))
            "<$start,$duration>"
        }
    }
    internal fun parseKuwo(text: String): List<LyricLine> {
        val main = mutableListOf<LyricLine>(); val translations = mutableListOf<LyricLine>(); val seen = mutableSetOf<Long>()
        LrcParser.parse(entities(text)).forEach { line ->
            if (line.timeMs in seen && main.size >= 2) {
                val translated = main.removeAt(main.lastIndex)
                translations.add(translated.copy(timeMs = main.last().timeMs, words = emptyList()))
                main.add(line)
            } else { main.add(line); seen.add(line.timeMs) }
        }
        return LyricFormats.merge(main, translations, emptyList())
    }
    private fun netease(song: Song): List<LyricLine> {
        val info = JSONObject(song.sourceInfo ?: return emptyList())
        val path = "/api/song/lyric/v1"
        val payload = JSONObject().put("id", info.get("songmid")).put("cp", false).put("tv", 0).put("lv", 0)
            .put("rv", 0).put("kv", 0).put("yv", 0).put("ytv", 0).put("yrv", 0).toString()
        val params = OnlineSearch().eapi(path, payload)
        val url = "https://interface3.music.163.com/eapi/song/lyric/v1"
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("Origin", "https://music.163.com")
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connection.outputStream.use { it.write("params=$params".toByteArray()) }
            check(connection.responseCode == 200) { "获取歌词失败" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(4 * 1024 * 1024).toString(Charsets.UTF_8) })
            return LyricFormats.netease(result)
        } finally { connection.disconnect() }
    }
    private fun migu(song: Song): List<LyricLine> {
        val info = JSONObject(song.sourceInfo ?: return emptyList())
        val headers = mapOf("Referer" to "https://app.c.nf.migu.cn/", "channel" to "0146921")
        fun text(key: String): String {
            val url = info.optString(key)
            if (!url.startsWith("https://") && !url.startsWith("http://")) return ""
            return fetch(url, headers).toString(Charsets.UTF_8)
        }
        val main = if (info.optString("mrcUrl").isNotBlank()) LyricFormats.timedSentences(MrcCipher.decrypt(text("mrcUrl")), false)
            else LrcParser.parse(text("lrcUrl"))
        val translation = runCatching { LrcParser.parse(text("trcUrl")) }.getOrDefault(emptyList())
        return LyricFormats.merge(main, translation, emptyList())
    }
    private fun qq(song: Song): List<LyricLine> {
        val info = JSONObject(song.sourceInfo ?: return emptyList())
        val id = info.optLong("songId", 0)
        if (id <= 0) return emptyList()
        val param = JSONObject().put("format", "json").put("crypt", 1).put("ct", 19).put("cv", 1873)
            .put("interval", 0).put("lrc_t", 0).put("qrc", 1).put("qrc_t", 0).put("roma", 1).put("roma_t", 0)
            .put("songID", id).put("trans", 1).put("trans_t", 0).put("type", -1)
        val body = JSONObject().put("comm", JSONObject().put("ct", "19").put("cv", "1859").put("uin", "0"))
            .put("req", JSONObject().put("method", "GetPlayLyricInfo").put("module", "music.musichallSong.PlayLyricInfo").put("param", param))
        val connection = URL("https://u.y.qq.com/cgi-bin/musicu.fcg").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000; connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("Referer", "https://y.qq.com")
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(body.toString().toByteArray()) }
            check(connection.responseCode == 200) { "获取歌词失败" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(4 * 1024 * 1024).toString(Charsets.UTF_8) })
            val request = result.optJSONObject("req") ?: return emptyList()
            if (result.optInt("code", -1) != 0 || request.optInt("code", -1) != 0) return emptyList()
            val data = request.optJSONObject("data") ?: return emptyList()
            fun lines(key: String): List<LyricLine> = parseQrc(decodeQrc(data.optString(key)))
            return LyricFormats.merge(lines("lyric"), runCatching { lines("trans") }.getOrDefault(emptyList()),
                runCatching { lines("roma") }.getOrDefault(emptyList()))
        } finally { connection.disconnect() }
    }
    internal fun decodeQrc(hex: String): String {
        if (hex.contains('[') || hex.contains("LyricContent=")) return hex
        if (hex.isEmpty() || hex.length % 16 != 0 || hex.length > 4 * 1024 * 1024) return ""
        val bytes = ByteArray(hex.length / 2) { index -> hex.substring(index * 2, index * 2 + 2).toInt(16).toByte() }
        return InflaterInputStream(ByteArrayInputStream(QrcCipher.crypt(bytes, encrypt = false))).use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) }
    }
    internal fun parseQrc(xml: String): List<LyricLine> {
        val raw = Regex("LyricContent=\"([\\s\\S]*?)\"").find(xml)?.groupValues?.get(1) ?: xml
        return LyricFormats.timedSentences(entities(raw), false)
    }
    private fun fetch(url: String, headers: Map<String, String> = emptyMap()): ByteArray {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
            check(connection.responseCode == 200) { "获取歌词失败" }
            return connection.inputStream.use { it.readBounded(4 * 1024 * 1024) }
        } finally { connection.disconnect() }
    }
    internal fun parseKrc(content: ByteArray): List<LyricLine> {
        require(content.size >= 4 && content.copyOfRange(0, 4).toString(Charsets.US_ASCII) == "krc1") { "歌词数据不完整" }
        val key = byteArrayOf(0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce.toByte(), 0xd2.toByte(), 0x6e, 0x69)
        val payload = content.copyOfRange(4, content.size)
        for (i in payload.indices) payload[i] = (payload[i].toInt() xor key[i % key.size].toInt()).toByte()
        val text = InflaterInputStream(ByteArrayInputStream(payload)).use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) }
        return parseKrcText(text)
    }
    internal fun parseKrcText(text: String): List<LyricLine> {
        val lineTag = Regex("^\\[(\\d+),\\d+](.*)$")
        val offset = Regex("\\[offset:([+-]?\\d+)]", RegexOption.IGNORE_CASE).find(text)?.groupValues?.get(1)?.toLongOrNull() ?: 0
        val language = Regex("\\[language:([^]]+)]").find(text)?.groupValues?.get(1)?.let { encoded ->
            runCatching { JSONObject(Base64.decode(encoded, Base64.DEFAULT).toString(Charsets.UTF_8)).optJSONArray("content") }.getOrNull()
        }
        val main = text.lineSequence().mapNotNull { line ->
            val match = lineTag.matchEntire(line.trim()) ?: return@mapNotNull null
            val time = match.groupValues[1].toLongOrNull() ?: return@mapNotNull null
            LyricFormats.relativeWords((time + offset).coerceAtLeast(0), entities(match.groupValues[2]))
        }.toList()
        fun extended(type: Int, index: Int): String {
            for (i in 0 until (language?.length() ?: 0)) {
                val entry = language!!.optJSONObject(i) ?: continue
                if (entry.optInt("type", -1) != type) continue
                val values = entry.optJSONArray("lyricContent")?.optJSONArray(index) ?: continue
                return entities((0 until values.length()).joinToString("") { values.optString(it) })
            }
            return ""
        }
        return main.mapIndexed { index, line -> line.copy(translation = extended(1, index), romanization = extended(0, index)) }.sortedBy { it.timeMs }
    }
    private fun entities(value: String): String = Regex("&(?:#[xX][0-9a-fA-F]+|#\\d+|[a-zA-Z]+);").replace(value) {
        val entity = it.value
        if (entity.startsWith("&#")) {
            val number = entity.substring(2, entity.length - 1)
            val code = if (number.startsWith("x", true)) number.substring(1).toIntOrNull(16) else number.toIntOrNull()
            if (code != null && Character.isValidCodePoint(code)) String(Character.toChars(code)) else entity
        } else Html.fromHtml(entity, Html.FROM_HTML_MODE_LEGACY).toString()
    }
    private fun get(url: String): JSONObject {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("KG-RC", "1")
            connection.setRequestProperty("KG-THash", "expand_search_manager.cpp:852736169:451")
            connection.setRequestProperty("User-Agent", "KuGou2012-9020-ExpandSearchManager")
            check(connection.responseCode == 200) { "获取歌词失败" }
            return JSONObject(connection.inputStream.use { it.readBounded(4 * 1024 * 1024).toString(Charsets.UTF_8) })
        } finally { connection.disconnect() }
    }
}
