package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.sync.SyncDislikeOutboxPump

import android.content.Context
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DislikeStoreTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun preservesExistingNativeRulesAndPersistsOnlyUnacknowledgedChanges() = runBlocking {
        val name = "dislike-store-${System.nanoTime()}"
        try {
            context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().putString("rules", "Old Song\n@Artist").commit()
            val store = DislikeStore(context, name)
            assertEquals("old song\n@artist", store.get().text)
            assertNull(store.pendingSyncAction())
            store.save("before sync")
            store.setSyncTracking(true)
            store.add("Song", "Singer")
            val first = store.pendingSyncAction()!!
            assertEquals("dislike_music_add", first.event.getString("action"))
            assertEquals("Singer", first.event.getJSONArray("data").getJSONObject(0).getString("singer"))
            store.save("Replacement")
            store.clear()
            val reopened = DislikeStore(context, name)
            assertEquals("", reopened.get().text)
            assertEquals(first.sequence, reopened.pendingSyncAction()!!.sequence)
            reopened.acknowledgeSyncAction(first.sequence)
            val replacement = reopened.pendingSyncAction()!!
            assertEquals("replacement", replacement.event.getString("data"))
            reopened.acknowledgeSyncThrough(replacement.sequence)
            assertEquals("dislike_music_clear", reopened.pendingSyncAction()!!.event.getString("action"))
            reopened.acknowledgeSyncAction(reopened.pendingSyncAction()!!.sequence)
            assertNull(reopened.pendingSyncAction())
            store.add("New Song", "")
            assertTrue(store.pendingSyncAction()!!.sequence > replacement.sequence)
        } finally { context.deleteSharedPreferences(name) }
    }

    @Test fun remoteChangesDoNotEchoOrDiscardQueuedLocalActions() = runBlocking {
        val name = "dislike-remote-${System.nanoTime()}"
        try {
            val store = DislikeStore(context, name)
            store.setSyncTracking(true)
            store.add("local", "")
            val pending = store.pendingSyncAction()!!
            store.applyRemoteAction(JSONObject().put("action", "dislike_music_add").put("data", JSONArray()
                .put(JSONObject().put("name", "Remote").put("singer", "Singer"))
                .put(JSONObject().put("name", JSONObject.NULL).put("singer", "Artist@Name"))))
            assertEquals("local\nremote@singer\n@artist#name", store.get().text)
            store.applyRemoteAction(JSONObject().put("action", "dislike_data_overwrite").put("data", "OVERWRITE"))
            assertEquals("overwrite", store.get().text)
            store.applyRemoteAction(JSONObject().put("action", "dislike_music_clear"))
            assertEquals("", store.get().text)
            assertEquals(pending.sequence, store.pendingSyncAction()!!.sequence)
            store.acknowledgeSyncAction(pending.sequence)
            assertNull(store.pendingSyncAction())
        } finally { context.deleteSharedPreferences(name) }
    }

    @Test fun invalidRemoteBatchIsAtomicAndDuplicateAddsCreateNoOutgoingAction() = runBlocking {
        val name = "dislike-validation-${System.nanoTime()}"
        try {
            val store = DislikeStore(context, name)
            store.save("song@singer")
            store.setSyncTracking(true)
            store.add("SONG", "SINGER")
            assertNull(store.pendingSyncAction())
            val event = JSONObject().put("action", "dislike_music_add").put("data", JSONArray()
                .put(JSONObject().put("name", "valid")).put(JSONObject().put("name", 123)))
            try { store.applyRemoteAction(event); fail("invalid batch must fail") } catch (_: IllegalStateException) { }
            assertEquals("song@singer", store.get().text)
            assertNull(store.pendingSyncAction())
            try { store.applyRemoteAction(JSONObject().put("action", "unknown")); fail("unknown action must fail") }
            catch (_: IllegalStateException) { }
            assertEquals("song@singer", store.get().text)
        } finally { context.deleteSharedPreferences(name) }
    }

    @Test fun snapshotNegotiationPausesLocalEditsAcrossInstancesButAllowsRemoteWrites() = runBlocking {
        val name = "dislike-gate-${System.nanoTime()}"
        try {
            val store = DislikeStore(context, name)
            val other = DislikeStore(context, name)
            coroutineScope {
                val started = CompletableDeferred<Unit>()
                lateinit var edit: kotlinx.coroutines.Deferred<DislikeRules>
                store.pauseLocalMutations {
                    edit = async { started.complete(Unit); other.add("after snapshot", "") }
                    started.await()
                    assertFalse(edit.isCompleted)
                    store.overwriteRemote("snapshot")
                    store.setSyncTracking(true)
                    store.acknowledgeSyncThrough(store.syncOutboxWatermark())
                }
                withTimeout(3000) { edit.await() }
            }
            assertEquals("snapshot\nafter snapshot", store.get().text)
            assertEquals("dislike_music_add", store.pendingSyncAction()!!.event.getString("action"))
        } finally { context.deleteSharedPreferences(name) }
    }

    @Test fun failedSendRetainsActionAndResumesInOrder() = runBlocking {
        val name = "dislike-pump-${System.nanoTime()}"
        try {
            val store = DislikeStore(context, name)
            store.setSyncTracking(true)
            store.add("first", ""); store.save("second"); store.clear()
            val sent = mutableListOf<String>()
            val failing = SyncDislikeOutboxPump(store) { event ->
                if (event.getString("action") == "dislike_data_overwrite") error("network down")
                sent.add(event.getString("action"))
            }
            try { failing.drain(); fail("send must fail") } catch (_: IllegalStateException) { }
            assertEquals(listOf("dislike_music_add"), sent)
            val resumed = SyncDislikeOutboxPump(DislikeStore(context, name)) { event -> sent.add(event.getString("action")); Unit }
            resumed.drain()
            assertEquals(listOf("dislike_music_add", "dislike_data_overwrite", "dislike_music_clear"), sent)
            assertNull(store.pendingSyncAction())
        } finally { context.deleteSharedPreferences(name) }
    }
}
