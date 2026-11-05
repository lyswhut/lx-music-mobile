package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import android.content.ContextWrapper
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.security.KeyStore

@RunWith(AndroidJUnit4::class)
class PlaylistCredentialsTest {
    @Test fun credentialSuffixIsRemovedFromPlaylistIdentityAndNeverEntersBackupOrSyncMetadata() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "playlist-link-${System.nanoTime()}"
        val context = object : ContextWrapper(target) {
            override fun getSharedPreferences(value: String, mode: Int) = super.getSharedPreferences("$name-$value", mode)
        }
        val lists = Playlists(context, "$name.db")
        try {
            val list = ExternalLinks.playlist("wy", "https://music.163.com/#/playlist?id=123###import-token-fixture", context)
            assertEquals("123", list.id); assertFalse(list.toString().contains("import-token-fixture"))
            assertEquals("import-token-fixture", PlaylistCredentials(context).load("123"))
            lists.importOnline(list, emptyList())
            val snapshot = lists.syncSnapshot(emptyMap())
            assertFalse(snapshot.toString().contains("import-token-fixture"))
            val imported = LegacyBackup.parse(LegacyBackup.encodeSnapshot(snapshot), emptyMap())
            assertEquals("123", JSONObject(imported.lists.single { it.name == list.name }.metadata!!).getString("sourceListId"))
        } finally {
            lists.close(); target.deleteDatabase("$name.db")
            target.deleteSharedPreferences("$name-playlist-credentials"); target.deleteSharedPreferences("$name-app-settings")
        }
    }
    @Test fun playlistTokenSurvivesStoreRecreationIsEncryptedAndCanBeCleared() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "playlist-access-${System.nanoTime()}"
        val store = PlaylistCredentials(target, name, name)
        try {
            store.save("123", "private-token-fixture")
            assertEquals("private-token-fixture", PlaylistCredentials(target, name, name).load("123"))
            assertNull(store.load("999"))
            assertFalse(target.getSharedPreferences(name, 0).all.toString().contains("private-token-fixture"))
            listOf("token\r\nCookie: bad", "token;more", "", "a".repeat(4097)).forEach {
                try { store.save("123", it); fail("invalid cookie must fail") } catch (_: IllegalArgumentException) { }
            }
            assertEquals("private-token-fixture", store.load("123"))
            store.clear(); assertNull(store.load("123"))
        } finally { target.deleteSharedPreferences(name); KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(name) } }
    }
    @Test fun privatePlaylistPaginationUsesOnlyItsOwnCredentialAndKeepsItOutOfSongMetadata() = runBlocking {
        val calls = mutableListOf<Triple<String, JSONObject, String?>>()
        val api = NeteaseApi { path, data, cookie ->
            calls.add(Triple(path, data, cookie))
            if (path.contains("playlist/detail")) JSONObject().put("playlist", JSONObject().put("trackIds", JSONArray().apply {
                repeat(101) { put(JSONObject().put("id", it + 1)) }
            })) else JSONObject().put("songs", JSONArray().put(JSONObject().put("id", 101).put("name", "Private song")
                .put("ar", JSONArray().put(JSONObject().put("name", "Artist"))).put("al", JSONObject()).put("dt", 1000)))
                .put("privileges", JSONArray().put(JSONObject().put("id", 101).put("maxbr", 128000)))
        }
        val songs = api.playlistSongs("123", 2, "only-this-list")
        assertEquals(2, calls.size); assertTrue(calls.all { it.third == "MUSIC_U=only-this-list" })
        assertEquals("[101]", calls.last().second.getString("ids"))
        assertEquals(1, songs.size); assertFalse(songs.single().sourceInfo.orEmpty().contains("only-this-list"))
        calls.clear(); api.playlistSongs("999", 2)
        assertTrue(calls.all { it.third == null })
        calls.clear(); assertTrue(api.playlistSongs("123", 3, "only-this-list").isEmpty()); assertEquals(1, calls.size)
    }
}
