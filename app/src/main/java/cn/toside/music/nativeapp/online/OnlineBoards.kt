package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.utils.readBounded

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Board(val id: String, val name: String, val source: String = "kg")

/** Kugou charts and their original LX source metadata. */
class OnlineBoards {
    val boards = listOf(
        Board("8888", "TOP500"), Board("6666", "飙升榜"), Board("59703", "蜂鸟流行音乐榜"),
        Board("52144", "抖音热歌榜"), Board("52767", "快手热歌榜"), Board("24971", "DJ热歌榜"),
        Board("23784", "网络红歌榜"), Board("44412", "说唱先锋榜"), Board("31308", "内地榜"),
        Board("33160", "电音榜"), Board("31313", "香港地区榜"), Board("51341", "民谣榜"),
        Board("54848", "台湾地区榜"), Board("31310", "欧美榜"), Board("33162", "ACG新歌榜"),
        Board("31311", "韩国榜"), Board("31312", "日本榜"), Board("49225", "80后热歌榜"),
        Board("49223", "90后热歌榜"), Board("49224", "00后热歌榜"), Board("33165", "粤语金曲榜"),
        Board("33166", "欧美金曲榜"), Board("33163", "影视金曲榜"), Board("51340", "伤感榜"),
        Board("35811", "会员专享榜"), Board("37361", "雷达榜"), Board("21101", "分享榜"),
        Board("46910", "综艺新歌榜"), Board("30972", "酷狗音乐人原创榜"), Board("60170", "闽南语榜"),
        Board("65234", "儿歌榜"), Board("4681", "美国BillBoard榜"), Board("25028", "Beatport电子舞曲榜"),
        Board("4680", "英国单曲榜"), Board("38623", "韩国Melon音乐榜"), Board("42807", "joox本地热歌榜"),
        Board("36107", "小语种热歌榜"), Board("4673", "日本公信榜"), Board("46868", "日本SPACE SHOWER榜"),
        Board("42808", "KKBOX风云榜"), Board("60171", "越南语榜"), Board("60172", "泰语榜"),
        Board("59895", "R&B榜"), Board("59896", "摇滚榜"), Board("59897", "爵士榜"),
        Board("59898", "乡村音乐榜"), Board("59900", "纯音乐榜"), Board("59899", "古典榜"),
        Board("22603", "5sing音乐榜"), Board("21335", "繁星音乐榜"), Board("33161", "古风新歌榜")
    )
    val qqBoards = listOf(
        Board("4", "流行指数榜", "tx"), Board("26", "热歌榜", "tx"), Board("27", "新歌榜", "tx"),
        Board("62", "飙升榜", "tx"), Board("58", "说唱榜", "tx"), Board("57", "电音榜", "tx"),
        Board("28", "网络歌曲榜", "tx"), Board("5", "内地榜", "tx"), Board("3", "欧美榜", "tx"),
        Board("59", "香港地区榜", "tx"), Board("16", "韩国榜", "tx"), Board("60", "抖快榜", "tx"),
        Board("29", "影视金曲榜", "tx"), Board("17", "日本榜", "tx"), Board("52", "腾讯音乐人原创榜", "tx"),
        Board("36", "K歌金曲榜", "tx"), Board("61", "台湾地区榜", "tx"), Board("63", "DJ舞曲榜", "tx"),
        Board("64", "综艺新歌榜", "tx"), Board("65", "国风热歌榜", "tx"), Board("67", "听歌识曲榜", "tx"),
        Board("72", "动漫音乐榜", "tx"), Board("73", "游戏音乐榜", "tx"), Board("75", "有声榜", "tx"),
        Board("131", "校园音乐人排行榜", "tx")
    )
    val wyBoards = listOf(
        Board("19723756", "飙升榜", "wy"), Board("3779629", "新歌榜", "wy"), Board("2884035", "原创榜", "wy"),
        Board("3778678", "热歌榜", "wy"), Board("991319590", "说唱榜", "wy"), Board("71384707", "古典榜", "wy"),
        Board("1978921795", "电音榜", "wy"), Board("71385702", "ACG榜", "wy"), Board("745956260", "韩语榜", "wy"),
        Board("10520166", "国电榜", "wy"), Board("180106", "UK排行榜周榜", "wy"), Board("60198", "美国Billboard榜", "wy"),
        Board("3812895", "Beatport全球电子舞曲榜", "wy"), Board("21845217", "KTV唛榜", "wy"), Board("60131", "日本Oricon榜", "wy"),
        Board("2809513713", "欧美热歌榜", "wy"), Board("2809577409", "欧美新歌榜", "wy"), Board("5059644681", "日语榜", "wy"),
        Board("5059633707", "摇滚榜", "wy"), Board("5059642708", "国风榜", "wy"), Board("5059661515", "民谣榜", "wy"),
        Board("6723173524", "网络热歌榜", "wy"), Board("6886768100", "中文DJ榜", "wy")
    )
    val miguBoards = listOf(
        Board("27553319", "新歌榜", "mg"), Board("27186466", "热歌榜", "mg"), Board("27553408", "原创榜", "mg"),
        Board("75959118", "音乐风向榜", "mg"), Board("76557036", "彩铃分贝榜", "mg"), Board("76557745", "会员臻爱榜", "mg"),
        Board("23189800", "港台榜", "mg"), Board("23189399", "内地榜", "mg"), Board("19190036", "欧美榜", "mg"),
        Board("83176390", "国风金曲榜", "mg")
    )
    suspend fun songs(board: Board, page: Int): List<Song> = withContext(Dispatchers.IO) {
        require(board.id.all(Char::isDigit) && page > 0)
        if (board.source == "tx") return@withContext qqSongs(board, page)
        if (board.source == "wy") return@withContext NeteaseApi().playlistSongs(board.id, page)
        if (board.source == "kw") return@withContext KuwoBoards().songs(board, page)
        if (board.source == "mg") return@withContext miguSongs(board, page)
        require(board.source == "kg")
        val url = "http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=1&plat=0&pagesize=100&area_code=1&page=$page&rankid=${board.id}&with_res_tag=0&show_portrait_mv=1"
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            check(connection.responseCode == 200) { "获取榜单失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optInt("errcode", -1) == 0) { "榜单平台返回错误" }
            parse(result.getJSONObject("data").optJSONArray("info") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    private fun miguSongs(board: Board, page: Int): List<Song> {
        if (page > 1) return emptyList()
        val connection = URL("https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do?columnId=${board.id}&needAll=0").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            check(connection.responseCode == 200) { "获取榜单失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optString("code") == "000000") { "榜单平台返回错误" }
            return parseMigu(result.optJSONObject("columnInfo")?.optJSONArray("contents") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    internal fun parseMigu(items: JSONArray): List<Song> {
        val group = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i)?.optJSONObject("objectInfo") ?: continue
            val duration = item.optString("length").split(':').mapNotNull { it.toLongOrNull() }.fold(0L) { total, value -> total * 60 + value }
            val formats = JSONArray()
            val rawFormats = item.optJSONArray("newRateFormats") ?: JSONArray()
            for (j in 0 until rawFormats.length()) {
                val format = rawFormats.optJSONObject(j) ?: continue
                formats.put(JSONObject().put("formatType", if (format.optString("formatType") == "ZQ") "ZQ24" else format.optString("formatType")))
            }
            val normalized = JSONObject().put("songId", item.opt("songId") ?: "").put("copyrightId", item.opt("copyrightId") ?: "")
                .put("name", item.optString("songName")).put("album", item.optString("album")).put("albumId", item.opt("albumId") ?: "")
                .put("duration", duration).put("singerList", item.optJSONArray("artists") ?: JSONArray()).put("audioFormats", formats)
                .put("img3", item.optJSONArray("albumImgs")?.optJSONObject(0)?.optString("img") ?: "")
                .put("lrcUrl", item.optString("lrcUrl")).put("mrcurl", item.optString("mrcUrl")).put("trcUrl", item.optString("trcUrl"))
            group.put(normalized)
        }
        return OnlineSearch().parseMg(JSONArray().put(group))
    }
    private fun qqSongs(board: Board, page: Int): List<Song> {
        if (page > 1) return emptyList()
        val request = JSONObject().put("toplist", JSONObject().put("module", "musicToplist.ToplistInfoServer")
            .put("method", "GetDetail").put("param", JSONObject().put("topid", board.id.toInt()).put("num", 300)))
            .put("comm", JSONObject().put("uin", 0).put("format", "json").put("ct", 20).put("cv", 1859))
        val connection = URL("https://u.y.qq.com/cgi-bin/musicu.fcg").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000; connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(request.toString().toByteArray()) }
            check(connection.responseCode == 200) { "获取榜单失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optInt("code", -1) == 0) { "榜单平台返回错误" }
            val songs = result.optJSONObject("toplist")?.optJSONObject("data")?.optJSONArray("songInfoList") ?: JSONArray()
            return OnlineSearch().parseTx(songs)
        } finally { connection.disconnect() }
    }
    internal fun parse(items: JSONArray): List<Song> {
        val normalized = JSONArray()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val authors = item.optJSONArray("authors") ?: JSONArray()
            val singers = JSONArray()
            for (j in 0 until authors.length()) {
                val author = authors.optJSONObject(j) ?: continue
                singers.put(JSONObject().put("name", author.optString("author_name")))
            }
            val mapped = JSONObject().put("Audioid", item.opt("audio_id") ?: "").put("FileHash", item.optString("hash"))
                .put("OriSongName", item.optString("songname")).put("Singers", singers).put("Duration", item.optLong("duration"))
                .put("AlbumName", item.optString("remark")).put("AlbumID", item.opt("album_id") ?: "")
            listOf(Triple("FileSize", "filesize", "FileHash"), Triple("HQFileSize", "320filesize", "HQFileHash"),
                Triple("SQFileSize", "sqfilesize", "SQFileHash"), Triple("ResFileSize", "filesize_high", "ResFileHash")).forEach { (size, oldSize, hash) ->
                val oldHash = when (hash) { "FileHash" -> "hash"; "HQFileHash" -> "320hash"; "SQFileHash" -> "sqhash"; else -> "hash_high" }
                mapped.put(size, item.optLong(oldSize)).put(hash, item.optString(oldHash))
            }
            normalized.put(mapped)
        }
        return OnlineSearch().parse(normalized)
    }
}
