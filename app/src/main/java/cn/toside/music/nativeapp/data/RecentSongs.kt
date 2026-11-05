package cn.toside.music.nativeapp.data

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/** Playback history is independent of the active queue and keeps each recording once. */
internal class RecentSongs(context: Context, name: String = "play-history") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    suspend fun list(): List<Song> = withContext(Dispatchers.IO) { synchronized(lock) { read() } }
    suspend fun record(song: Song) = withContext(Dispatchers.IO) {
        synchronized(lock) {
            val songs = (listOf(song) + read().filterNot { it.id == song.id && it.source == song.source }).take(200)
            val array = JSONArray().apply { songs.forEach { s -> put(JSONObject().put("id", s.id).put("uri", s.uri.toString())
                .put("title", s.title).put("artist", s.artist).put("duration", s.duration).put("source", s.source)
                .put("info", s.sourceInfo ?: JSONObject.NULL)) } }
            check(preferences.edit().putString("songs", array.toString()).commit()) { "保存播放历史失败" }
        }
    }
    suspend fun clear() = withContext(Dispatchers.IO) { synchronized(lock) { preferences.edit().clear().commit() } }
    private fun read(): List<Song> {
        val array = JSONArray(preferences.getString("songs", "[]"))
        return (0 until array.length()).map { index -> array.getJSONObject(index).let { item ->
            Song(item.getLong("id"), Uri.parse(item.getString("uri")), item.getString("title"), item.getString("artist"),
                item.getLong("duration"), item.getString("source"), if (item.isNull("info")) null else item.getString("info"))
        } }
    }
    companion object { private val lock = Any() }
}
