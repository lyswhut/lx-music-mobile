package cn.toside.music.nativeapp

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Explicit release check: public metadata only, never resolves or downloads audio. */
@RunWith(AndroidJUnit4::class)
class ProviderSmokeTest {
    private fun probe(source: String) = runBlocking {
        assumeTrue(InstrumentationRegistry.getArguments().getString("liveProviders") == "true")
        val errors = mutableListOf<String>()
        suspend fun step(name: String, task: suspend () -> Int) {
            try { val count = task(); Log.i("ProviderSmoke", "$source $name count=$count"); assertTrue("$source $name returned no data", count > 0) }
            catch (e: Exception) { errors += "$name: ${e.javaClass.simpleName}: ${e.message}"; Log.e("ProviderSmoke", "$source ${errors.last()}") }
            catch (e: AssertionError) { errors += "$name: ${e.message}" }
        }
        var songs = emptyList<Song>()
        step("search") { OnlineSearch().search("周杰伦", source = source).also { songs = it }.size }
        if (songs.isNotEmpty()) step("nextSearchPage") {
            val first = songs.map { it.source to it.id }.toSet()
            OnlineSearch().search("周杰伦", page = 2, source = source).count { it.source to it.id !in first }
        }
        step("suggestions") { SearchSuggestions().suggestions(source, "周杰").size }
        step("hot") { SearchSuggestions().hot(source).size }
        if (songs.isNotEmpty()) {
            step("hotComments") { OnlineComments().load(songs.first(), true).comments.size }
            step("newComments") { OnlineComments().load(songs.first(), false).comments.size }
            step("lyrics") { OnlineLyrics().forSong(songs.first()).size }
        }
        var playlists = emptyList<OnlinePlaylist>()
        step("playlists") { OnlinePlaylists().recommended(source = source).also { playlists = it }.size }
        if (playlists.isNotEmpty()) step("playlistSongs") { OnlinePlaylists().songs(playlists.first(), 1).size }
        step("playlistSearch") { PlaylistSearch().search(source, "周杰伦", 1).size }
        step("charts") {
            val boards = OnlineBoards()
            when (source) {
                "kw" -> KuwoBoards().songs(KuwoBoards().boards.first(), 1).size
                "tx" -> boards.songs(boards.qqBoards.first(), 1).size
                "wy" -> boards.songs(boards.wyBoards.first(), 1).size
                "mg" -> boards.songs(boards.miguBoards.first(), 1).size
                else -> boards.songs(boards.boards.first(), 1).size
            }
        }
        step("categories") {
            val api = OnlinePlaylists()
            when (source) {
                "kw" -> api.kuwoCategories().size
                "kg" -> KugouPlaylists().categories().size
                "tx" -> api.qqCategories().size
                "wy" -> NeteaseApi().categories().size
                else -> api.miguCategories().size
            }
        }
        Log.i("ProviderSmoke", "$source finished: ${errors.joinToString("; ")}")
        assertTrue("$source live verification: ${errors.joinToString("; ")}", errors.isEmpty())
    }
    @Test fun kuwo() = probe("kw")
    @Test fun kugou() = probe("kg")
    @Test fun qq() = probe("tx")
    @Test fun netease() = probe("wy")
    @Test fun migu() = probe("mg")
}
