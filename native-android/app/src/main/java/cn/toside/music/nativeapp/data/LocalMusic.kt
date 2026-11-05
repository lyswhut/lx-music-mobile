package cn.toside.music.nativeapp.data

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class Song(val id: Long, val uri: Uri, val title: String, val artist: String, val duration: Long,
    val source: String = "local", val sourceInfo: String? = null)

class LocalMusic(private val context: Context) {
    suspend fun load(): List<Song> = withContext(Dispatchers.IO) {
        val collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        val columns = arrayOf(MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.DURATION, MediaStore.Audio.Media.ALBUM)
        val songs = mutableListOf<Song>()
        context.contentResolver.query(collection, columns, "${MediaStore.Audio.Media.IS_MUSIC} != 0",
            null, "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC")?.use { cursor ->
            val id = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
            val title = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
            val artist = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
            val duration = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
            while (cursor.moveToNext()) {
                val songId = cursor.getLong(id)
                songs += Song(songId, ContentUris.withAppendedId(collection, songId),
                    cursor.getString(title).orEmpty(), cursor.getString(artist).orEmpty(), cursor.getLong(duration), sourceInfo = cursor.getString(4)?.takeIf { it.isNotBlank() }?.let { org.json.JSONObject().put("albumName", it).toString() })
            }
        }
        songs
    }

    /** Resolve legacy absolute file paths through MediaStore, without broad storage access. */
    @Suppress("DEPRECATION")
    suspend fun byLegacyPath(): Map<String, Song> = withContext(Dispatchers.IO) {
        val collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        val columns = arrayOf(MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.DURATION, MediaStore.Audio.Media.DATA)
        val result = mutableMapOf<String, Song>()
        context.contentResolver.query(collection, columns, "${MediaStore.Audio.Media.IS_MUSIC} != 0", null, null)?.use { cursor ->
            while (cursor.moveToNext()) {
                val path = cursor.getString(4) ?: continue
                val id = cursor.getLong(0)
                val song = Song(id, ContentUris.withAppendedId(collection, id), cursor.getString(1).orEmpty(),
                    cursor.getString(2).orEmpty(), cursor.getLong(3))
                result[path] = song
                result[song.uri.toString()] = song
            }
        }
        result
    }
}
