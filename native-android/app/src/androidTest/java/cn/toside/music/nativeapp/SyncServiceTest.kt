package cn.toside.music.nativeapp

import android.app.AlertDialog
import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Assume.assumeFalse
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SyncServiceTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val context get() = instrumentation.targetContext
    private suspend fun waitFor(condition: suspend () -> Boolean) = withTimeout(15_000) { while (!condition()) delay(50) }
    private fun open(): MainActivity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
    private suspend fun service(activity: MainActivity): SyncService {
        val field = MainActivity::class.java.getDeclaredField("syncService").apply { isAccessible = true }
        waitFor { field.get(activity) != null }
        return field.get(activity) as SyncService
    }
    private fun finish(activity: MainActivity) { instrumentation.runOnMainSync { activity.finish() }; instrumentation.waitForIdleSync() }
    private suspend fun destroyed(service: SyncService) {
        val field = SyncService::class.java.getDeclaredField("lifetime").apply { isAccessible = true }
        waitFor { (field.get(service) as Job).isCompleted }
    }
    private fun restore(preferences: SharedPreferences, saved: Map<String, *>) {
        preferences.edit().clear().apply {
            saved.forEach { (key, value) -> when (value) {
                is String -> putString(key, value)
                is Boolean -> putBoolean(key, value)
                is Long -> putLong(key, value)
                is Int -> putInt(key, value)
                is Float -> putFloat(key, value)
            } }
        }.commit()
    }
    private suspend fun withEnvironment(test: suspend (LoopbackSyncServer, Playlists, String) -> Unit) {
        // Do not disturb a user's active sync session or unsent operations if running against an existing installation.
        assumeFalse(BackgroundSyncSettings(context).enabled)
        val lists = Playlists(context)
        assumeTrue(lists.pendingSyncActions(emptyMap()).isEmpty())
        val original = lists.list()
        for (list in original) assumeTrue(lists.songs(list.id).none { it.source == "local" })
        val tracking = lists.readableDatabase.rawQuery("SELECT tracking FROM sync_config WHERE id = 1", null)
            .use { it.moveToFirst(); it.getInt(0) != 0 }
        val preferences = listOf("background-sync", "dislike-rules", "sync-credentials").associateWith {
            context.getSharedPreferences(it, Context.MODE_PRIVATE)
        }
        val saved = preferences.mapValues { it.value.all.toMap() }
        val prefix = "background_test_${System.nanoTime()}"
        try { LoopbackSyncServer().use { server ->
            SyncCredentialStore(context).save(server.address, server.credentials)
            test(server, lists, prefix)
            assertNull(server.failure.get())
        } } finally {
            context.stopService(Intent(context, SyncService::class.java))
            instrumentation.waitForIdleSync()
            // Only test-created lists and synthesized built-in lists are removed; existing content is retained.
            lists.list().filter { it.syncId.startsWith(prefix) || it.name.startsWith(prefix) ||
                (it.syncId in setOf("default", "love") && original.none { before -> before.id == it.id }) }.forEach {
                lists.writableDatabase.delete("playlists", "id = ?", arrayOf(it.id.toString()))
            }
            lists.acknowledgeSyncThrough(lists.syncOutboxWatermark()); lists.setSyncTracking(tracking)
            preferences.forEach { (name, store) -> restore(store, saved.getValue(name)) }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(101)
            lists.close()
        }
    }
    private fun onlineSong(id: Long, name: String) = Song(id, Uri.EMPTY, name, "test artist", 1000, "kw",
        """{"songmid":"$id","types":[],"_types":{}}""")

    @Test fun explicitExitRetainsSyncIntentAndOfflineEditsAreSentOnNextLaunch() = runBlocking {
        withEnvironment { server, lists, prefix ->
            var activity: MainActivity? = open()
            val original = service(activity!!)
            try {
                instrumentation.runOnMainSync { SyncService.connect(activity!!, server.address, "") }
                server.nextPeer(); waitFor { original.state.value.connected }; server.listSnapshots.receive()
                instrumentation.runOnMainSync { context.startService(Intent(context, SyncService::class.java).setAction(SyncService.ACTION_EXIT)) }
                waitFor { !original.state.value.active }
                finish(activity!!); activity = null; destroyed(original)
                assertTrue(BackgroundSyncSettings(context).enabled)
                val id = lists.create("${prefix}_while_exited")
                assertTrue(lists.pendingSyncActions(emptyMap()).isNotEmpty())
                activity = open(); val resumed = service(activity!!)
                server.nextPeer(); waitFor { resumed.state.value.connected }
                val snapshot = withTimeout(5000) { server.listSnapshots.receive() }
                assertTrue(snapshot.toString().contains("${prefix}_while_exited"))
                waitFor { lists.pendingSyncActions(emptyMap()).isEmpty() }
                assertTrue(lists.list().any { it.id == id })
                SyncService.disconnect(activity!!); waitFor { !resumed.state.value.active }
                finish(activity!!); activity = null; destroyed(resumed)
            } finally { activity?.let(::finish) }
        }
    }

    @Test fun syncsBothDirectionsAfterHomeAndActivityDestructionAndRestoresTheService() = runBlocking {
        withEnvironment { server, lists, prefix ->
            var activity: MainActivity? = open()
            var running = service(activity!!)
            try {
                instrumentation.runOnMainSync { SyncService.connect(activity!!, server.address, "") }
                var peer = server.nextPeer()
                waitFor { running.state.value.connected }
                instrumentation.uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
                val bound = MainActivity::class.java.getDeclaredField("syncBound").apply { isAccessible = true }
                waitFor { !bound.getBoolean(activity) }
                finish(activity!!); activity = null

                val localId = lists.create("${prefix}_local")
                server.nextEvent("list", "list_create")
                lists.add(localId, onlineSong(7654321, "local background song"))
                server.nextEvent("list", "list_music_add")
                DislikeStore(context).add("${prefix}_local rule", "")
                server.nextEvent("dislike", "dislike_music_add")

                val remoteId = "${prefix}_remote"
                peer.call("onListSyncAction", JSONArray().put(JSONObject().put("action", "list_create").put("data",
                    JSONObject().put("position", -1).put("listInfos", JSONArray().put(JSONObject().put("id", remoteId).put("name", remoteId))))))
                peer.call("onListSyncAction", JSONArray().put(JSONObject().put("action", "list_music_add").put("data",
                    JSONObject().put("id", remoteId).put("addMusicLocationType", "bottom")
                        .put("musicInfos", JSONArray().put(LegacyBackup.musicInfo(onlineSong(7654322, "remote background song"), emptyMap()))))))
                peer.call("onDislikeSyncAction", JSONArray().put(JSONObject().put("action", "dislike_music_add")
                    .put("data", JSONArray().put(JSONObject().put("name", "${prefix}_remote rule").put("singer", "")))))
                val remote = lists.list().first { it.syncId == remoteId }
                assertEquals("remote background song", lists.songs(remote.id).single().title)
                assertTrue(DislikeStore(context).get().text.contains("${prefix}_remote rule"))
                val notifications = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).activeNotifications
                if (android.os.Build.VERSION.SDK_INT < 33) assertTrue(notifications.any { it.id == 101 && it.notification.flags and Notification.FLAG_FOREGROUND_SERVICE != 0 })

                peer.close()
                peer = server.nextPeer()
                waitFor { running.state.value.connected }
                peer.call("onDislikeSyncAction", JSONArray().put(JSONObject().put("action", "dislike_music_add")
                    .put("data", JSONArray().put(JSONObject().put("name", "${prefix}_reconnected")))))
                assertTrue(DislikeStore(context).get().text.contains("${prefix}_reconnected"))
                activity = open()
                assertSame(running, service(activity!!))
                assertEquals(2, server.connections.get())
                finish(activity!!); activity = null

                // Simulate service recreation while retaining the persisted connection intent and encrypted credentials.
                context.stopService(Intent(context, SyncService::class.java))
                destroyed(running)
                assertTrue(BackgroundSyncSettings(context).enabled)
                activity = open()
                running = service(activity!!)
                server.nextPeer()
                waitFor { running.state.value.connected }
                finish(activity!!); activity = null

                // Exercise Android 15's timeout callback without changing the device's global timeout settings.
                instrumentation.runOnMainSync { running.onTimeout(1, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC) }
                destroyed(running)
                assertTrue(BackgroundSyncSettings(context).enabled)
                activity = open()
                running = service(activity!!)
                server.nextPeer()
                waitFor { running.state.value.connected }
                val stop = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).activeNotifications
                    .firstOrNull { it.id == 101 }?.notification?.actions?.firstOrNull()?.actionIntent
                if (stop != null) stop.send() else instrumentation.runOnMainSync { SyncService.disconnect(activity!!) }
                waitFor { !running.state.value.active }
                assertFalse(BackgroundSyncSettings(context).enabled)
                finish(activity!!); activity = null
                destroyed(running)
            } finally {
                activity?.let(::finish)
                context.stopService(Intent(context, SyncService::class.java))
                destroyed(running)
            }
        }
    }

    @Test fun backgroundConflictReappearsAfterActivityRecreationWithoutChoosingADefault() = runBlocking {
        withEnvironment { server, _, _ ->
            server.requestDislikeConflict = true
            var activity: MainActivity? = open()
            val running = service(activity!!)
            try {
                instrumentation.runOnMainSync { SyncService.connect(activity!!, server.address, ""); activity!!.moveTaskToBack(true) }
                waitFor { running.state.value.conflict != null }
                val request = running.state.value.conflict!!
                finish(activity!!); activity = null
                assertFalse(running.state.value.connected)
                assertEquals(request.id, running.state.value.conflict!!.id)
                activity = open()
                assertSame(running, service(activity!!))
                val dialog = MainActivity::class.java.getDeclaredField("syncConflictDialog").apply { isAccessible = true }
                waitFor { (dialog.get(activity) as? AlertDialog)?.isShowing == true }
                finish(activity!!); activity = open()
                service(activity!!)
                waitFor { (dialog.get(activity) as? AlertDialog)?.isShowing == true }
                assertEquals(request.id, running.state.value.conflict!!.id)
                instrumentation.runOnMainSync {
                    val choice = dialog.get(activity) as AlertDialog
                    choice.listView.performItemClick(choice.listView.getChildAt(1), 1, 1)
                }
                server.nextPeer()
                waitFor { running.state.value.connected }
                assertNull(running.state.value.conflict)
                instrumentation.runOnMainSync { SyncService.disconnect(activity!!) }
                waitFor { !running.state.value.active }
            } finally {
                activity?.let(::finish)
                context.stopService(Intent(context, SyncService::class.java)); destroyed(running)
            }
        }
    }
}
