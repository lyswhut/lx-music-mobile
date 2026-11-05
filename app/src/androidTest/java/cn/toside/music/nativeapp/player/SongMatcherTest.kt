package cn.toside.music.nativeapp.player

import cn.toside.music.nativeapp.data.LegacyBackup
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.utils.ExternalLinks
import cn.toside.music.nativeapp.utils.SongShare

import android.content.Intent
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.CompletableDeferred
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.atomic.AtomicInteger

@RunWith(AndroidJUnit4::class)
class SongMatcherTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun rejectsDifferentVersionsSingersAndDurationsAndSharesConcurrentQueries() = runBlocking {
        val reference = Song(1, Uri.EMPTY, "A Song", "B、A", 180_000, "kw", """{"albumName":"Album"}""")
        val exact = reference.copy(id = 2, title = "A Song", artist = "A & B", source = "wy")
        val badVersion = exact.copy(id = 3, title = "A Song (Live)")
        val badArtist = exact.copy(id = 4, artist = "Someone else")
        val badDuration = exact.copy(id = 5, duration = 190_000)
        val calls = AtomicInteger()
        val matcher = SongMatcher(context, this) { _, source ->
            calls.incrementAndGet(); delay(25)
            if (source == "kg") error("one provider unavailable")
            listOf(badVersion, badArtist, badDuration, exact.copy(source = source))
        }
        assertEquals(exact, matcher.best(reference, listOf(badVersion, badArtist, badDuration, exact)))
        assertNull(matcher.best(reference, listOf(badVersion, badArtist, badDuration)))
        val matches = listOf(async { matcher.find(reference) }, async { matcher.find(reference) }).awaitAll()
        assertEquals(4, calls.get()); assertEquals(matches[0], matches[1]); assertEquals(setOf("tx", "wy", "mg"), matches[0].map { it.source }.toSet())
        assertEquals(matches[0], matcher.find(reference)); assertEquals(4, calls.get())
        assertEquals(1, matcher.cacheCount); matcher.clearCache(); assertEquals(0, matcher.cacheCount)
        assertEquals(matches[0], matcher.find(reference)); assertEquals(8, calls.get())
        val other = reference.copy(title = "Other song")
        // Cache invalidation targets one recording and preserves unrelated entries.
        matcher.clearSong(other); assertEquals(1, matcher.cacheCount)
        matcher.clearSong(reference); assertEquals(0, matcher.cacheCount)
    }
    @Test fun clearingCacheDuringSearchDoesNotRestoreStaleEntriesOrCancelPlaybackRequest() = runBlocking {
        val started = CompletableDeferred<Unit>(); val release = CompletableDeferred<Unit>()
        val song = Song(1, Uri.EMPTY, "Song", "Artist", 1000, "kw")
        val matcher = SongMatcher(context, this) { _, source -> started.complete(Unit); release.await(); listOf(song.copy(source = source)) }
        val request = async { matcher.find(song) }; started.await()
        matcher.clearCache(); release.complete(Unit)
        assertEquals(4, request.await().size); assertEquals(0, matcher.cacheCount)
        assertEquals(4, matcher.find(song).size); assertEquals(1, matcher.cacheCount)
    }
    @Test fun shareLinksRoundTripWithoutChangingNamesOrExposingLocalFilePaths() {
        val online = Song(42, Uri.EMPTY, "A & B + C", "Singer", 1000, "kw", """{"songmid":"42","types":[{"type":"128k"}],"_types":{"128k":{}}}""")
        val intent = SongShare.intent(online)
        assertEquals(Intent.ACTION_SEND, intent.action)
        val parsed = ExternalLinks.parse(Uri.parse(intent.getStringExtra(Intent.EXTRA_TEXT)))
        assertEquals("play", parsed.action)
        val restored = LegacyBackup.convert(parsed.data!!, emptyMap())!!
        assertEquals(online.title, restored.title); assertEquals(online.artist, restored.artist)
        val local = online.copy(source = "local", uri = Uri.parse("file:///private/music/secret.mp3"), sourceInfo = null)
        assertEquals("https://www.kuwo.cn/play_detail/42", SongShare.providerPage(online).toString())
        assertNull(SongShare.providerPage(local))
        val link = SongShare.link(local)
        assertFalse(link.toString().contains("private")); assertEquals("searchPlay", ExternalLinks.parse(link).action)
    }
}
