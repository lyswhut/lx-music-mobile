package cn.toside.music.nativeapp

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.OpenableColumns
import android.util.AtomicFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.util.UUID
import org.json.JSONObject
import java.io.File

internal object ExternalAudio {
    suspend fun name(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        if (uri.scheme == "file") uri.lastPathSegment ?: "file" else context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
            if (it.moveToFirst()) it.getString(0) else null
        } ?: uri.lastPathSegment ?: "file"
    }
    /** Copy one explicitly opened audio file, so a temporary URI grant is not needed after restart. */
    suspend fun import(context: Context, uri: Uri): Song = withContext(Dispatchers.IO) {
        val name = name(context, uri)
        val digest = MessageDigest.getInstance("SHA-256")
        val extension = name.substringAfterLast('.', "audio").lowercase().takeIf { it.matches(Regex("[a-z0-9]{1,8}")) } ?: "audio"
        val directory = context.filesDir.resolve("opened-audio").apply { mkdirs() }
        val file = AtomicFile(directory.resolve("incoming-${UUID.randomUUID()}"))
        val output = file.startWrite()
        try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                val buffer = ByteArray(64 * 1024); var total = 0L
                while (true) {
                    val size = input.read(buffer); if (size < 0) break
                    total += size; require(total <= 512L * 1024 * 1024) { "音频文件超过 512 MB" }
                    digest.update(buffer, 0, size); output.write(buffer, 0, size)
                }
                require(total > 0) { "音频文件为空" }
            } ?: error("无法读取音频文件")
            file.finishWrite(output)
        } catch (e: Exception) { file.failWrite(output); throw e }
        val metadata = MediaMetadataRetriever()
        try {
            metadata.setDataSource(file.baseFile.absolutePath)
            val key = digest.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
            val target = directory.resolve("$key.$extension")
            val info = AtomicFile(directory.resolve("$key.$extension.json"))
            val saved = if (target.isFile && info.baseFile.isFile) runCatching { info.openRead().use { JSONObject(it.readBounded(128 * 1024).toString(Charsets.UTF_8)) } }.getOrNull() else null
            val title = (metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)?.takeIf { it.isNotBlank() } ?: name.substringBeforeLast('.')).take(500)
            val artist = metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST).orEmpty().take(500)
            val song = Song(key.take(15).toLong(16), Uri.fromFile(target), saved?.optString("title", title) ?: title, saved?.optString("artist", artist) ?: artist,
                metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0,
                sourceInfo = saved?.optString("album")?.takeIf { it.isNotBlank() }?.let { JSONObject().put("albumName", it).toString() })
            check(target.isFile || file.baseFile.renameTo(target)) { "无法保存音频文件" }
            if (saved == null) {
                val infoOutput = info.startWrite()
                try {
                    infoOutput.write(JSONObject().put("title", song.title).put("artist", song.artist).put("duration", song.duration).toString().toByteArray(Charsets.UTF_8))
                    info.finishWrite(infoOutput)
                } catch (e: Exception) { info.failWrite(infoOutput); throw e }
            }
            song
        } finally { try { metadata.release() } finally { file.delete() } }
    }
    /** Resolve only app-owned imported audio, without querying the device media library. */
    suspend fun existing(context: Context): Map<String, Song> = withContext(Dispatchers.IO) {
        val directory = context.filesDir.resolve("opened-audio")
        val result = mutableMapOf<String, Song>()
        directory.listFiles()?.filter { it.isFile && it.name.matches(Regex("[0-9a-f]{64}\\.[a-z0-9]{1,8}")) }?.forEach { file ->
            try {
                if (file.canonicalFile.parentFile != directory.canonicalFile) return@forEach
                val info = AtomicFile(File(file.path + ".json"))
                val data = if (info.baseFile.isFile) info.openRead().use { JSONObject(it.readBounded(128 * 1024).toString(Charsets.UTF_8)) } else JSONObject()
                val song = Song(file.name.take(15).toLong(16), Uri.fromFile(file), data.optString("title", file.nameWithoutExtension), data.optString("artist"), data.optLong("duration"),
                    sourceInfo = data.optString("album").takeIf { it.isNotBlank() }?.let { JSONObject().put("albumName", it).toString() })
                result[file.absolutePath] = song; result[song.uri.toString()] = song
            } catch (_: Exception) { }
        }
        result
    }
}
