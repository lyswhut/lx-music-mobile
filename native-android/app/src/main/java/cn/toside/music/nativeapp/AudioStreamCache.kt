@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package cn.toside.music.nativeapp

import android.content.Context
import android.net.Uri
import androidx.media3.common.C
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.cache.Cache
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheEvictor
import androidx.media3.datasource.cache.CacheSpan
import androidx.media3.datasource.cache.ContentMetadata
import androidx.media3.datasource.cache.ContentMetadataMutations
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.datasource.okhttp.OkHttpDataSource
import okhttp3.OkHttpClient
import java.util.TreeSet
import java.io.File
import org.json.JSONObject

/** One process-wide cache avoids overlapping SimpleCache directory locks across service restarts. */
internal class AudioStreamCache(context: Context, directory: File = context.cacheDir.resolve("audio-stream")) : AutoCloseable {
    private val evictor = AdjustableLruEvictor(AppPreferences(context).audioCacheBytes)
    private val database = StandaloneDatabaseProvider(context)
    internal val cache = SimpleCache(directory, evictor, database)
    private val upstream = DefaultDataSource.Factory(context, OkHttpDataSource.Factory(OkHttpClient.Builder()
        .connectTimeout(13, java.util.concurrent.TimeUnit.SECONDS).readTimeout(20, java.util.concurrent.TimeUnit.SECONDS).build()))
    fun dataSource(): CacheDataSource.Factory = CacheDataSource.Factory().setCache(cache).setUpstreamDataSourceFactory(upstream)
        .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
    fun updateLimit(bytes: Long) = synchronized(cache) { evictor.update(cache, bytes) }
    fun clear() { cache.keys.toList().forEach { cache.removeResource(it) } }
    val bytes: Long get() = cache.cacheSpace
    internal fun remove(key: String) { cache.removeResource(key) }
    internal fun removeSong(prefix: String) { cache.keys.filter { it.startsWith(prefix) }.forEach { cache.removeResource(it) } }
    fun cachedUri(key: String): Uri? {
        val metadata = cache.getContentMetadata(key)
        val length = ContentMetadata.getContentLength(metadata)
        val url = metadata.get("native_uri", "") ?: ""
        return if (length > 0 && url.isNotBlank() && cache.isCached(key, 0, length)) Uri.parse(url) else null
    }
    fun remember(key: String, uri: Uri) { cache.applyContentMetadataMutations(key, ContentMetadataMutations().set("native_uri", uri.toString())) }
    override fun close() { cache.release(); database.close() }
    companion object {
        @Volatile private var instance: AudioStreamCache? = null
        fun get(context: Context): AudioStreamCache = instance ?: synchronized(this) {
            instance ?: AudioStreamCache(context.applicationContext).also { instance = it }
        }
        fun existing(): AudioStreamCache? = instance
        fun key(song: Song, quality: String): String {
            val info = song.sourceInfo?.let(::JSONObject)
            return "${song.source}:${info?.optString("songmid") ?: song.id}:${info?.optString("hash").orEmpty()}:$quality"
        }
    }
}

/** Cache callbacks run under SimpleCache's monitor. Limits can change without closing active readers. */
private class AdjustableLruEvictor(private var maxBytes: Long) : CacheEvictor {
    private val spans = TreeSet<CacheSpan>(compareBy<CacheSpan> { it.lastTouchTimestamp }.thenBy { it.key }.thenBy { it.position })
    private var bytes = 0L
    override fun requiresCacheSpanTouches() = true
    override fun onCacheInitialized() = Unit
    override fun onStartFile(cache: Cache, key: String, position: Long, length: Long) { evict(cache, if (length == C.LENGTH_UNSET.toLong()) 0 else length) }
    override fun onSpanAdded(cache: Cache, span: CacheSpan) { if (spans.add(span)) bytes += span.length; evict(cache, 0) }
    override fun onSpanRemoved(cache: Cache, span: CacheSpan) { if (spans.remove(span)) bytes -= span.length }
    override fun onSpanTouched(cache: Cache, oldSpan: CacheSpan, newSpan: CacheSpan) { onSpanRemoved(cache, oldSpan); onSpanAdded(cache, newSpan) }
    fun update(cache: Cache, value: Long) { maxBytes = value.coerceAtLeast(0); evict(cache, 0) }
    private fun evict(cache: Cache, required: Long) {
        while (bytes + required > maxBytes && spans.isNotEmpty()) cache.removeSpan(spans.first())
    }
}
