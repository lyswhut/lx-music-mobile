package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.utils.readBounded

import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream

data class ImportedList(val name: String, val songs: List<Song>, val syncId: String? = null, val metadata: String? = null, val rawSongs: List<String?> = emptyList())
data class ImportedBackup(val lists: List<ImportedList>, val skipped: Int)

/** Reads LX Music playlist backups without modifying the source or existing playlists. */
object LegacyBackup {
    fun encode(lists: List<Pair<Playlist, List<Song>>>, paths: Map<Long, String>): ByteArray {
        val all = JSONArray()
        lists.forEach { (playlist, songs) ->
            val items = JSONArray()
            songs.forEach { song ->
                items.put(musicInfo(song, paths))
            }
            all.put(JSONObject().put("id", playlist.syncId.ifBlank { "native_${playlist.id}" }).put("name", playlist.name).put("list", items))
        }
        val bytes = JSONObject().put("type", "playList_v2").put("data", all).toString().toByteArray(Charsets.UTF_8)
        require(bytes.size <= 32 * 1024 * 1024) { "歌单备份过大" }
        return ByteArrayOutputStream().also { output -> GZIPOutputStream(output).use { it.write(bytes) } }.toByteArray()
    }
    internal fun musicInfo(song: Song, paths: Map<Long, String>): JSONObject {
        val meta = JSONObject()
        val id: String
        if (song.source == "local") {
            val path = paths[song.id] ?: song.uri.toString()
            id = "local_$path"
            meta.put("songId", path).put("filePath", path).put("albumName", JSONObject(song.sourceInfo ?: "{}").optString("albumName")).put("picUrl", "")
                .put("ext", path.substringAfterLast('.', ""))
        } else {
            val original = JSONObject(song.sourceInfo ?: error("在线歌曲缺少音源信息：${song.title}"))
            val songId = original.opt("songmid") ?: error("在线歌曲缺少歌曲编号：${song.title}")
            id = if (song.source == "kg") "${songId}_${original.optString("hash")}" else "${song.source}_$songId"
            meta.put("songId", songId).put("albumName", original.opt("albumName") ?: "")
                .put("albumId", original.opt("albumId") ?: "").put("picUrl", original.opt("img") ?: "")
                .put("qualitys", original.optJSONArray("types") ?: JSONArray()).put("_qualitys", original.optJSONObject("_types") ?: JSONObject())
            listOf("hash", "strMediaMid", "albumMid", "copyrightId", "lrcUrl", "mrcUrl", "trcUrl").forEach {
                if (original.has(it)) meta.put(it, original.get(it))
            }
            if (original.has("songId")) meta.put("id", original.get("songId"))
        }
        val seconds = song.duration.coerceAtLeast(0) / 1000
        return JSONObject().put("id", id).put("name", song.title).put("singer", song.artist).put("source", song.source)
            .put("interval", "%02d:%02d".format(seconds / 60, seconds % 60)).put("meta", meta)
    }
    fun parse(bytes: ByteArray, localByPath: Map<String, Song>): ImportedBackup {
        val lists = readLists(bytes)
        var skipped = 0
        val imported = buildList {
            for (i in 0 until lists.length()) {
                val list = lists.getJSONObject(i)
                val songs = list.optJSONArray("list") ?: JSONArray()
                val rawSongs = mutableListOf<String?>()
                val items = buildList {
                    for (j in 0 until songs.length()) {
                        val item = songs.optJSONObject(j)
                        val converted = item?.let { convert(it, localByPath) }
                        if (converted == null) skipped++ else { add(converted); rawSongs.add(item?.takeIf { it.has("meta") }?.toString()) }
                    }
                }
                add(ImportedList(list.optString("name").ifBlank { "导入的歌单 ${i + 1}" }, items,
                    list.optString("id").takeIf { it.isNotBlank() && it != "temp" }, JSONObject(list.toString()).apply { remove("list") }.toString(), rawSongs))
            }
        }
        return ImportedBackup(imported, skipped)
    }
    internal fun encodeSnapshot(snapshot: JSONObject): ByteArray {
        val all = JSONArray().put(JSONObject().put("id", "default").put("name", "默认列表").put("list", snapshot.getJSONArray("defaultList")))
            .put(JSONObject().put("id", "love").put("name", "我的收藏").put("list", snapshot.getJSONArray("loveList")))
        val users = snapshot.getJSONArray("userList")
        for (i in 0 until users.length()) all.put(users.getJSONObject(i))
        val bytes = JSONObject().put("type", "playList_v2").put("data", all).toString().toByteArray(Charsets.UTF_8)
        require(bytes.size <= 32 * 1024 * 1024) { "歌单备份过大" }
        return ByteArrayOutputStream().also { output -> GZIPOutputStream(output).use { it.write(bytes) } }.toByteArray()
    }
    internal fun containsLocalSongs(bytes: ByteArray, knownPaths: Set<String> = emptySet()): Boolean {
        val lists = readLists(bytes)
        for (i in 0 until lists.length()) {
            val items = lists.optJSONObject(i)?.optJSONArray("list") ?: continue
            for (j in 0 until items.length()) {
                val item = items.optJSONObject(j) ?: continue
                if (item.optString("source") == "local") {
                    val path = item.optJSONObject("meta")?.optString("filePath") ?: item.optString("filePath", item.optString("songmid"))
                    if (path !in knownPaths) return true
                }
            }
        }
        return false
    }
    private fun readLists(bytes: ByteArray): JSONArray {
        val isGzip = bytes.size >= 2 && bytes[0] == 0x1f.toByte() && bytes[1] == 0x8b.toByte()
        val raw = if (isGzip) GZIPInputStream(ByteArrayInputStream(bytes)).use { it.readBounded(32 * 1024 * 1024) } else bytes
        val backup = JSONObject(raw.toString(Charsets.UTF_8))
        val type = backup.optString("type")
        return when (type) {
            "playListPart", "playListPart_v2", "defautlList" -> JSONArray().put(backup.getJSONObject("data"))
            "playList", "playList_v2" -> backup.getJSONArray("data")
            "allData", "allData_v2" -> backup.optJSONArray("playList")
                ?: backup.optJSONObject("defaultList")?.let { JSONArray().put(it) }
                ?: error("备份中没有歌单")
            else -> error("不支持的备份类型：$type")
        }
    }

    internal fun convert(item: JSONObject, localByPath: Map<String, Song>): Song? {
        val source = item.optString("source")
        val meta = item.optJSONObject("meta")
        if (source == "local") {
            val path = meta?.optString("filePath") ?: item.optString("filePath", item.optString("songmid"))
            val found = localByPath[path] ?: return null
            val time = item.optString("interval")
            val duration = if (found.duration > 0 || !time.matches(Regex("\\d{1,8}:\\d{2}(?::\\d{2})?"))) found.duration
                else time.split(':').fold(0L) { total, part -> total * 60 + part.toLong() } * 1000
            return found.copy(title = item.optString("name").ifBlank { found.title },
                artist = item.optString("singer", found.artist), duration = duration,
                sourceInfo = meta?.optString("albumName")?.takeIf { it.isNotBlank() }?.let { JSONObject(found.sourceInfo ?: "{}").put("albumName", it).toString() } ?: found.sourceInfo)
        }
        if (source !in setOf("kg", "kw", "tx", "wy", "mg")) return null
        val songId = meta?.opt("songId") ?: item.opt("songmid") ?: return null
        val songIdText = songId.toString()
        if (songIdText.isBlank() || songIdText == "null") return null
        val title = item.optString("name")
        val artist = item.optString("singer")
        val time = item.optString("interval")
        val duration = time.split(':').mapNotNull { it.toLongOrNull() }.fold(0L) { total, value -> total * 60 + value } * 1000
        val info = if (meta == null) JSONObject(item.toString()) else JSONObject().put("name", title).put("singer", artist)
            .put("source", source).put("songmid", songId).put("interval", time).put("albumName", meta.opt("albumName") ?: "")
            .put("albumId", meta.opt("albumId") ?: "").put("img", meta.opt("picUrl") ?: "")
            .put("types", meta.optJSONArray("qualitys") ?: JSONArray()).put("_types", meta.optJSONObject("_qualitys") ?: JSONObject())
            .put("typeUrl", JSONObject()).apply {
                listOf("hash", "strMediaMid", "albumMid", "copyrightId", "lrcUrl", "mrcUrl", "trcUrl").forEach {
                    if (meta.has(it)) put(it, meta.get(it))
                }
                if (meta.has("id")) put("songId", meta.get("id"))
            }
        val id = songIdText.toLongOrNull() ?: songIdText.hashCode().toLong()
        return Song(id, Uri.EMPTY, title, artist, duration, source, info.toString())
    }
}
