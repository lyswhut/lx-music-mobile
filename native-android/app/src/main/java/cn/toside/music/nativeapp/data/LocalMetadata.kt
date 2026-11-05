package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.update.NativeUpdates

import android.content.ContentValues
import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.MediaStore
import android.util.AtomicFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import org.jaudiotagger.tag.TagOptionSingleton
import org.jaudiotagger.tag.images.AndroidArtwork
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

internal data class LocalMetadata(val title: String, val artist: String, val album: String, val lyric: String, val artwork: ByteArray?)

/** Edit a staged copy first; preserve the original if tag parsing or writing fails. */
internal object LocalTags {
    private val lock = Mutex()
    private fun configure() { TagOptionSingleton.getInstance().isAndroid = true }
    suspend fun lyric(context: Context, song: Song): String = withContext(Dispatchers.IO) { lock.withLock {
        configure()
        if (song.uri.scheme == "file") AudioFileIO.read(File(requireNotNull(song.uri.path))).tag?.getFirst(FieldKey.LYRICS).orEmpty()
        else staged(context, song) { file -> AudioFileIO.read(file).tag?.getFirst(FieldKey.LYRICS).orEmpty() }
    } }
    private suspend fun <T> staged(context: Context, song: Song, action: (File) -> T): T = withContext(Dispatchers.IO) {
        require(song.source == "local")
        val name = ExternalAudio.name(context, song.uri)
        val extension = name.substringAfterLast('.', "").lowercase()
        require(extension in setOf("mp3", "flac", "ogg", "opus", "m4a", "mp4", "wav", "wma", "aiff", "aif", "dsf")) { context.getString(R.string.metadata_format) }
        val file = File(context.cacheDir, "metadata-${UUID.randomUUID()}.$extension")
        try {
            context.contentResolver.openInputStream(song.uri)!!.use { input -> file.outputStream().use { output ->
                val buffer = ByteArray(65536); var total = 0L
                while (true) { val count = input.read(buffer); if (count < 0) break; total += count; require(total <= NativeUpdates.MAX_BYTES); output.write(buffer, 0, count) }
            } }
            configure(); action(file)
        } finally { file.delete() }
    }
    suspend fun read(context: Context, song: Song): LocalMetadata = lock.withLock { staged(context, song) { file ->
        val tag = AudioFileIO.read(file).tag
        LocalMetadata(tag?.getFirst(FieldKey.TITLE)?.ifBlank { song.title } ?: song.title,
            tag?.getFirst(FieldKey.ARTIST)?.ifBlank { song.artist } ?: song.artist,
            tag?.getFirst(FieldKey.ALBUM).orEmpty(), tag?.getFirst(FieldKey.LYRICS).orEmpty(),
            tag?.firstArtwork?.binaryData?.takeIf { it.size <= 8 * 1024 * 1024 })
    } }
    suspend fun write(context: Context, song: Song, value: LocalMetadata): Song = lock.withLock { staged(context, song) { original ->
        require(value.title.isNotBlank() && value.title.length <= 500 && value.artist.length <= 500 && value.album.length <= 500 && value.lyric.toByteArray().size <= 2 * 1024 * 1024)
        val edited = File(original.parentFile, "edited-${original.name}")
        try {
            original.copyTo(edited)
            val audio = AudioFileIO.read(edited); val tag = audio.tagOrCreateAndSetDefault
            tag.setField(FieldKey.TITLE, value.title); tag.setField(FieldKey.ARTIST, value.artist); tag.setField(FieldKey.ALBUM, value.album)
            if (value.lyric.isBlank()) tag.deleteField(FieldKey.LYRICS) else tag.setField(FieldKey.LYRICS, value.lyric)
            tag.deleteArtworkField()
            value.artwork?.let { bytes ->
                require(bytes.size <= 8 * 1024 * 1024)
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                require(bounds.outWidth in 1..20000 && bounds.outHeight in 1..20000 && bounds.outMimeType in setOf("image/jpeg", "image/png")) { context.getString(R.string.metadata_image_invalid) }
                tag.setField(AndroidArtwork().apply { binaryData = bytes; mimeType = bounds.outMimeType; width = bounds.outWidth; height = bounds.outHeight; pictureType = 3; description = "Cover" })
            }
            audio.commit()
            val verified = AudioFileIO.read(edited).tag
            check(verified.getFirst(FieldKey.TITLE) == value.title && verified.getFirst(FieldKey.ARTIST) == value.artist && verified.getFirst(FieldKey.ALBUM) == value.album)
            if (song.uri.scheme == "file") {
                val target = File(requireNotNull(song.uri.path)).canonicalFile
                val roots = listOfNotNull(context.filesDir, context.getExternalFilesDir(null))
                if (roots.any { target.path.startsWith(it.canonicalPath + File.separator) }) {
                    val atomic = AtomicFile(target); val output = atomic.startWrite()
                    try { edited.inputStream().use { it.copyTo(output) }; atomic.finishWrite(output) }
                    catch (e: Exception) { atomic.failWrite(output); throw e }
                } else replace(context, song.uri, edited, original)
            } else replace(context, song.uri, edited, original)
            val info = JSONObject(song.sourceInfo ?: "{}").put("albumName", value.album)
            val updated = song.copy(title = value.title, artist = value.artist, sourceInfo = info.toString())
            if (song.uri.scheme == "file") {
                val file = File(requireNotNull(song.uri.path))
                if (file.canonicalFile.parentFile == context.filesDir.resolve("opened-audio").canonicalFile) {
                    val sidecar = AtomicFile(File(file.path + ".json")); val output = sidecar.startWrite()
                    try { output.write(JSONObject().put("title", value.title).put("artist", value.artist).put("album", value.album).put("duration", song.duration).toString().toByteArray()); sidecar.finishWrite(output) }
                    catch (e: Exception) { sidecar.failWrite(output); throw e }
                }
            } else if (song.uri.authority == "media") {
                runCatching { context.contentResolver.update(song.uri, ContentValues().apply {
                    put(MediaStore.Audio.Media.TITLE, value.title); put(MediaStore.Audio.Media.ARTIST, value.artist); put(MediaStore.Audio.Media.ALBUM, value.album)
                }, null, null) }
            }
            updated
        } finally { edited.delete() }
    } }
    private fun replace(context: Context, uri: Uri, edited: File, original: File) {
        // Opening can throw RecoverableSecurityException before any bytes are changed.
        context.contentResolver.openFileDescriptor(uri, "rw")!!.use { descriptor ->
            FileOutputStream(descriptor.fileDescriptor).use { output ->
                try { edited.inputStream().use { it.copyTo(output) }; output.channel.truncate(edited.length()); output.fd.sync() }
                catch (e: Exception) {
                    runCatching { output.channel.position(0); original.inputStream().use { it.copyTo(output) }; output.channel.truncate(original.length()); output.fd.sync() }
                    throw e
                }
            }
        }
    }
}
