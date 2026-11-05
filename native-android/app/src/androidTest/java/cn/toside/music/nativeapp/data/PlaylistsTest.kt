package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.sync.SyncListReducer

import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject

@RunWith(AndroidJUnit4::class)
class PlaylistsTest {
    @Test fun localEditsProduceReplayableSyncEventsAndPreserveMovedMetadata() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "playlist-edits-${System.nanoTime()}.db"; val lists = Playlists(context, name)
        try {
            lists.setSyncTracking(true)
            val one = lists.create("one"); val two = lists.create("two")
            val local = Song(7, Uri.parse("content://media/7"), "B", "Artist", 1000)
            val online = Song(42, Uri.EMPTY, "A", "Singer", 3000, "kw", """{"songmid":"42","types":[],"_types":{}}""")
            lists.add(one, local); lists.add(one, online); lists.rename(one, "renamed")
            lists.sortSongs(one, "title"); assertEquals(listOf(online, local), lists.songs(one))
            lists.moveSongPosition(one, local, 0); lists.moveSong(one, two, local)
            lists.movePlaylist(two, 0)
            val paths = mapOf(7L to "/music/a.mp3")
            var remote = JSONObject("""{"defaultList":[],"loveList":[],"userList":[]}""")
            val pending = lists.pendingSyncActions(paths)
            pending.forEach { remote = SyncListReducer.apply(remote, it.event) }
            val snapshot = lists.syncSnapshot(paths)
            fun descriptions(json: JSONObject) = json.getJSONArray("userList").let { array -> (0 until array.length()).map { i ->
                val item = array.getJSONObject(i)
                item.getString("name") to item.getJSONArray("list").let { songs -> (0 until songs.length()).map { songs.getJSONObject(it).getString("id") } }
            } }
            assertEquals(descriptions(snapshot), descriptions(remote))
            assertEquals("local_/music/a.mp3", snapshot.getJSONArray("userList").getJSONObject(0).getJSONArray("list").getJSONObject(0).getString("id"))
            lists.clear(two); assertTrue(lists.songs(two).isEmpty())
            try { lists.moveSong(one, -1, online); org.junit.Assert.fail("must reject missing destination") } catch (_: IllegalStateException) { }
            assertEquals(listOf(online), lists.songs(one))
        } finally { lists.close(); context.deleteDatabase(name) }
    }
    @Test fun incrementalChangesAreTransactionalAndPreserveLocalRowIds() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "sync-actions-${System.nanoTime()}.db"
        val playlists = Playlists(context, name)
        try {
            val id = playlists.create("list")
            val syncId = playlists.list().single().syncId
            val first = Song(1, Uri.EMPTY, "first", "artist", 1000, "kw", """{"songmid":"1","types":[],"_types":{}}""")
            assertTrue(playlists.add(id, first))
            val action = JSONObject("""{"action":"list_music_add","data":{"id":"$syncId","addMusicLocationType":"bottom",
              "musicInfos":[{"id":"kw_2","source":"kw","name":"second","singer":"artist","interval":"00:02","meta":{"songId":"2","albumName":"","qualitys":[],"_qualitys":{}}}]}}""")
            playlists.applySyncAction(action, emptyMap())
            assertEquals(id, playlists.list().first { it.syncId == syncId }.id)
            assertEquals(listOf("first", "second"), playlists.songs(id).map { it.title })
            val invalid = JSONObject("""{"action":"list_music_add","data":{"id":"$syncId","musicInfos":[{"id":"local_/missing","source":"local","name":"missing","meta":{"filePath":"/missing"}}]}}""")
            try { playlists.applySyncAction(invalid, emptyMap()); org.junit.Assert.fail("unmatched file must fail") }
            catch (_: IllegalStateException) { }
            assertEquals(listOf("first", "second"), playlists.songs(id).map { it.title })
            val local = Song(3, Uri.EMPTY, "third", "artist", 1000, "kw", """{"songmid":"3","types":[],"_types":{}}""")
            val remote = JSONObject("""{"action":"list_music_add","data":{"id":"$syncId","addMusicLocationType":"bottom",
              "musicInfos":[{"id":"kw_4","source":"kw","name":"fourth","singer":"artist","interval":"00:01","meta":{"songId":"4","albumName":"","qualitys":[],"_qualitys":{}}}]}}""")
            coroutineScope {
                val a = async { playlists.add(id, local) }
                val b = async { playlists.applySyncAction(remote, emptyMap()) }
                a.await(); b.await()
            }
            assertEquals(setOf("first", "second", "third", "fourth"), playlists.songs(id).map { it.title }.toSet())
        } finally { playlists.close(); context.deleteDatabase(name) }
    }
    @Test fun upgradesVersionTwoAndThreeWithoutLosingLists() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (version in listOf(2, 3)) {
            val name = "playlist-upgrade-$version-${System.nanoTime()}.db"
            val path = context.getDatabasePath(name); path.parentFile?.mkdirs()
            SQLiteDatabase.openOrCreateDatabase(path, null).use { db ->
                val extra = if (version == 3) ", sync_id TEXT, position INTEGER NOT NULL DEFAULT 0, source TEXT, source_list_id TEXT, location_update_time INTEGER" else ""
                db.execSQL("CREATE TABLE playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL$extra)")
                db.execSQL("CREATE TABLE songs (playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE, media_id INTEGER NOT NULL, uri TEXT NOT NULL, title TEXT NOT NULL, artist TEXT NOT NULL, duration INTEGER NOT NULL, position INTEGER NOT NULL, source TEXT NOT NULL, source_info TEXT, PRIMARY KEY (playlist_id, source, media_id))")
                if (version == 3) db.execSQL("INSERT INTO playlists(id,name,sync_id,position) VALUES (1,'list','retained-id',1)")
                else db.execSQL("INSERT INTO playlists(id,name) VALUES (1,'list')")
                db.execSQL("INSERT INTO songs VALUES (1,7,'content://media/7','song','artist',1000,0,'local',NULL)")
                db.version = version
            }
            val playlists = Playlists(context, name)
            try {
                assertEquals("song", playlists.songs(1).single().title)
                val list = playlists.list().single()
                assertEquals(if (version == 3) "retained-id" else "native_", if (version == 3) list.syncId else list.syncId.take(7))
            } finally { playlists.close(); context.deleteDatabase(name) }
        }
    }
    @Test fun remoteSnapshotIsAtomicAndPreservesUnknownMetadata() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbName = "sync-playlists-${System.nanoTime()}.db"
        val playlists = Playlists(context, dbName)
        try {
            val oldId = playlists.create("existing")
            val local = Song(7, Uri.parse("content://media/7"), "Local", "Artist", 1000)
            val remote = JSONObject("""{"defaultList":[],"loveList":[{"id":"local_/music/a.mp3","name":"Local","singer":"Artist","source":"local","interval":"00:01","meta":{"songId":"/music/a.mp3","filePath":"/music/a.mp3","ext":"mp3","custom":"keep"}}],
                "userList":[{"id":"remote-id","name":"Remote","source":"kw","sourceListId":"8","locationUpdateTime":42,"extra":"keep list",
                "list":[{"id":"kw_123","name":"Song","singer":"Singer","source":"kw","interval":"01:02",
                "meta":{"songId":"123","albumName":"Album","qualitys":[],"_qualitys":{},"extra":"keep song"}}]}]}""")
            try { playlists.overwriteSyncSnapshot(remote, emptyMap()); org.junit.Assert.fail("missing local path must fail") }
            catch (_: IllegalStateException) { }
            assertEquals(listOf("existing"), playlists.list().map { it.name })
            assertEquals(oldId, playlists.list().single().id)
            playlists.overwriteSyncSnapshot(remote, mapOf("/music/a.mp3" to local))
            val roundTrip = playlists.syncSnapshot(mapOf(7L to "/music/a.mp3"))
            assertEquals("keep", roundTrip.getJSONArray("loveList").getJSONObject(0).getJSONObject("meta").getString("custom"))
            val user = roundTrip.getJSONArray("userList").getJSONObject(0)
            assertEquals("remote-id", user.getString("id"))
            assertEquals("keep list", user.getString("extra"))
            assertEquals("keep song", user.getJSONArray("list").getJSONObject(0).getJSONObject("meta").getString("extra"))
            val remoteRowId = playlists.list().first { it.syncId == "remote-id" }.id
            playlists.overwriteSyncSnapshot(remote, mapOf("/music/a.mp3" to local))
            assertEquals(remoteRowId, playlists.list().first { it.syncId == "remote-id" }.id)
        } finally { playlists.close(); context.deleteDatabase(dbName) }
    }
    @Test fun migratesLocalSongsAndKeepsDifferentSourcesDistinct() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "playlist-test-${System.nanoTime()}.db"
        val path = context.getDatabasePath(name)
        path.parentFile?.mkdirs()
        SQLiteDatabase.openOrCreateDatabase(path, null).use { db ->
            db.execSQL("CREATE TABLE playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)")
            db.execSQL("CREATE TABLE songs (playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE, " +
                "media_id INTEGER NOT NULL, uri TEXT NOT NULL, title TEXT NOT NULL, artist TEXT NOT NULL, " +
                "duration INTEGER NOT NULL, position INTEGER NOT NULL, PRIMARY KEY (playlist_id, media_id))")
            db.execSQL("INSERT INTO playlists VALUES (1, 'test')")
            db.execSQL("INSERT INTO songs VALUES (1, 123, 'content://media/123', 'local', 'artist', 1000, 0)")
            db.version = 1
        }
        val playlists = Playlists(context, name)
        try {
            val old = playlists.songs(1).single()
            assertEquals("local", old.source)
            val migratedId = playlists.list().single().syncId
            assertTrue(migratedId.startsWith("native_"))
            val newId = playlists.create("new")
            val newSyncId = playlists.list().first { it.id == newId }.syncId
            assertTrue(newSyncId.startsWith("native_") && newSyncId != migratedId)
            playlists.close()
            assertEquals(migratedId, playlists.list().first { it.id == 1L }.syncId)
            assertEquals(newSyncId, playlists.list().first { it.id == newId }.syncId)
            playlists.delete(newId)
            val online = Song(123, Uri.EMPTY, "online", "artist", 2000, "kg", "{}")
            assertTrue(playlists.add(1, online))
            assertFalse(playlists.add(1, online))
            assertEquals(listOf("local", "kg"), playlists.songs(1).map { it.source })
            try { playlists.syncSnapshot(emptyMap()); org.junit.Assert.fail("unmatched local paths must not be silently lost") }
            catch (_: IllegalArgumentException) { }
            playlists.remove(1, online)
            val syncOnline = online.copy(sourceInfo = """{"songmid":123,"hash":"abc"}""")
            assertTrue(playlists.add(1, syncOnline))
            val snapshot = playlists.syncSnapshot(mapOf(123L to "/music/test.mp3"))
            val list = snapshot.getJSONArray("userList").getJSONObject(0)
            assertEquals(migratedId, list.getString("id"))
            assertEquals("local_/music/test.mp3", list.getJSONArray("list").getJSONObject(0).getString("id"))
            assertEquals("123_abc", list.getJSONArray("list").getJSONObject(1).getString("id"))
            playlists.remove(1, online)
            assertEquals(listOf(old), playlists.songs(1))
            playlists.delete(1)
            assertTrue(playlists.songs(1).isEmpty())
        } finally { playlists.close(); context.deleteDatabase(name) }
    }
}
