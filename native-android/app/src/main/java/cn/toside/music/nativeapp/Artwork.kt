package cn.toside.music.nativeapp

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.io.File
import java.security.MessageDigest
import android.util.AtomicFile
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class Artwork(private val context: Context) {
    suspend fun load(song: Song): Bitmap? = withContext(Dispatchers.IO) {
        if (song.source != "local") return@withContext loadUrl(JSONObject(song.sourceInfo ?: return@withContext null).optString("img"))
        val bytes = run {
            val retriever = MediaMetadataRetriever()
            try { retriever.setDataSource(context, song.uri); retriever.embeddedPicture }
            finally { retriever.release() }
        } ?: runCatching { LocalTags.read(context, song).artwork }.getOrNull() ?: return@withContext null
        decode(bytes)
    }
    private fun decode(bytes: ByteArray): Bitmap? {
        if (bytes.size > 8 * 1024 * 1024) return null
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        var sample = 1
        while (bounds.outWidth / sample > 512 || bounds.outHeight / sample > 512) sample *= 2
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sample })
    }
    internal suspend fun loadUrl(url: String): Bitmap? = withContext(Dispatchers.IO) {
        if (!url.startsWith("https://") && !url.startsWith("http://")) return@withContext null
        locks[(url.hashCode() and Int.MAX_VALUE) % locks.size].withLock {
            val file = AtomicFile(cacheFile(url))
            if (file.baseFile.isFile) {
                val cached = runCatching { file.openRead().use { decode(it.readBounded(8 * 1024 * 1024)) } }.getOrNull()
                if (cached != null) return@withLock cached
                file.delete()
            }
            val connection = URL(url).openConnection() as HttpURLConnection
            val bytes = try {
                connection.connectTimeout = 10_000; connection.readTimeout = 10_000
                connection.setRequestProperty("User-Agent", "Mozilla/5.0")
                if (connection.responseCode != 200) null else connection.inputStream.use { it.readBounded(8 * 1024 * 1024) }
            } finally { connection.disconnect() }
            val bitmap = bytes?.let(::decode) ?: return@withLock null
            runCatching {
                file.baseFile.parentFile?.mkdirs()
                val output = file.startWrite()
                try { check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)); file.finishWrite(output) }
                catch (e: Exception) { file.failWrite(output); throw e }
            }
            bitmap
        }
    }
    internal suspend fun forget(url: String) = withContext(Dispatchers.IO) {
        locks[(url.hashCode() and Int.MAX_VALUE) % locks.size].withLock { AtomicFile(cacheFile(url)).delete() }
    }
    private fun cacheFile(url: String): File {
        val key = MessageDigest.getInstance("SHA-256").digest(url.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
        return context.cacheDir.resolve("artwork/$key.png")
    }
    companion object { private val locks = Array(16) { Mutex() } }
}
