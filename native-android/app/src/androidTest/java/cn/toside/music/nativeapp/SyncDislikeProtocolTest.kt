package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SyncDislikeProtocolTest {
    @Test fun exchangesRnSnapshotsConflictModesAndIncrementalActionsOverRpc() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "dislike-protocol-${System.nanoTime()}"
        lateinit var server: SyncRpc
        lateinit var client: SyncRpc
        val store = DislikeStore(context, name)
        var completed = false
        val protocol = SyncDislikeProtocol(store, { "merge_remote_local" }, { completed = true })
        server = SyncRpc({ client.receive(JSONObject(it.toString())) }, emptyMap(), 3000)
        client = SyncRpc({ server.receive(JSONObject(it.toString())) }, protocol.handlers, 3000)
        try {
            store.save(" Song \n@Artist\nSONG")
            store.setSyncTracking(true)
            assertEquals("song\n@artist", server.call(listOf("dislike_sync_get_list_data")))
            // MD5 of the UTF-8 rule text, without JSON quotes or a trailing newline.
            assertEquals("d41d8cd98f00b204e9800998ecf8427e", SyncWire.textHash(""))
            assertEquals("ebf9bc751489c6c8bec29c410ccdfd4c", server.call(listOf("dislike_sync_get_md5")))
            assertEquals("merge_remote_local", server.call(listOf("dislike_sync_get_sync_mode")))
            server.call(listOf("dislike_sync_set_list_data"), JSONArray().put("Remote\n@Singer"))
            assertEquals("remote\n@singer", store.get().text)
            val add = JSONObject().put("action", "dislike_music_add").put("data", JSONArray().put(JSONObject().put("name", "New")))
            server.call(listOf("onDislikeSyncAction"), JSONArray().put(add))
            assertEquals("remote\n@singer", store.get().text)
            server.call(listOf("dislike_sync_finished"))
            assertTrue(completed)
            server.call(listOf("onDislikeSyncAction"), JSONArray().put(add))
            assertEquals("remote\n@singer\nnew", store.get().text)
            server.call(listOf("onDislikeSyncAction"), JSONArray().put(JSONObject().put("action", "dislike_music_clear")))
            assertEquals("", store.get().text)
            assertNull(store.pendingSyncAction())
        } finally { server.close(); client.close(); context.deleteSharedPreferences(name) }
    }

    @Test fun dislikeConflictModesExcludeFullPlaylistOverwrite() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "dislike-mode-${System.nanoTime()}"
        try {
            val protocol = SyncDislikeProtocol(DislikeStore(context, name), { "overwrite_remote_local_full" })
            try { protocol.handlers.getValue("dislike_sync_get_sync_mode")(JSONArray()); fail("playlist-only mode must be rejected") }
            catch (_: IllegalArgumentException) { }
        } finally { context.deleteSharedPreferences(name) }
    }
}
