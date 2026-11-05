package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.utils.readBounded

import android.text.Html
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal data class KugouTag(val id: String, val name: String)
internal data class KugouCategory(val name: String, val tags: List<KugouTag>)

/** Public Kugou playlists use the original web listing and audio metadata endpoints. */
internal class KugouPlaylists {
    fun recommended(page: Int, category: String = ""): List<OnlinePlaylist> {
        require(page > 0 && (category.isEmpty() || category.all(Char::isDigit)))
        val response = JSONObject(request("http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=5&c=$category&p=$page"))
        check(response.optInt("status") == 1) { "酷狗歌单加载失败" }
        return parseLists(response.optJSONArray("special_db") ?: JSONArray())
    }

    fun categories(): List<KugouCategory> {
        val response = JSONObject(request("http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&"))
        check(response.optInt("status") == 1) { "酷狗歌单分类加载失败" }
        return parseCategories(response.optJSONObject("data")?.optJSONObject("tagids") ?: JSONObject())
    }

    internal fun parseCategories(groups: JSONObject): List<KugouCategory> = buildList {
        groups.keys().forEach { name ->
            val items = groups.optJSONObject(name)?.optJSONArray("data") ?: JSONArray()
            val tags = buildList {
                for (i in 0 until items.length()) {
                    val item = items.optJSONObject(i) ?: continue
                    val id = item.optString("id"); val title = item.optString("name")
                    if (id.isNotBlank() && id.all(Char::isDigit) && title.isNotBlank()) add(KugouTag(id, decode(title)))
                }
            }
            if (tags.isNotEmpty()) add(KugouCategory(decode(name), tags))
        }
    }

    internal fun parseLists(items: JSONArray): List<OnlinePlaylist> = buildList {
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString("specialid")
            if (id.isBlank() || !id.all(Char::isDigit)) continue
            add(OnlinePlaylist(id, "", decode(item.optString("specialname")), decode(item.optString("nickname")), "kg"))
        }
    }

    fun songs(id: String, page: Int): List<Song> {
        require(id.isNotBlank() && id.all(Char::isDigit) && page > 0)
        val html = request("http://www2.kugou.kugou.com/yueku/v9/special/single/$id-5-9999.html")
        val json = Regex("global\\.data\\s*=\\s*(\\[.*?]);", setOf(RegexOption.DOT_MATCHES_ALL)).find(html)?.groupValues?.get(1)
            ?: error("无法读取酷狗歌单歌曲")
        val hashes = JSONArray(json)
        val unique = mutableSetOf<String>()
        val entries = mutableListOf<JSONObject>()
        for (i in 0 until hashes.length()) {
            val hash = hashes.optJSONObject(i)?.optString("hash") ?: continue
            if (hash.isNotBlank() && unique.add(hash)) entries.add(JSONObject().put("hash", hash))
        }
        val pageEntries = entries.drop((page - 1) * 100).take(100)
        return metadata(pageEntries)
    }
    internal fun metadata(pageEntries: List<JSONObject>): List<Song> {
        if (pageEntries.isEmpty()) return emptyList()
        val body = JSONObject().put("area_code", "1").put("show_privilege", 1).put("show_album_info", "1")
            .put("is_publish", "").put("appid", 1005).put("clientver", 11451).put("mid", "1").put("dfid", "-")
            .put("clienttime", System.currentTimeMillis()).put("key", "OIlwieks28dk2k092lksi2UIkp")
            .put("fields", "album_info,author_name,audio_info,ori_audio_name,base,songname").put("data", JSONArray(pageEntries))
        val response = JSONObject(request("http://gateway.kugou.com/v2/album_audio/audio", body))
        check(response.optInt("error_code", response.optInt("errcode", response.optInt("err_code", -1))) == 0) { "酷狗歌曲信息加载失败" }
        return parseSongs(response.optJSONArray("data") ?: JSONArray())
    }

    internal fun parseSongs(items: JSONArray): List<Song> {
        val mapped = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONArray(i)?.optJSONObject(0) ?: items.optJSONObject(i) ?: continue
            val audio = item.optJSONObject("audio_info") ?: continue
            val album = item.optJSONObject("album_info") ?: JSONObject()
            val authors = JSONArray().put(JSONObject().put("author_name", item.optString("author_name")))
            mapped.put(JSONObject().put("audio_id", audio.opt("audio_id") ?: "").put("hash", audio.optString("hash"))
                .put("songname", item.optString("songname")).put("duration", audio.optLong("timelength") / 1000)
                .put("authors", authors).put("remark", album.optString("album_name")).put("album_id", album.opt("album_id") ?: "")
                .put("filesize", audio.optLong("filesize")).put("320filesize", audio.optLong("filesize_320"))
                .put("320hash", audio.optString("hash_320")).put("sqfilesize", audio.optLong("filesize_flac"))
                .put("sqhash", audio.optString("hash_flac")).put("filesize_high", audio.optLong("filesize_high"))
                .put("hash_high", audio.optString("hash_high")))
        }
        return OnlineBoards().parse(mapped)
    }

    private fun request(url: String, body: JSONObject? = null): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("User-Agent", if (body == null) "Mozilla/5.0" else "Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi")
            if (body != null) {
                connection.requestMethod = "POST"; connection.doOutput = true
                mapOf("Content-Type" to "application/json", "KG-THash" to "13a3164", "KG-RC" to "1", "KG-Fake" to "0", "KG-RF" to "00869891", "x-router" to "kmr.service.kugou.com")
                    .forEach { (key, value) -> connection.setRequestProperty(key, value) }
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            check(connection.responseCode == 200) { "酷狗歌单请求失败：${connection.responseCode}" }
            return connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) }
        } finally { connection.disconnect() }
    }
    private fun decode(value: String) = Html.fromHtml(value, Html.FROM_HTML_MODE_LEGACY).toString()
}
