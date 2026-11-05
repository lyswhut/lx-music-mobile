package cn.toside.music.nativeapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.text.Html
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class OnlinePlaylist(val id: String, val digest: String, val name: String, val author: String, val source: String = "kw")
internal data class KuwoTag(val id: String, val name: String)
internal data class KuwoCategory(val name: String, val tags: List<KuwoTag>)
internal data class OnlineTag(val id: String, val name: String)
internal data class OnlineTagGroup(val name: String, val tags: List<OnlineTag>)

/** Public recommended playlists and their song metadata. */
class OnlinePlaylists(private val context: android.content.Context? = null) {
    suspend fun recommended(page: Int = 1, source: String = "kw", category: String = "全部"): List<OnlinePlaylist> = withContext(Dispatchers.IO) {
        require(page > 0)
        if (source == "kg") return@withContext KugouPlaylists().recommended(page, if (category == "全部") "" else category)
        if (source == "wy") return@withContext NeteaseApi().recommended(page, category)
        if (source == "tx") {
            if (category != "全部") {
                require(category.isNotBlank() && category.all(Char::isDigit))
                val id = category.toInt()
                val request = JSONObject().put("comm", JSONObject().put("cv", 1602).put("ct", 20))
                    .put("playlist", JSONObject().put("module", "playlist.PlayListCategoryServer").put("method", "get_category_content")
                        .put("param", JSONObject().put("titleid", id).put("caller", "0").put("category_id", id).put("size", 36).put("page", page - 1).put("use_page", 1)))
                val items = qqPost(request).optJSONObject("playlist")?.optJSONObject("data")?.optJSONObject("content")?.optJSONArray("v_item") ?: JSONArray()
                return@withContext parseQqCategoryLists(items)
            }
            val request = JSONObject().put("comm", JSONObject().put("cv", 1602).put("ct", 20))
                .put("playlist", JSONObject().put("module", "music.playlist.PlaylistSquare").put("method", "GetRecommendWhole")
                    .put("param", JSONObject().put("IsReqFeed", true).put("FeedReq", JSONObject().put("From", (page - 1) * 36).put("Size", 36))))
            val data = qqPost(request).optJSONObject("playlist")?.optJSONObject("data")?.optJSONObject("FeedRsp")
            return@withContext parseQqLists(data?.optJSONArray("List") ?: JSONArray())
        }
        if (source == "mg") {
            val url = if (category == "全部") "https://app.c.nf.migu.cn/pc/bmw/page-data/playlist-square-recommend/v1.0?templateVersion=2&pageNo=$page"
                else {
                    require(category.isNotBlank() && category.all(Char::isDigit))
                    "https://app.c.nf.migu.cn/pc/v1.0/template/musiclistplaza-listbytag/release?pageNumber=$page&templateVersion=2&tagId=$category"
                }
            val data = get(url)
            check(data.optString("code") == "000000") { "歌单平台返回错误" }
            return@withContext parseMiguLists(data.optJSONObject("data") ?: JSONObject())
        }
        require(source == "kw")
        if (category != "全部" && category.endsWith("-43")) {
            val id = category.removeSuffix("-43")
            require(id.isNotBlank() && id.all(Char::isDigit))
            if (page > 1) return@withContext emptyList()
            return@withContext parseKuwoSpecialLists(getArray("http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=$id&prod=pc"))
        }
        val url = if (category == "全部") "http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=$page&rn=36&order=hot"
        else {
            val id = category.removeSuffix("-10000")
            require(id.isNotBlank() && id.all(Char::isDigit))
            "http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=$page&id=$id&rn=36"
        }
        val data = get(url)
        check(data.optInt("code") == 200) { "歌单平台返回错误" }
        parseLists(data.getJSONObject("data").optJSONArray("data") ?: JSONArray())
    }
    internal suspend fun qqCategories(): List<OnlineTagGroup> = withContext(Dispatchers.IO) {
        val request = JSONObject().put("tags", JSONObject().put("module", "playlist.PlaylistAllCategoriesServer")
            .put("method", "get_all_categories").put("param", JSONObject().put("qq", "")))
        val groups = qqPost(request).optJSONObject("tags")?.optJSONObject("data")?.optJSONArray("v_group") ?: JSONArray()
        parseQqCategories(groups)
    }
    internal fun parseQqCategories(groups: JSONArray): List<OnlineTagGroup> = buildList {
        for (i in 0 until groups.length()) {
            val group = groups.optJSONObject(i) ?: continue
            val entries = group.optJSONArray("v_item") ?: JSONArray()
            val tags = buildList {
                for (j in 0 until entries.length()) {
                    val item = entries.optJSONObject(j) ?: continue
                    val id = item.optString("id"); val name = item.optString("name")
                    if (id.isNotBlank() && id.all(Char::isDigit) && name.isNotBlank()) add(OnlineTag(id, name))
                }
            }
            if (tags.isNotEmpty()) add(OnlineTagGroup(group.optString("group_name"), tags))
        }
    }
    internal fun parseQqCategoryLists(items: JSONArray): List<OnlinePlaylist> {
        val mapped = JSONArray()
        for (i in 0 until items.length()) {
            val basic = items.optJSONObject(i)?.optJSONObject("basic") ?: continue
            mapped.put(JSONObject().put("Playlist", JSONObject().put("basic", basic)))
        }
        return parseQqLists(mapped)
    }
    internal suspend fun miguCategories(): List<OnlineTagGroup> = withContext(Dispatchers.IO) {
        val data = get("https://app.c.nf.migu.cn/pc/v1.0/template/musiclistplaza-taglist/release")
        check(data.optString("code") == "000000") { "咪咕歌单分类加载失败" }
        parseMiguCategories(data.optJSONArray("data") ?: JSONArray())
    }
    internal fun parseMiguCategories(groups: JSONArray): List<OnlineTagGroup> = buildList {
        for (i in 0 until groups.length()) {
            val group = groups.optJSONObject(i) ?: continue
            val entries = group.optJSONArray("content") ?: JSONArray()
            val tags = buildList {
                for (j in 0 until entries.length()) {
                    val texts = entries.optJSONObject(j)?.optJSONArray("texts") ?: continue
                    val name = texts.optString(0); val id = texts.optString(1)
                    if (id.isNotBlank() && id.all(Char::isDigit) && name.isNotBlank()) add(OnlineTag(id, name))
                }
            }
            if (tags.isNotEmpty()) add(OnlineTagGroup(group.optJSONObject("header")?.optString("title")?.ifBlank { "热门" } ?: "热门", tags))
        }
    }
    internal suspend fun kuwoCategories(): List<KuwoCategory> = withContext(Dispatchers.IO) {
        val data = get("http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576")
        check(data.optInt("code") == 200) { "酷我歌单分类加载失败" }
        parseKuwoCategories(data.optJSONArray("data") ?: JSONArray())
    }
    internal fun parseKuwoCategories(items: JSONArray): List<KuwoCategory> = buildList {
        for (i in 0 until items.length()) {
            val group = items.optJSONObject(i) ?: continue
            val children = group.optJSONArray("data") ?: JSONArray()
            val tags = buildList {
                for (j in 0 until children.length()) {
                    val item = children.optJSONObject(j) ?: continue
                    val id = item.optString("id"); val name = item.optString("name")
                    val digest = item.optString("digest")
                    if (id.isNotBlank() && id.all(Char::isDigit) && digest in setOf("10000", "43") && name.isNotBlank()) add(KuwoTag("$id-$digest", name))
                }
            }
            if (tags.isNotEmpty()) add(KuwoCategory(group.optString("name"), tags))
        }
    }
    internal fun parseKuwoSpecialLists(groups: JSONArray): List<OnlinePlaylist> {
        val items = JSONArray()
        for (i in 0 until groups.length()) {
            val entries = groups.optJSONObject(i)?.optJSONArray("list") ?: continue
            for (j in 0 until entries.length()) {
                val item = entries.optJSONObject(j) ?: continue
                if (item.optString("type") in setOf("songlist", "list", "album")) items.put(item)
            }
        }
        return parseLists(items)
    }
    internal fun parseQqLists(items: JSONArray): List<OnlinePlaylist> = buildList {
        for (i in 0 until items.length()) {
            val basic = items.optJSONObject(i)?.optJSONObject("Playlist")?.optJSONObject("basic") ?: continue
            val id = basic.optString("tid")
            if (id.isBlank() || !id.all(Char::isDigit)) continue
            fun decoded(value: String) = Html.fromHtml(value, Html.FROM_HTML_MODE_LEGACY).toString()
            add(OnlinePlaylist(id, "", decoded(basic.optString("title")), decoded(basic.optJSONObject("creator")?.optString("nick") ?: ""), "tx"))
        }
    }
    internal fun parseMiguLists(data: JSONObject): List<OnlinePlaylist> {
        val result = mutableListOf<OnlinePlaylist>()
        val ids = mutableSetOf<String>()
        fun walk(items: JSONArray) {
            for (i in 0 until items.length()) {
                val item = items.optJSONObject(i) ?: continue
                val children = item.optJSONArray("contents")
                if (children != null) walk(children)
                else if (item.optString("resType") == "2021") {
                    val id = item.optString("resId")
                    if (id.isNotBlank() && id.all(Char::isDigit) && ids.add(id))
                        result.add(OnlinePlaylist(id, "", item.optString("txt"), "", "mg"))
                }
            }
        }
        val contents = data.optJSONArray("contents")
        if (contents != null) walk(contents)
        else {
            val items = data.optJSONArray("contentItemList")?.optJSONObject(1)?.optJSONArray("itemList") ?: JSONArray()
            for (i in 0 until items.length()) {
                val item = items.optJSONObject(i) ?: continue
                val id = item.optJSONObject("logEvent")?.optString("contentId") ?: continue
                if (id.isNotBlank() && id.all(Char::isDigit) && ids.add(id))
                    result.add(OnlinePlaylist(id, "", item.optString("title"), "", "mg"))
            }
        }
        return result
    }
    internal fun parseLists(items: JSONArray): List<OnlinePlaylist> = buildList {
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString("id"); val digest = item.optString("digest")
            if (id.isBlank() || !id.all(Char::isDigit) || digest !in setOf("5", "8", "13")) continue
            add(OnlinePlaylist(id, digest, item.optString("name"), item.optString("uname")))
        }
    }
    suspend fun songs(list: OnlinePlaylist, page: Int): List<Song> = withContext(Dispatchers.IO) {
        if (list.source == "kg") return@withContext if (list.id.contains(':')) KugouSharedPlaylists().songs(list.id, page) else KugouPlaylists().songs(list.id, page)
        if (list.source == "wy") return@withContext NeteaseApi().playlistSongs(list.id, page, context?.let { PlaylistCredentials(it).load(list.id) })
        if (list.source == "tx") {
            require(list.id.isNotBlank() && list.id.all(Char::isDigit) && page > 0)
            val param = JSONObject().put("disstid", list.id.toLong()).put("userinfo", 1).put("tag", 1).put("orderlist", 1)
                .put("song_begin", (page - 1) * 100).put("song_num", 100).put("onlysonglist", 0).put("enc_host_uin", "")
            val request = JSONObject().put("comm", JSONObject().put("cv", 4747474).put("ct", 24).put("format", "json").put("uin", 0))
                .put("req_1", JSONObject().put("module", "music.srfDissInfo.aiDissInfo").put("method", "uniform_get_Dissinfo").put("param", param))
            val response = qqPost(request).optJSONObject("req_1") ?: error("歌单详情加载失败")
            check(response.optInt("code", -1) == 0) { "歌单详情加载失败" }
            return@withContext OnlineSearch().parseTx(response.optJSONObject("data")?.optJSONArray("songlist") ?: JSONArray())
        }
        if (list.source == "mg") {
            require(list.id.isNotBlank() && list.id.all(Char::isDigit) && page > 0)
            val data = get("https://app.c.nf.migu.cn/MIGUM3.0/resource/playlist/song/v2.0?pageNo=$page&pageSize=30&playlistId=${list.id}")
            check(data.optString("code") == "000000") { "歌单详情加载失败" }
            return@withContext parseMiguSongs(data.optJSONObject("data")?.optJSONArray("songList") ?: JSONArray())
        }
        require(list.source == "kw")
        require(list.id.all(Char::isDigit) && page > 0 && list.digest in setOf("5", "8", "13"))
        if (list.digest == "13") {
            val data = get("http://search.kuwo.cn/r.s?pn=${page - 1}&rn=100&stype=albuminfo&albumid=${list.id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0")
            return@withContext parseKuwoAlbum(data)
        }
        val id = if (list.digest == "5") {
            val metadata = get("http://qukudata.kuwo.cn/q.k?op=query&cont=ninfo&node=${list.id}&pn=0&rn=1&fmt=json&src=mbox&level=2")
            val sourceId = metadata.optJSONArray("child")?.optJSONObject(0)?.optString("sourceid") ?: error("歌单不存在")
            require(sourceId.isNotBlank() && sourceId.all(Char::isDigit)) { "歌单编号无效" }
            sourceId
        } else list.id
        val data = get("http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=$id&pn=${page - 1}&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1")
        check(data.optString("result") == "ok") { "歌单详情加载失败" }
        parseSongs(data.optJSONArray("musiclist") ?: JSONArray())
    }
    internal fun parseKuwoAlbum(data: JSONObject): List<Song> {
        val entries = data.optJSONArray("musiclist") ?: JSONArray()
        val mapped = JSONArray(); val images = mutableMapOf<String, String>()
        for (i in 0 until entries.length()) {
            val item = entries.optJSONObject(i) ?: continue
            val formats = item.optString("formats").split('|').toSet()
            val qualities = listOf("MP3128" to "128", "MP3H" to "320", "ALFLAC" to "2000", "HIRFLAC" to "4000")
                .filter { it.first in formats }.joinToString(";") { "level:1,bitrate:${it.second},format:flac,size:0" }
            val id = item.optString("id"); images[id] = item.optString("pic")
            mapped.put(JSONObject().put("MUSICRID", id).put("SONGNAME", item.optString("name"))
                .put("ARTIST", item.optString("artist")).put("DURATION", item.optLong("duration"))
                .put("ALBUM", data.optString("name")).put("ALBUMID", data.opt("albumid") ?: "").put("N_MINFO", qualities))
        }
        return OnlineSearch().parseKw(mapped).map { song ->
            val info = JSONObject(song.sourceInfo!!)
            song.copy(sourceInfo = info.put("img", images[info.optString("songmid")] ?: "").toString())
        }
    }
    private fun qqPost(request: JSONObject): JSONObject {
        val connection = URL("https://u.y.qq.com/cgi-bin/musicu.fcg").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Origin", "https://y.qq.com")
            connection.setRequestProperty("Referer", "https://y.qq.com/")
            connection.outputStream.use { it.write(request.toString().toByteArray(Charsets.UTF_8)) }
            check(connection.responseCode == 200) { "歌单请求失败：${connection.responseCode}" }
            val data = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(data.optInt("code", -1) == 0) { "歌单平台返回错误" }
            return data
        } finally { connection.disconnect() }
    }
    internal fun parseMiguSongs(items: JSONArray): List<Song> {
        val normalized = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            // The playlist endpoint uses songName; the search endpoint uses name.
            val mapped = JSONObject(item.toString()).put("name", item.optString("songName"))
            mapped.put("mrcurl", item.optString("mrcUrl"))
            val formats = mapped.optJSONArray("audioFormats") ?: JSONArray()
            for (j in 0 until formats.length()) {
                val format = formats.optJSONObject(j) ?: continue
                if (format.optString("formatType") == "ZQ") format.put("formatType", "ZQ24")
            }
            normalized.put(mapped)
        }
        return OnlineSearch().parseMg(JSONArray().put(normalized))
    }
    internal fun parseSongs(items: JSONArray): List<Song> {
        val mapped = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            mapped.put(JSONObject().put("MUSICRID", item.opt("id") ?: "").put("SONGNAME", item.optString("name"))
                .put("ARTIST", item.optString("artist")).put("DURATION", item.opt("duration") ?: 0)
                .put("ALBUM", item.optString("album")).put("ALBUMID", item.opt("albumid") ?: "")
                .put("N_MINFO", item.optString("N_MINFO")))
        }
        return OnlineSearch().parseKw(mapped)
    }
    private fun get(url: String): JSONObject {
        return JSONObject(getText(url))
    }
    private fun getArray(url: String): JSONArray = JSONArray(getText(url))
    private fun getText(url: String): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            check(connection.responseCode == 200) { "歌单请求失败：${connection.responseCode}" }
            return connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) }
        } finally { connection.disconnect() }
    }
}
