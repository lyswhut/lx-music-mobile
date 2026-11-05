package cn.toside.music.nativeapp.utils

import cn.toside.music.nativeapp.data.PlaylistCredentials
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.online.KugouSharedPlaylists
import cn.toside.music.nativeapp.online.OnlinePlaylist
import cn.toside.music.nativeapp.online.OnlinePlaylists

import android.net.Uri
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal data class LxLink(val type: String, val action: String, val paths: List<String>, val data: JSONObject?)
internal object ExternalLinks {
    val sources = listOf("kw", "kg", "tx", "wy", "mg")
    fun parse(uri: Uri): LxLink {
        require(uri.scheme == "lxmusic" && uri.toString().length <= 100_000) { "LX 链接格式无效" }
        val paths = uri.pathSegments
        val type = uri.host ?: error("链接缺少类型")
        val action = paths.firstOrNull() ?: error("链接缺少操作")
        require(type in setOf("player", "music", "songlist")) { "未知的链接类型" }
        val data = uri.getQueryParameter("data")?.let(::JSONObject)
        return LxLink(type, action, paths.drop(1), data)
    }
    fun sourceFromUrl(value: String): String? {
        val url = Regex("https?://[^\\s<>]+", RegexOption.IGNORE_CASE).find(value)?.value ?: return null
        val host = Uri.parse(url).host?.lowercase() ?: return null
        return when {
            host == "kuwo.cn" || host.endsWith(".kuwo.cn") -> "kw"
            host == "kugou.com" || host.endsWith(".kugou.com") -> "kg"
            host == "qq.com" || host.endsWith(".qq.com") -> "tx"
            host == "163.com" || host.endsWith(".163.com") -> "wy"
            host == "migu.cn" || host.endsWith(".migu.cn") -> "mg"
            else -> null
        }
    }
    fun playlistId(source: String, raw: String): String? {
        if (raw.matches(Regex("\\d{1,30}"))) return raw
        val patterns = when (source) {
            "kw" -> listOf("/playlist(?:_detail)?/(\\d+)", "[?&]pid=(\\d+)")
            "wy" -> listOf("[?&]id=(\\d+)", "/playlist/(\\d+)")
            "tx" -> listOf("/playlist/(\\d+)", "[?&](?:id|disstid)=(\\d+)", "/playsquare/(\\d+)")
            "mg" -> listOf("/playlist/(\\d+)", "[?&](?:playlistId|id)=(\\d+)")
            "kg" -> listOf("/special/single/(\\d+)", "[?&]specialid=(\\d+)")
            else -> emptyList()
        }
        return patterns.firstNotNullOfOrNull { Regex(it).find(raw)?.groupValues?.get(1) }
    }
    suspend fun playlist(source: String, input: String, context: Context? = null): OnlinePlaylist = withContext(Dispatchers.IO) {
        require(source in sources)
        require(input.length <= 20_000) { "歌单链接过长" }
        var value = input.trim()
        val token = if (source == "wy" && value.contains("###")) {
            val parts = value.split("###", limit = 2)
            value = parts[0].trim(); parts[1].trim().also(PlaylistCredentials::validate)
        } else null
        fun result(id: String): OnlinePlaylist {
            if (token != null) {
                require(context != null) { "此入口无法保存歌单访问凭据" }
                PlaylistCredentials(context).save(id, token)
            }
            return OnlinePlaylist(id, if (source == "kw") "8" else "", "外部歌单 $id", "", source)
        }
        var id = if (source == "kg") KugouSharedPlaylists.reference(value) ?: playlistId(source, value) else playlistId(source, value)
        if (id == null) {
            value = Regex("https?://[^\\s<>]+", RegexOption.IGNORE_CASE).find(value)?.value ?: error("请输入歌单编号或链接")
            repeat(5) {
                require(sourceFromUrl(value) == source) { "链接不属于所选音乐平台" }
                val connection = URL(value).openConnection() as HttpURLConnection
                try {
                    connection.instanceFollowRedirects = false; connection.connectTimeout = 10_000; connection.readTimeout = 10_000
                    connection.setRequestProperty("User-Agent", "Mozilla/5.0")
                    if (connection.responseCode in 300..399) {
                        value = URL(URL(value), connection.getHeaderField("Location") ?: error("短链接没有目标地址")).toString()
                    } else {
                        val html = connection.inputStream.use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) }
                        val kgCollection = if (source == "kg") Regex("\"global_collection_id\"\\s*:\\s*\"([A-Za-z0-9_]{1,200})\"").find(html)?.groupValues?.get(1) else null
                        value = kgCollection?.let { "https://m.kugou.com/share/?global_collection_id=$it" }
                            ?: Regex("https?://[^\"'<>\\s]+/playlist/\\d+[^\"'<>\\s]*").find(html)?.value ?: value
                    }
                } finally { connection.disconnect() }
                id = if (source == "kg") KugouSharedPlaylists.reference(value) ?: playlistId(source, value) else playlistId(source, value)
                if (id != null) return@withContext result(id!!)
            }
        }
        result(id ?: error("无法解析歌单链接"))
    }
    suspend fun allSongs(list: OnlinePlaylist, context: Context? = null): List<Song> {
        val api = OnlinePlaylists(context); val result = mutableListOf<Song>(); val seen = mutableSetOf<Pair<String, Long>>()
        for (page in 1..1000) {
            val items = api.songs(list, page)
            val fresh = items.filter { seen.add(it.source to it.id) }
            if (fresh.isEmpty()) return result
            result.addAll(fresh)
            require(result.size <= 50_000) { "歌单过大" }
        }
        error("歌单分页超过限制")
    }
}
