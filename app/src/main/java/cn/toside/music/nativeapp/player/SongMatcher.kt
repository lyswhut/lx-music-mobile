package cn.toside.music.nativeapp.player

import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.online.OnlineSearch
import cn.toside.music.nativeapp.utils.ExternalLinks

import android.content.Context
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/** Existing LX matching rules: singer order, five-second tolerance and recording-version markers. */
internal class SongMatcher(context: Context, private val scope: CoroutineScope,
    private val search: suspend (String, String) -> List<Song> = { query, source -> OnlineSearch().search(query, source = source) }) {
    private val markers = context.assets.open("i18n/version-markers.json").use { input ->
        val values = JSONArray(input.readBytes().toString(Charsets.UTF_8).removePrefix("\uFEFF"))
        (0 until values.length()).map { normalize(values.getString(it)) }
    }
    private val lock = Any()
    private val cache = LinkedHashMap<String, List<Song>>()
    private val pending = mutableMapOf<String, Deferred<List<Song>>>()
    private var revision = 0L
    val cacheCount get() = synchronized(lock) { cache.size }
    fun clearCache() { synchronized(lock) { revision++; cache.clear() } }
    private fun cacheKey(song: Song) = "${song.source}:${normalize(song.title)}:${singer(song.artist)}:${song.duration}:${album(song)}"
    fun clearSong(song: Song) { synchronized(lock) { revision++; cache.remove(cacheKey(song)) } }
    suspend fun find(song: Song): List<Song> {
        val key = cacheKey(song)
        val request = synchronized(lock) {
            val generation = revision
            cache[key]?.let { return it }
            pending[key] ?: scope.async(start = CoroutineStart.LAZY) {
                try {
                    val result = withTimeoutOrNull(12_000) {
                        coroutineScope { ExternalLinks.sources.filterNot { it == song.source }.map { source -> async {
                            try { best(song, search("${song.title.trim()} ${song.artist.trim()}".trim(), source)) }
                            catch (e: CancellationException) { throw e }
                            catch (_: Exception) { null }
                        } }.awaitAll().filterNotNull().sortedByDescending { score(song, it) } }
                    } ?: error("搜索其他来源超时")
                    synchronized(lock) { if (result.isNotEmpty() && generation == revision) { if (cache.size >= 10) cache.remove(cache.keys.first()); cache[key] = result } }
                    result
                } finally { synchronized(lock) { pending.remove(key) } }
            }.also { pending[key] = it; it.start() }
        }
        return request.await()
    }
    internal fun best(reference: Song, candidates: List<Song>): Song? = candidates.filter { candidate ->
        val name = normalize(reference.title); val other = normalize(candidate.title)
        val artist = singer(reference.artist); val otherArtist = singer(candidate.artist)
        val duration = reference.duration == 0L || candidate.duration == 0L || kotlin.math.abs(reference.duration - candidate.duration) <= 5000
        val version = markers.all { name.contains(it) == other.contains(it) }
        val names = name.isNotEmpty() && other.isNotEmpty() && (name.contains(other) || other.contains(name))
        val singers = artist.isBlank() || otherArtist.isNotBlank() && (artist.contains(otherArtist) || otherArtist.contains(artist))
        duration && version && names && singers
    }.maxByOrNull { score(reference, it) }
    private fun score(reference: Song, candidate: Song): Int =
        (if (normalize(reference.title) == normalize(candidate.title)) 100 else 0) +
        (if (singer(reference.artist) == singer(candidate.artist)) 50 else 0) +
        (if (reference.duration == candidate.duration) 20 else 0) +
        (if (album(reference).isNotBlank() && album(reference) == album(candidate)) 10 else 0)
    private fun album(song: Song): String = song.sourceInfo?.let { runCatching { normalize(JSONObject(it).optString("albumName")) }.getOrNull() }.orEmpty()
    private fun singer(value: String) = value.split(Regex("[、&;；/,，|]" )).map(::normalize).filter { it.isNotEmpty() }.sorted().joinToString("")
    companion object {
        private val punctuation = Regex("[\\s'.,，&\"、()（）`~\\-<>|/\\]\\[!！]")
        private fun normalize(value: String): String = value.lowercase(Locale.ROOT).replace(punctuation, "")
    }
}
