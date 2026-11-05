package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.online.OnlinePlaylist
import cn.toside.music.nativeapp.utils.ExternalLinks

import android.content.Intent
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ExternalMigrationTest {
    @Test fun recognizesPlaylistLinksAndDecodesLxDataOnce() {
        val examples = mapOf("kw" to "https://www.kuwo.cn/playlist_detail/123", "kg" to "https://www.kugou.com/yy/special/single/123.html",
            "tx" to "https://y.qq.com/n/ryqq/playlist/123", "wy" to "https://music.163.com/#/playlist?id=123", "mg" to "https://music.migu.cn/v3/music/playlist/123")
        examples.forEach { (source, url) -> assertEquals(source, ExternalLinks.sourceFromUrl(url)); assertEquals("123", ExternalLinks.playlistId(source, url)) }
        assertNull(ExternalLinks.sourceFromUrl("https://music.163.com.evil.test/playlist?id=123"))
        val data = JSONObject().put("name", "A & B + C").put("source", "kw").put("songmid", "123")
        val link = Uri.parse("lxmusic://music/play").buildUpon().appendQueryParameter("data", data.toString()).build()
        val parsed = ExternalLinks.parse(link)
        assertEquals("music", parsed.type); assertEquals("play", parsed.action); assertEquals("A & B + C", parsed.data!!.getString("name"))
        val paths = ExternalLinks.parse(Uri.parse("lxmusic://songlist/play/wy/https%3A%2F%2Fmusic.163.com%2F%23%2Fplaylist%3Fid%3D123/2"))
        assertEquals(listOf("wy", "https://music.163.com/#/playlist?id=123", "2"), paths.paths)
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        assertNotNull(context.packageManager.resolveActivity(Intent(Intent.ACTION_VIEW, link).setPackage(context.packageName), 0))
    }
    @Test fun backupRestoreIsAtomicKeepsIdsMetadataAndRecordsOverwriteEvents() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "backup-restore-${System.nanoTime()}.db"; val lists = Playlists(context, name)
        try {
            val extra = lists.create("unrelated")
            lists.setSyncTracking(true)
            val bytes = """{"type":"playListPart_v2","data":{"id":"remote-id","name":"saved","source":"wy","sourceListId":"55","extra":"keep list","list":[{"id":"wy_42","source":"wy","name":"online","singer":"artist","interval":"01:01","meta":{"songId":42,"extra":"keep song","qualitys":[],"_qualitys":{}}}]}}""".toByteArray()
            val parsed = LegacyBackup.parse(bytes, emptyMap())
            assertEquals(1, lists.restoreBackup(parsed.lists))
            val row = lists.list().single { it.syncId == "remote-id" }
            assertEquals("wy", row.source); assertEquals("55", row.sourceListId)
            lists.rename(row.id, "local name")
            lists.restoreBackup(parsed.lists)
            assertEquals(row.id, lists.list().single { it.syncId == "remote-id" }.id)
            assertEquals("local name", lists.list().single { it.id == row.id }.name)
            assertTrue(lists.list().any { it.id == extra })
            val snapshot = lists.syncSnapshot(emptyMap())
            val saved = snapshot.getJSONArray("userList").getJSONObject(1)
            assertEquals("keep list", saved.getString("extra")); assertEquals("keep song", saved.getJSONArray("list").getJSONObject(0).getJSONObject("meta").getString("extra"))
            val roundTrip = LegacyBackup.parse(LegacyBackup.encodeSnapshot(snapshot), emptyMap())
            assertEquals("remote-id", roundTrip.lists.single { it.syncId == "remote-id" }.syncId)
            val pending = lists.pendingSyncActions(emptyMap())
            assertEquals("list_music_overwrite", pending.last().event.getString("action"))
            val song = lists.songs(row.id).single()
            val importedId = lists.importOnline(OnlinePlaylist("10", "", "provider", "", "wy"), listOf(song))
            lists.replaceSongs(importedId, emptyList())
            assertTrue(lists.songs(importedId).isEmpty())
            assertEquals("10", lists.list().single { it.id == importedId }.sourceListId)
            assertEquals(1, lists.batchSongs(listOf(song, song), row.id, importedId, true))
            assertTrue(lists.songs(row.id).isEmpty()); assertEquals(listOf(song), lists.songs(importedId))
            val before = lists.syncOutboxWatermark()
            try { lists.batchSongs(listOf(song), importedId, -1, true); fail("missing destination must fail") } catch (_: IllegalStateException) { }
            assertEquals(before, lists.syncOutboxWatermark()); assertEquals(listOf(song), lists.songs(importedId))
            lists.batchSongs(listOf(song), importedId, null, true)
            assertEquals("wy_42", lists.pendingSyncActions(emptyMap()).last().event.getJSONObject("data").getJSONArray("ids").getString(0))
        } finally { lists.close(); context.deleteDatabase(name) }
    }
}
