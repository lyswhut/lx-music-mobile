package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.data.DislikeStore
import cn.toside.music.nativeapp.data.Playlists

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException

@RunWith(AndroidJUnit4::class)
class BackgroundSyncTest {
    @Test fun separateRepositoriesSendBothModulesAndReconnectWithoutAnActivity() = runBlocking<Unit> {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "background-${System.nanoTime()}"
        val lists = Playlists(context, "$name.db")
        val editor = Playlists(context, "$name.db")
        val settings = BackgroundSyncSettings(context, name)
        val lifetime = SupervisorJob()
        val scope = CoroutineScope(lifetime + Dispatchers.IO)
        LoopbackSyncServer().use { server ->
            server.rejectNextSocket = true
            val sync = BackgroundSync(scope, lists, DislikeStore(context, "$name-rules"), settings, { emptyMap() },
                { _, _ -> server.credentials }, { _, _ -> }, retryDelay = { delay(50) })
            try {
                sync.start(server.address)
                val first = server.nextPeer()
                withTimeout(5000) { sync.state.first { it.connected } }
                editor.create("background local")
                server.nextEvent("list", "list_create")
                DislikeStore(context, "$name-rules").add("background song", "artist")
                server.nextEvent("dislike", "dislike_music_add")
                first.close()
                val next = server.nextPeer()
                withTimeout(5000) { sync.state.first { it.connected } }
                next.call("onDislikeSyncAction", JSONArray().put(org.json.JSONObject().put("action", "dislike_data_overwrite").put("data", "remote rule")))
                assertEquals("remote rule", DislikeStore(context, "$name-rules").get().text)
                assertTrue(settings.enabled)
                sync.stop()
                assertFalse(sync.state.value.active)
                assertFalse(settings.enabled)
                assertNull(server.failure.get())
            } finally { sync.close(); lifetime.cancelAndJoin() }
        }
        lists.close(); editor.close(); context.deleteDatabase("$name.db")
        context.deleteSharedPreferences(name); context.deleteSharedPreferences("$name-rules")
    }

    @Test fun conflictsSurviveCancelledConnectionWaitsAndRejectStaleOrInvalidReplies() = runBlocking<Unit> {
        val choices = SyncConflictChoice()
        val first = async { choices.choose("server", SyncFeature.DISLIKE) }
        val request = withTimeout(3000) { choices.request.first { it != null } }!!
        first.cancelAndJoin()
        assertEquals(request, choices.request.value)
        assertFalse(choices.submit(request.id + 1, "cancel"))
        assertFalse(choices.submit(request.id, "overwrite_remote_local_full"))
        val retried = async { choices.choose("server", SyncFeature.DISLIKE) }
        assertTrue(choices.submit(request.id, "merge_remote_local"))
        assertEquals("merge_remote_local", withTimeout(3000) { retried.await() })
        assertNull(choices.request.value)
        choices.clear()
    }

    @Test fun firstConnectionNetworkFailuresRetryButAuthenticationFailuresStop() = runBlocking<Unit> {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "background-auth-${System.nanoTime()}"
        val lists = Playlists(context, "$name.db")
        val settings = BackgroundSyncSettings(context, name)
        val lifetime = SupervisorJob()
        val scope = CoroutineScope(lifetime + Dispatchers.IO)
        var attempts = 0
        val sync = BackgroundSync(scope, lists, DislikeStore(context, "$name-rules"), settings, { emptyMap() }, {
            _, _ -> if (++attempts == 1) throw IOException("offline") else error("需要同步码")
        }, { _, _ -> }, retryDelay = { delay(10) })
        try {
            sync.start("http://localhost")
            val stopped = withTimeout(3000) { sync.state.first { !it.active && it.message.contains("需要同步码") } }
            assertEquals(2, attempts)
            assertFalse(settings.enabled)
            assertTrue(stopped.message.startsWith("同步已停止"))
        } finally {
            sync.close(); lifetime.cancelAndJoin(); lists.close(); context.deleteDatabase("$name.db")
            context.deleteSharedPreferences(name); context.deleteSharedPreferences("$name-rules")
        }
    }

    @Test fun uiAndServiceShareTheSnapshotMutationGateAndRemoteRefreshSignals() = runBlocking<Unit> {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "background-gate-${System.nanoTime()}.db"
        val service = Playlists(context, name)
        val ui = Playlists(context, name)
        try {
            val started = kotlinx.coroutines.CompletableDeferred<Unit>()
            lateinit var edit: kotlinx.coroutines.Deferred<Long>
            service.pauseLocalMutations {
                edit = async { started.complete(Unit); ui.create("after snapshot") }
                started.await()
                assertFalse(edit.isCompleted)
            }
            withTimeout(3000) { edit.await() }
            val refreshed = async(start = kotlinx.coroutines.CoroutineStart.UNDISPATCHED) { ui.changes.first() }
            service.overwriteSyncSnapshot(service.syncSnapshot(emptyMap()), emptyMap())
            withTimeout(3000) { refreshed.await() }
            assertEquals("after snapshot", ui.list().first { it.syncId.startsWith("native_") }.name)
        } finally { service.close(); ui.close(); context.deleteDatabase(name) }
    }
}
