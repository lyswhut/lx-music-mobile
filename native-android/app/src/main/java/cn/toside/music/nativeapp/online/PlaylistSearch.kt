package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.utils.readBounded

import android.text.Html
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest

/** Search public playlists using the same provider protocols as the original application. */
internal class PlaylistSearch {
    suspend fun search(source: String, query: String, page: Int): List<OnlinePlaylist> = withContext(Dispatchers.IO) {
        require(query.isNotBlank() && page > 0)
        val encoded = URLEncoder.encode(query, "UTF-8")
        when (source) {
            "kg" -> {
                val data = get("http://msearchretry.kugou.com/api/v3/search/special?keyword=$encoded&page=$page&pagesize=20&showtype=10&filter=0&version=7910&sver=2")
                check(data.optInt("errcode", -1) == 0) { "酷狗歌单搜索失败" }
                KugouPlaylists().parseLists(data.optJSONObject("data")?.optJSONArray("info") ?: JSONArray())
            }
            "wy" -> {
                val path = "/api/cloudsearch/pc"
                val data = JSONObject().put("s", query).put("type", 1000).put("limit", 20).put("total", page == 1).put("offset", 20 * (page - 1))
                val params = OnlineSearch().eapi(path, data.toString())
                val result = get("http://interface.music.163.com/eapi/batch", form = "params=$params")
                check(result.optInt("code") == 200) { "网易歌单搜索失败" }
                parse(result.optJSONObject("result")?.optJSONArray("playlists") ?: JSONArray(), "wy")
            }
            "tx" -> {
                val data = get("http://c.y.qq.com/soso/fcgi-bin/client_music_search_songlist?page_no=${page - 1}&num_per_page=20&format=json&query=$encoded&remoteplace=txt.yqq.playlist&inCharset=utf8&outCharset=utf-8", mapOf("Referer" to "http://y.qq.com/portal/search.html"))
                check(data.optInt("code", -1) == 0) { "QQ音乐歌单搜索失败" }
                parse(data.optJSONObject("data")?.optJSONArray("list") ?: JSONArray(), "tx")
            }
            "mg" -> {
                val timestamp = System.currentTimeMillis().toString()
                val device = "963B7AA0D21511ED807EE5846EC87D20"
                val sign = MessageDigest.getInstance("MD5").digest("${query}6cdc72a439cef99a3418d2a78aa28c73yyapp2d16148780a1dcc7408e06336b98cfd50$device$timestamp".toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
                val switch = "%7B%22song%22%3A0%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A0%2C%22mvSong%22%3A0%2C%22bestShow%22%3A0%2C%22songlist%22%3A1%2C%22lyricSong%22%3A0%7D"
                val data = get("https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=1&isCopyright=1&searchSwitch=$switch&pageSize=20&text=$encoded&pageNo=$page&sort=0&sid=USS",
                    mapOf("uiVersion" to "A_music_3.6.1", "deviceId" to device, "timestamp" to timestamp, "sign" to sign, "channel" to "0146921"))
                check(data.optString("code") == "000000") { "咪咕歌单搜索失败" }
                parse(data.optJSONObject("songListResultData")?.optJSONArray("result") ?: JSONArray(), "mg")
            }
            "kw" -> {
                val data = get("http://search.kuwo.cn/r.s?all=$encoded&pn=${page - 1}&rn=20&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&ft=playlist&pay=0&needliveshow=0")
                parse(data.optJSONArray("abslist") ?: JSONArray(), "kw")
            }
            else -> error("不支持的歌单平台")
        }
    }

    internal fun parse(items: JSONArray, source: String): List<OnlinePlaylist> = buildList {
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString(when (source) { "tx" -> "dissid"; "kw" -> "playlistid"; else -> "id" })
            if (id.isBlank() || !id.all(Char::isDigit)) continue
            val name = item.optString(if (source == "tx") "dissname" else "name")
            val author = when (source) {
                "wy" -> item.optJSONObject("creator")?.optString("nickname") ?: ""
                "tx" -> item.optJSONObject("creator")?.optString("name") ?: ""
                "mg" -> item.optString("userName")
                else -> item.optString("nickname")
            }
            fun decode(value: String) = Html.fromHtml(value, Html.FROM_HTML_MODE_LEGACY).toString()
            add(OnlinePlaylist(id, if (source == "kw") "8" else "", decode(name), decode(author), source))
        }
    }
    private fun get(url: String, headers: Map<String, String> = emptyMap(), form: String? = null): JSONObject {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 11) AppleWebKit/534.30 Mobile Safari/534.30")
            headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
            if (form != null) {
                connection.requestMethod = "POST"; connection.doOutput = true
                connection.setRequestProperty("Origin", "https://music.163.com")
                connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
                connection.outputStream.use { it.write(form.toByteArray(Charsets.UTF_8)) }
            }
            check(connection.responseCode == 200) { "歌单搜索请求失败：${connection.responseCode}" }
            return JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
        } finally { connection.disconnect() }
    }
}
