package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.data.Playlists
import cn.toside.music.nativeapp.data.Song

import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject

@RunWith(AndroidJUnit4::class)
class SyncOutboxTest {
    @Test fun stopsAtFailedSendAndResumesFromUnacknowledgedAction() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "sync-pump-${System.nanoTime()}.db"
        val playlists = Playlists(context, name)
        try {
            playlists.setSyncTracking(true)
            val id = playlists.create("list")
            playlists.add(id, Song(7, Uri.EMPTY, "song", "artist", 1000, "kw", """{"songmid":"7","types":[],"_types":{}}"""))
            val sent = mutableListOf<String>()
            val failing = SyncOutboxPump(playlists, { emptyMap() }) { event ->
                val action = event.getString("action")
                if (action == "list_music_add") error("network down")
                sent.add(action)
            }
            try { failing.drain(); fail("send failure must propagate") } catch (_: IllegalStateException) { }
            assertEquals(listOf("list_create"), sent)
            assertEquals(listOf("list_music_add"), playlists.pendingSyncActions(emptyMap()).map { it.event.getString("action") })
            val resumed = SyncOutboxPump(playlists, { emptyMap() }) { event: JSONObject -> sent.add(event.getString("action")); Unit }
            resumed.drain()
            assertEquals(listOf("list_create", "list_music_add"), sent)
            assertTrue(playlists.pendingSyncActions(emptyMap()).isEmpty())
        } finally { playlists.close(); context.deleteDatabase(name) }
    }
    @Test fun recordsAndRecoversOrderedLocalChangesWithoutDroppingUnresolvedFiles() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "sync-outbox-${System.nanoTime()}.db"
        val playlists = Playlists(context, name)
        try {
            playlists.create("before tracking")
            assertTrue(playlists.pendingSyncActions(emptyMap()).isEmpty())
            playlists.setSyncTracking(true)
            val id = playlists.create("tracked")
            val syncId = playlists.list().first { it.id == id }.syncId
            val local = Song(7, Uri.parse("content://media/7"), "Local", "Artist", 1000)
            val online = Song(42, Uri.EMPTY, "Online", "Artist", 2000, "kw", """{"songmid":"42","types":[],"_types":{}}""")
            playlists.add(id, local); playlists.add(id, online); playlists.remove(id, online)
            try { playlists.pendingSyncActions(emptyMap()); fail("missing path must not be silently sent") }
            catch (_: IllegalStateException) { }
            val events = playlists.pendingSyncActions(mapOf(7L to "/music/a.mp3"))
            assertEquals(listOf("list_create", "list_music_add", "list_music_add", "list_music_remove"), events.map { it.event.getString("action") })
            assertEquals(syncId, events.first().event.getJSONObject("data").getJSONArray("listInfos").getJSONObject(0).getString("id"))
            val localInfo = events[1].event.getJSONObject("data").getJSONArray("musicInfos").getJSONObject(0)
            assertEquals("local_/music/a.mp3", localInfo.getString("id"))
            assertEquals("/music/a.mp3", localInfo.getJSONObject("meta").getString("filePath"))
            assertEquals("kw_42", events[3].event.getJSONObject("data").getJSONArray("ids").getString(0))
            playlists.acknowledgeSyncAction(events.first().sequence)
            playlists.close()
            assertEquals(events.drop(1).map { it.sequence }, playlists.pendingSyncActions(mapOf(7L to "/music/a.mp3")).map { it.sequence })
            playlists.delete(id)
            assertEquals("list_remove", playlists.pendingSyncActions(mapOf(7L to "/music/a.mp3")).last().event.getString("action"))
        } finally { playlists.close(); context.deleteDatabase(name) }
    }
}
