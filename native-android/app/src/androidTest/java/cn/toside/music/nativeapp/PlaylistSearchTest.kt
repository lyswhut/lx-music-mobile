package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PlaylistSearchTest {
    @Test fun mapsProviderSearchResultsToPlayablePlaylistIds() {
        val parser = PlaylistSearch()
        val netease = parser.parse(JSONArray("""[{"id":123,"name":"Mix","creator":{"nickname":"User"}}]"""), "wy").single()
        assertEquals("User", netease.author)
        val qq = parser.parse(JSONArray("""[{"dissid":234,"dissname":"Rock &amp; Roll","creator":{"name":"User"}}]"""), "tx").single()
        assertEquals("Rock & Roll", qq.name)
        val kuwo = parser.parse(JSONArray("""[{"playlistid":345,"name":"Mix","nickname":"User"}]"""), "kw").single()
        assertEquals("8", kuwo.digest)
        val migu = parser.parse(JSONArray("""[{"id":456,"name":"Mix","userName":"User"},{"id":"bad"}]"""), "mg").single()
        assertEquals("456", migu.id)
        assertEquals("User", migu.author)
    }
}
