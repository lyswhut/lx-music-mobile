package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.data.DislikeStore
import cn.toside.music.nativeapp.data.Playlists

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SyncSessionTest {
    private class Peer(
        val handlers: Map<String, suspend (JSONArray) -> Any?>,
        val handshake: suspend Peer.() -> Unit,
    ) : SyncConnection {
        val sent = Channel<Pair<String, JSONObject>>(Channel.UNLIMITED)
        @Volatile var failSend = false
        @Volatile var onSend: suspend () -> Unit = {}
        var closed = false
        override suspend fun connect() = handshake()
        override suspend fun call(path: List<String>, arguments: JSONArray): Any? {
            onSend()
            if (failSend) error("connection lost")
            sent.send(path.single() to JSONObject(arguments.getJSONObject(0).toString()))
            return null
        }
        suspend fun remote(name: String, args: JSONArray = JSONArray()): Any? = handlers.getValue(name)(args)
        suspend fun negotiate(versions: JSONObject): JSONObject = remote("getEnabledFeatures", JSONArray().put("server").put(versions)) as JSONObject
        override fun close() { closed = true }
    }

    private suspend fun withStores(test: suspend (Playlists, DislikeStore) -> Unit) {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "session-${System.nanoTime()}"
        val lists = Playlists(context, "$name.db")
        try { test(lists, DislikeStore(context, name)) }
        finally { lists.close(); context.deleteDatabase("$name.db"); context.deleteSharedPreferences(name) }
    }
    private fun session(lists: Playlists, dislikes: DislikeStore, onPeer: (Peer) -> Unit,
        modes: suspend (SyncFeature) -> String = { "merge_local_remote" }, handshake: suspend Peer.() -> Unit): SyncSession =
        SyncSession(lists, dislikes, { emptyMap() }, modes, connectionFactory = SyncConnectionFactory { _, _, handlers, _ ->
            Peer(handlers, handshake).also(onPeer)
        })
    private suspend fun SyncSession.connectForTest() = connect("http://unused", SyncCredentials("server", "device", "unused"))

    @Test fun negotiatesBothFeaturesAndSendsLocalChangesWithoutEchoingRemoteChanges() = runBlocking {
        withStores { lists, dislikes ->
            dislikes.save("local snapshot")
            dislikes.setSyncTracking(true)
            dislikes.add("offline", "")
            lateinit var peer: Peer
            val chosen = mutableListOf<SyncFeature>()
            val connection = session(lists, dislikes, { peer = it }, { chosen.add(it); "merge_local_remote" }) {
                val enabled = negotiate(JSONObject().put("list", 1).put("dislike", 1))
                assertFalse(enabled.getJSONObject("list").getBoolean("skipSnapshot"))
                assertFalse(enabled.getJSONObject("dislike").getBoolean("skipSnapshot"))
                remote("list_sync_get_sync_mode")
                remote("dislike_sync_get_sync_mode")
                assertEquals("local snapshot\noffline", remote("dislike_sync_get_list_data"))
                remote("dislike_sync_set_list_data", JSONArray().put("merged snapshot"))
                remote("list_sync_finished"); remote("dislike_sync_finished"); remote("finished")
            }
            try {
                connection.connectForTest()
                assertTrue(connection.state.value.connected)
                assertEquals(setOf(SyncFeature.LIST, SyncFeature.DISLIKE), connection.state.value.features)
                assertEquals(listOf(SyncFeature.LIST, SyncFeature.DISLIKE), chosen)
                assertNull(dislikes.pendingSyncAction()) // Acknowledged by the negotiated snapshot.
                peer.remote("onDislikeSyncAction", JSONArray().put(JSONObject().put("action", "dislike_data_overwrite").put("data", "remote")))
                assertEquals("remote", dislikes.get().text)
                assertNull(dislikes.pendingSyncAction())
                assertTrue(peer.sent.tryReceive().isFailure)
                dislikes.add("new", "artist")
                val sent = withTimeout(3000) { peer.sent.receive() }
                assertEquals("onDislikeSyncAction", sent.first)
                assertEquals("dislike_music_add", sent.second.getString("action"))
                lists.create("new playlist")
                val listSent = withTimeout(3000) { peer.sent.receive() }
                assertEquals("onListSyncAction", listSent.first)
                assertEquals("list_create", listSent.second.getString("action"))
            } finally { connection.close() }
            assertTrue(peer.closed)
        }
    }

    @Test fun listOnlyServerLeavesDislikeOutboxUntouchedAndCannotWriteDislikes() = runBlocking {
        withStores { lists, dislikes ->
            dislikes.setSyncTracking(true); dislikes.add("pending", "")
            val pending = dislikes.pendingSyncAction()!!
            lateinit var peer: Peer
            val connection = session(lists, dislikes, { peer = it }) {
                val enabled = negotiate(JSONObject().put("list", 1).put("dislike", 2))
                assertTrue(enabled.has("list")); assertFalse(enabled.has("dislike"))
                remote("list_sync_finished"); remote("finished")
            }
            try {
                connection.connectForTest()
                assertEquals(setOf(SyncFeature.LIST), connection.state.value.features)
                assertEquals(pending.sequence, dislikes.pendingSyncAction()!!.sequence)
                try { peer.remote("dislike_sync_set_list_data", JSONArray().put("unexpected")); fail("disabled feature must be rejected") }
                catch (_: IllegalStateException) { }
                assertEquals("pending", dislikes.get().text)
                assertTrue(peer.sent.tryReceive().isFailure)
            } finally { connection.close() }
        }
    }

    @Test fun dislikeOnlyServerDoesNotReadLocalMusicOrWaitForPlaylistCompletion() = runBlocking {
        withStores { lists, dislikes ->
            val connection = SyncSession(lists, dislikes, { error("unsupported lists must not access media") }, { "merge_local_remote" },
                connectionFactory = SyncConnectionFactory { _, _, handlers, _ -> Peer(handlers) {
                    val enabled = negotiate(JSONObject().put("dislike", 1))
                    assertFalse(enabled.has("list"))
                    remote("dislike_sync_finished"); remote("finished")
                } })
            try {
                connection.connectForTest()
                assertTrue(connection.state.value.connected)
                assertEquals(setOf(SyncFeature.DISLIKE), connection.state.value.features)
            } finally { connection.close() }
        }
    }

    @Test fun incompleteOrCancelledHandshakeDoesNotAcknowledgeOfflineEdits() = runBlocking {
        withStores { lists, dislikes ->
            dislikes.setSyncTracking(true); dislikes.add("offline", "")
            val pending = dislikes.pendingSyncAction()!!
            for (cancel in listOf(false, true)) {
                val connection = session(lists, dislikes, {}, { "cancel" }) {
                    negotiate(JSONObject().put("list", 1).put("dislike", 1))
                    remote("list_sync_finished")
                    if (cancel) { remote("dislike_sync_get_sync_mode"); remote("dislike_sync_finished") }
                    remote("finished")
                }
                try {
                    try { connection.connectForTest(); fail("incomplete/cancelled handshake must fail") }
                    catch (_: IllegalStateException) { }
                    assertFalse(connection.state.value.connected)
                    assertEquals(pending.sequence, dislikes.pendingSyncAction()!!.sequence)
                } finally { connection.close() }
            }
        }
    }

    @Test fun sendFailureDisconnectsAndPreservesUnacknowledgedDislikeAction() = runBlocking {
        withStores { lists, dislikes ->
            lateinit var peer: Peer
            val connection = session(lists, dislikes, { peer = it }) {
                negotiate(JSONObject().put("dislike", 1))
                remote("dislike_sync_finished"); remote("finished")
            }
            try {
                connection.connectForTest()
                peer.failSend = true
                dislikes.add("retry me", "")
                val failed = withTimeout(3000) { connection.state.first { it.message.startsWith("同步发送失败") } }
                assertFalse(failed.connected)
                assertEquals("dislike_music_add", dislikes.pendingSyncAction()!!.event.getString("action"))
            } finally { connection.close() }
        }
    }

    @Test fun incompatibleFeatureVersionsDoNotConsumePendingChanges() = runBlocking {
        withStores { lists, dislikes ->
            dislikes.setSyncTracking(true); dislikes.add("pending", "")
            val sequence = dislikes.pendingSyncAction()!!.sequence
            val versions = listOf(JSONObject(), JSONObject().put("list", 2),
                JSONObject().put("dislike", "1"), JSONObject().put("list", 1.5))
            for (version in versions) {
                val connection = session(lists, dislikes, {}) { negotiate(version); Unit }
                try {
                    try { connection.connectForTest(); fail("incompatible feature versions must fail") }
                    catch (_: IllegalStateException) { }
                    assertFalse(connection.state.value.connected)
                    assertEquals(sequence, dislikes.pendingSyncAction()!!.sequence)
                } finally { connection.close() }
            }
        }
    }

    @Test fun disconnectDuringSendRetainsRetryableStatusAndPendingAction() = runBlocking {
        withStores { lists, dislikes ->
            val sending = CompletableDeferred<Unit>()
            val acknowledgement = CompletableDeferred<Unit>()
            lateinit var disconnect: (SyncDisconnect) -> Unit
            lateinit var peer: Peer
            val connection = SyncSession(lists, dislikes, { emptyMap() }, { "merge_local_remote" },
                connectionFactory = SyncConnectionFactory { _, _, handlers, onDisconnected ->
                    disconnect = onDisconnected
                    Peer(handlers) {
                        negotiate(JSONObject().put("dislike", 1))
                        remote("dislike_sync_finished"); remote("finished")
                    }.also { peer = it }
                })
            try {
                connection.connectForTest()
                peer.onSend = { sending.complete(Unit); acknowledgement.await() }
                dislikes.add("keep for reconnect", "")
                withTimeout(3000) { sending.await() }
                disconnect(SyncDisconnect("同步连接已断开：test", retryable = true))
                assertFalse(connection.state.value.connected)
                assertEquals("同步连接已断开：test", connection.state.value.message)
                assertEquals("dislike_music_add", dislikes.pendingSyncAction()!!.event.getString("action"))
                assertTrue(peer.sent.tryReceive().isFailure)
            } finally { connection.close() }
        }
    }

    @Test fun rpcAcknowledgementTimeoutBecomesRetryableRatherThanSilentlyStoppingThePump() = runBlocking {
        withStores { lists, dislikes ->
            lateinit var peer: Peer
            val connection = session(lists, dislikes, { peer = it }) {
                negotiate(JSONObject().put("dislike", 1))
                remote("dislike_sync_finished"); remote("finished")
            }
            try {
                connection.connectForTest()
                peer.onSend = { withTimeout(20) { kotlinx.coroutines.awaitCancellation() } }
                dislikes.add("retry after acknowledgement timeout", "")
                val failed = withTimeout(3000) { connection.state.first { !it.connected && it.message.startsWith("同步发送失败") } }
                assertTrue(failed.retryable)
                assertNotNull(dislikes.pendingSyncAction())
            } finally { connection.close() }
        }
    }
}
