package cn.toside.music.nativeapp

import android.net.Uri
import android.text.Html
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.util.UUID
import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

/** Port of the original Kugou search endpoint and LX source song-info schema. */
class OnlineSearch {
    suspend fun search(query: String, page: Int = 1, source: String = "kg"): List<Song> = withContext(Dispatchers.IO) {
        require(query.isNotBlank())
        val encoded = URLEncoder.encode(query, "UTF-8")
        when (source) {
            "kg" -> searchKg(encoded, page)
            "kw" -> searchKw(encoded, page)
            "tx" -> searchTx(query, page)
            "wy" -> searchWy(query, page)
            "mg" -> searchMg(query, encoded, page)
            else -> error("不支持的搜索平台")
        }
    }
    private fun get(url: String): JSONObject {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            check(connection.responseCode == 200) { "搜索请求失败：${connection.responseCode}" }
            return JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
        } finally { connection.disconnect() }
    }
    private fun searchKg(encoded: String, page: Int): List<Song> {
        val result = get("https://songsearch.kugou.com/song_search_v2?keyword=$encoded&page=$page&pagesize=30&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0&area_code=1")
        check(result.optInt("error_code", -1) == 0) { "音乐平台返回错误" }
        return parse(result.getJSONObject("data").optJSONArray("lists") ?: JSONArray())
    }
    private fun searchKw(encoded: String, page: Int): List<Song> {
        val result = get("http://search.kuwo.cn/r.s?client=kt&all=$encoded&pn=${page - 1}&rn=30&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1")
        check(result.optString("TOTAL") == "0" || result.optString("SHOW") != "0") { "音乐平台返回错误" }
        return parseKw(result.optJSONArray("abslist") ?: JSONArray())
    }
    internal fun parseKw(items: JSONArray): List<Song> = buildList {
        val qualityPattern = Regex("level:(\\w+),bitrate:(\\d+),format:(\\w+),size:([\\w.]+)")
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString("MUSICRID").removePrefix("MUSIC_")
            if (id.isBlank()) continue
            val title = decode(item.optString("SONGNAME"))
            val artist = decode(item.optString("ARTIST")).replace("&", "、")
            val duration = item.optLong("DURATION", 0).coerceAtLeast(0)
            val types = JSONArray(); val typeMap = JSONObject()
            item.optString("N_MINFO").split(';').forEach { quality ->
                val match = qualityPattern.find(quality) ?: return@forEach
                val type = when (match.groupValues[2]) { "128" -> "128k"; "320" -> "320k"; "2000" -> "flac"; "4000" -> "flac24bit"; else -> return@forEach }
                val size = match.groupValues[4]
                types.put(JSONObject().put("type", type).put("size", size))
                typeMap.put(type, JSONObject().put("size", size.uppercase()))
            }
            val info = JSONObject().put("name", title).put("singer", artist).put("source", "kw").put("songmid", id)
                .put("albumName", decode(item.optString("ALBUM"))).put("albumId", decode(item.optString("ALBUMID")))
                .put("interval", "%02d:%02d".format(duration / 60, duration % 60)).put("img", "")
                .put("types", types).put("_types", typeMap).put("typeUrl", JSONObject())
            add(Song(id.toLongOrNull() ?: id.hashCode().toLong(), Uri.EMPTY, title, artist, duration * 1000, "kw", info.toString()))
        }
    }
    private fun searchTx(query: String, page: Int): List<Song> {
        val searchId = UUID.randomUUID().toString().replace("-", "").uppercase() + "%05d".format((Math.random() * 100000).toInt())
        val comm = JSONObject().put("_channelid", "0").put("_os_version", "6.2.9200-2").put("ct", "19").put("cv", "2151")
            .put("guid", "1F70E520B2EAA7D25E11760783C53CA9").put("patch", "118").put("psrf_access_token_expiresAt", 0)
            .put("psrf_qqaccess_token", "").put("psrf_qqopenid", "").put("psrf_qqunionid", "").put("tmeAppID", "qqmusic")
            .put("tmeLoginType", 0).put("uin", "0").put("wid", "7223299733393904640")
        val param = JSONObject().put("grp", 1).put("num_per_page", 30).put("page_num", page).put("query", query)
            .put("remoteplace", "txt.newclient.top").put("search_type", 0).put("searchid", searchId)
        val data = JSONObject().put("comm", comm).put("music.search.SearchCgiService", JSONObject()
            .put("module", "music.search.SearchCgiService").put("method", "DoSearchForQQMusicDesktop").put("param", param)).toString()
        val connection = URL("https://u.y.qq.com/cgi-bin/musics.fcg?sign=${signTx(data)}").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000; connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("User-Agent", "QQMusic 14090508(android 12)")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(data.toByteArray()) }
            check(connection.responseCode == 200) { "搜索请求失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            val req = result.optJSONObject("music.search.SearchCgiService") ?: result.getJSONObject("req")
            check(result.optInt("code", -1) == 0 && req.optInt("code", -1) == 0) { "音乐平台返回错误" }
            return parseTx(req.getJSONObject("data").getJSONObject("body").getJSONObject("song").optJSONArray("list") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    internal fun signTx(data: String): String {
        val hash = MessageDigest.getInstance("SHA-1").digest(data.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
        fun pick(vararg indexes: Int) = indexes.asSequence().mapNotNull { hash.getOrNull(it) }.joinToString("")
        val scramble = intArrayOf(89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179)
        val bytes = ByteArray(20) { i -> (scramble[i] xor hash.substring(i * 2, i * 2 + 2).toInt(16)).toByte() }
        val middle = Base64.encodeToString(bytes, Base64.NO_WRAP).replace(Regex("[\\\\/+=]"), "")
        return "zzc${pick(23, 14, 6, 36, 16, 40, 7, 19)}$middle${pick(16, 1, 32, 12, 19, 27, 8, 5)}".lowercase()
    }
    internal fun parseTx(items: JSONArray): List<Song> = buildList {
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val file = item.optJSONObject("file") ?: continue
            val mediaMid = file.optString("media_mid"); val mid = item.optString("mid")
            if (mid.isBlank() || mediaMid.isBlank()) continue
            val singers = item.optJSONArray("singer") ?: JSONArray()
            val singer = decode((0 until singers.length()).mapNotNull { singers.optJSONObject(it)?.optString("name") }.joinToString("、"))
            val title = item.optString("title"); val album = item.optJSONObject("album") ?: JSONObject()
            val duration = item.optLong("interval", 0).coerceAtLeast(0)
            val types = JSONArray(); val typeMap = JSONObject()
            listOf("128k" to "size_128mp3", "320k" to "size_320mp3", "flac" to "size_flac", "flac24bit" to "size_hires").forEach { (type, field) ->
                if (file.optLong(field) > 0) { types.put(JSONObject().put("type", type).put("size", JSONObject.NULL)); typeMap.put(type, JSONObject().put("size", JSONObject.NULL)) }
            }
            val albumId = album.optString("mid")
            val info = JSONObject().put("name", title).put("singer", singer).put("source", "tx").put("songmid", mid)
                .put("songId", item.opt("id") ?: "").put("albumMid", albumId).put("strMediaMid", mediaMid)
                .put("albumName", album.optString("name")).put("albumId", albumId)
                .put("interval", "%02d:%02d".format(duration / 60, duration % 60)).put("img", if (albumId.isBlank()) "" else "https://y.gtimg.cn/music/photo_new/T002R500x500M000$albumId.jpg")
                .put("types", types).put("_types", typeMap).put("typeUrl", JSONObject())
            add(Song(mid.hashCode().toLong(), Uri.EMPTY, title, singer, duration * 1000, "tx", info.toString()))
        }
    }
    private fun searchMg(query: String, encoded: String, page: Int): List<Song> {
        val timestamp = System.currentTimeMillis().toString()
        val device = "963B7AA0D21511ED807EE5846EC87D20"
        val signature = md5("${query}6cdc72a439cef99a3418d2a78aa28c73yyapp2d16148780a1dcc7408e06336b98cfd50$device$timestamp")
        val url = "https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=20&text=$encoded&pageNo=$page&sort=0&sid=USS"
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            mapOf("uiVersion" to "A_music_3.6.1", "deviceId" to device, "timestamp" to timestamp, "sign" to signature,
                "channel" to "0146921", "User-Agent" to "Mozilla/5.0 (Linux; Android 11) AppleWebKit/534.30 Mobile Safari/534.30")
                .forEach { (key, value) -> connection.setRequestProperty(key, value) }
            check(connection.responseCode == 200) { "搜索请求失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optString("code") == "000000") { result.optString("info", "音乐平台返回错误") }
            return parseMg(result.optJSONObject("songResultData")?.optJSONArray("resultList") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    internal fun parseMg(groups: JSONArray): List<Song> = buildList {
        val ids = mutableSetOf<String>()
        for (i in 0 until groups.length()) {
            val group = groups.optJSONArray(i) ?: continue
            for (j in 0 until group.length()) {
                val item = group.optJSONObject(j) ?: continue
                val id = item.optString("songId"); val copyright = item.optString("copyrightId")
                if (id.isBlank() || !ids.add(copyright.ifBlank { id })) continue
                val singers = item.optJSONArray("singerList") ?: JSONArray()
                val singer = decode((0 until singers.length()).mapNotNull { singers.optJSONObject(it)?.optString("name") }.joinToString("、"))
                val title = item.optString("name"); val duration = item.optLong("duration", 0).coerceAtLeast(0)
                val types = JSONArray(); val typeMap = JSONObject(); val formats = item.optJSONArray("audioFormats") ?: JSONArray()
                for (k in 0 until formats.length()) {
                    val format = formats.optJSONObject(k) ?: continue
                    val type = when (format.optString("formatType")) { "PQ" -> "128k"; "HQ" -> "320k"; "SQ" -> "flac"; "ZQ24" -> "flac24bit"; else -> continue }
                    types.put(JSONObject().put("type", type).put("size", JSONObject.NULL)); typeMap.put(type, JSONObject().put("size", JSONObject.NULL))
                }
                val info = JSONObject().put("name", title).put("singer", singer).put("source", "mg").put("songmid", id)
                    .put("copyrightId", copyright).put("albumName", item.optString("album")).put("albumId", item.opt("albumId") ?: "")
                    .put("interval", "%02d:%02d".format(duration / 60, duration % 60))
                    .put("img", item.optString("img3", item.optString("img2", item.optString("img1"))))
                    .put("lrcUrl", item.optString("lrcUrl")).put("mrcUrl", item.optString("mrcurl")).put("trcUrl", item.optString("trcUrl"))
                    .put("types", types).put("_types", typeMap).put("typeUrl", JSONObject())
                add(Song(id.toLongOrNull() ?: id.hashCode().toLong(), Uri.EMPTY, title, singer, duration * 1000, "mg", info.toString()))
            }
        }
    }
    private fun searchWy(query: String, page: Int): List<Song> {
        val path = "/api/search/song/list/page"
        val data = JSONObject().put("keyword", query).put("needCorrect", "1").put("channel", "typing")
            .put("offset", 20 * (page - 1)).put("scene", "normal").put("total", page == 1).put("limit", 20).toString()
        val params = eapi(path, data)
        val connection = URL("http://interface.music.163.com/eapi/batch").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000; connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/60.0.3112.90 Safari/537.36")
            connection.setRequestProperty("Origin", "https://music.163.com")
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connection.outputStream.use { it.write("params=$params".toByteArray()) }
            check(connection.responseCode == 200) { "搜索请求失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optInt("code") == 200) { "音乐平台返回错误" }
            return parseWy(result.getJSONObject("data").optJSONArray("resources") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    private fun md5(data: String) = MessageDigest.getInstance("MD5").digest(data.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
    internal fun eapi(path: String, data: String): String {
        val digest = md5("nobody${path}use${data}md5forencrypt")
        val message = "$path-36cd479b6b5-$data-36cd479b6b5-$digest"
        val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec("e82ckenh8dichen8".toByteArray(), "AES"))
        return cipher.doFinal(message.toByteArray()).joinToString("") { "%02X".format(it.toInt() and 255) }
    }
    internal fun parseWy(resources: JSONArray): List<Song> = buildList {
        for (i in 0 until resources.length()) {
            val item = resources.optJSONObject(i)?.optJSONObject("baseInfo")?.optJSONObject("simpleSongData") ?: continue
            val id = item.optString("id"); if (id.isBlank()) continue
            val singers = item.optJSONArray("ar") ?: JSONArray()
            val singer = (0 until singers.length()).mapNotNull { singers.optJSONObject(it)?.optString("name") }.joinToString("、")
            val album = item.optJSONObject("al") ?: JSONObject(); val privilege = item.optJSONObject("privilege") ?: JSONObject()
            val title = item.optString("name"); val duration = item.optLong("dt", 0).coerceAtLeast(0)
            val types = JSONArray(); val typeMap = JSONObject(); val bitrate = privilege.optInt("maxbr")
            fun quality(type: String) { types.put(JSONObject().put("type", type).put("size", JSONObject.NULL)); typeMap.put(type, JSONObject().put("size", JSONObject.NULL)) }
            if (bitrate >= 128000) quality("128k")
            if (bitrate >= 320000) quality("320k")
            if (bitrate >= 999000) quality("flac")
            if (privilege.optString("maxBrLevel") == "hires") quality("flac24bit")
            val info = JSONObject().put("name", title).put("singer", singer).put("source", "wy").put("songmid", item.opt("id") ?: id)
                .put("albumName", album.optString("name")).put("albumId", album.opt("id") ?: "")
                .put("interval", "%02d:%02d".format(duration / 60000, duration / 1000 % 60)).put("img", album.optString("picUrl"))
                .put("types", types).put("_types", typeMap).put("typeUrl", JSONObject())
            add(Song(id.toLongOrNull() ?: id.hashCode().toLong(), Uri.EMPTY, title, singer, duration, "wy", info.toString()))
        }
    }

    internal fun parse(list: JSONArray): List<Song> = buildList {
        val ids = mutableSetOf<String>()
        for (i in 0 until list.length()) {
            val item = list.optJSONObject(i) ?: continue
            val hash = item.optString("FileHash")
            val songId = item.optString("Audioid")
            if (songId.isBlank() || !ids.add("$songId:$hash")) continue
            val singers = item.optJSONArray("Singers") ?: JSONArray()
            val artist = (0 until singers.length()).mapNotNull { singers.optJSONObject(it)?.optString("name") }.filter { it.isNotBlank() }.joinToString("、")
            val name = decode(item.optString("OriSongName") + item.optString("Suffix").let { if (it.isBlank()) "" else " $it" })
            val duration = item.optLong("Duration", 0).coerceAtLeast(0)
            val qualities = JSONArray()
            val typeMap = JSONObject()
            listOf(Triple("128k", "FileSize", "FileHash"), Triple("320k", "HQFileSize", "HQFileHash"),
                Triple("flac", "SQFileSize", "SQFileHash"), Triple("flac24bit", "ResFileSize", "ResFileHash")).forEach { (type, sizeKey, hashKey) ->
                if (item.optLong(sizeKey, 0) > 0) {
                    val quality = JSONObject().put("size", JSONObject.NULL).put("hash", item.optString(hashKey))
                    typeMap.put(type, quality)
                    qualities.put(JSONObject().put("type", type).put("size", JSONObject.NULL).put("hash", item.optString(hashKey)))
                }
            }
            val info = JSONObject().put("name", name).put("singer", decode(artist)).put("source", "kg")
                .put("songmid", item.opt("Audioid")).put("albumName", decode(item.optString("AlbumName")))
                .put("albumId", item.opt("AlbumID") ?: "").put("hash", hash).put("interval", "%02d:%02d".format(duration / 60, duration % 60))
                .put("img", "").put("types", qualities).put("_types", typeMap).put("typeUrl", JSONObject())
            add(Song(songId.toLongOrNull() ?: songId.hashCode().toLong(), Uri.EMPTY, name, decode(artist), duration * 1000, "kg", info.toString()))
        }
    }
    private fun decode(value: String): String = Html.fromHtml(value, Html.FROM_HTML_MODE_LEGACY).toString()
}
