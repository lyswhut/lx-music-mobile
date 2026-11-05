package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.utils.readBounded

import android.content.Context
import android.net.Uri
import android.util.AtomicFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicLong

data class QueueSnapshot(val songs: List<Song>, val index: Int, val position: Int)

/** Stores a paused playback snapshot; it never starts audio at application launch. */
class QueueStore(context: Context) {
    private val file = AtomicFile(context.filesDir.resolve("playback-queue.json"))
    private val mutex = Mutex()
    private val revision = AtomicLong()
    internal fun nextRevision(): Long = revision.incrementAndGet()

    suspend fun save(snapshot: QueueSnapshot, expectedRevision: Long? = null) = mutex.withLock {
        if (expectedRevision != null && expectedRevision != revision.get()) return@withLock
        withContext(Dispatchers.IO) {
            val songs = JSONArray()
            snapshot.songs.forEach { song ->
                songs.put(JSONObject().put("id", song.id).put("uri", song.uri.toString()).put("title", song.title)
                    .put("artist", song.artist).put("duration", song.duration).put("source", song.source)
                    .put("sourceInfo", song.sourceInfo ?: JSONObject.NULL))
            }
            val data = JSONObject().put("version", 1).put("index", snapshot.index).put("position", snapshot.position).put("songs", songs)
                .toString().toByteArray(Charsets.UTF_8)
            require(data.size <= MAX_SIZE) { "播放队列过大" }
            val stream = file.startWrite()
            try { stream.write(data); file.finishWrite(stream) }
            catch (e: Exception) { file.failWrite(stream); throw e }
        }
    }
    internal suspend fun clear(expectedRevision: Long? = null) = mutex.withLock {
        if (expectedRevision != null && expectedRevision != revision.get()) return@withLock
        withContext(Dispatchers.IO) { file.delete() }
    }
    suspend fun load(): QueueSnapshot? = mutex.withLock {
        withContext(Dispatchers.IO) {
            if (!file.baseFile.isFile) return@withContext null
            val json = file.openRead().use { JSONObject(it.readBounded(MAX_SIZE).toString(Charsets.UTF_8)) }
            require(json.getInt("version") == 1) { "播放队列版本不受支持" }
            val array = json.getJSONArray("songs")
            val songs = buildList {
                for (i in 0 until array.length()) {
                    val value = array.getJSONObject(i)
                    add(Song(value.getLong("id"), Uri.parse(value.getString("uri")), value.getString("title"),
                        value.getString("artist"), value.getLong("duration"), value.getString("source"),
                        if (value.isNull("sourceInfo")) null else value.getString("sourceInfo")))
                }
            }
            val index = json.getInt("index")
            require(index in songs.indices) { "播放队列位置无效" }
            QueueSnapshot(songs, index, json.optInt("position").coerceAtLeast(0))
        }
    }
    companion object { private const val MAX_SIZE = 10 * 1024 * 1024 }
}
