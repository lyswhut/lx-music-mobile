package cn.toside.music.nativeapp

import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPOutputStream

@RunWith(AndroidJUnit4::class)
class LegacyBackupTest {
    @Test fun readsGzipV2AndResolvesOnlyMatchingLocalFiles() {
        val text = """{"type":"playListPart_v2","data":{"name":"收藏","list":[
          {"source":"local","name":"本地","meta":{"filePath":"/music/a.mp3"}},
          {"source":"local","name":"不存在","meta":{"filePath":"/music/missing.mp3"}},
          {"source":"kg","name":"在线","singer":"歌手","interval":"02:03","meta":
            {"songId":123,"albumName":"专辑","hash":"abc","qualitys":[],"_qualitys":{}}}
        ]}}"""
        val zipped = ByteArrayOutputStream().also { output -> GZIPOutputStream(output).use { it.write(text.toByteArray()) } }.toByteArray()
        assertTrue(LegacyBackup.containsLocalSongs(zipped))
        val local = Song(7, Uri.parse("content://media/7"), "本地", "歌手", 1000)
        val result = LegacyBackup.parse(zipped, mapOf("/music/a.mp3" to local))
        assertEquals(1, result.skipped)
        assertEquals("收藏", result.lists.single().name)
        assertEquals(local, result.lists.single().songs.first())
        val online = result.lists.single().songs.last()
        assertEquals(123_000L, online.duration)
        assertEquals("abc", JSONObject(online.sourceInfo!!).getString("hash"))
        assertEquals(123, JSONObject(online.sourceInfo).getInt("songmid"))
    }
    @Test fun detectsLocalSongsWithoutRequestingAccessForOnlineBackups() {
        val online = """{"type":"playListPart_v2","data":{"name":"在线","list":[{"source":"kg","name":"歌曲"}]}}""".toByteArray()
        val local = """{"type":"playListPart_v2","data":{"name":"本地","list":[{"source":"local","name":"歌曲"}]}}""".toByteArray()
        assertFalse(LegacyBackup.containsLocalSongs(online))
        assertTrue(LegacyBackup.containsLocalSongs(local))
    }
    @Test fun exportedListsRoundTripWithLocalAndOnlineSongs() {
        val local = Song(7, Uri.parse("content://media/7"), "本地", "歌手", 1000)
        val sourceInfo = """{"songmid":123,"source":"kg","name":"在线","singer":"歌手","hash":"abc","types":[],"_types":{}}"""
        val online = Song(123, Uri.EMPTY, "在线", "歌手", 123_000, "kg", sourceInfo)
        val bytes = LegacyBackup.encode(listOf(Playlist(2, "收藏") to listOf(local, online)), mapOf(7L to "/music/a.mp3"))
        val restored = LegacyBackup.parse(bytes, mapOf("/music/a.mp3" to local))
        assertEquals(0, restored.skipped)
        assertEquals("收藏", restored.lists.single().name)
        assertEquals(local, restored.lists.single().songs.first())
        val actual = restored.lists.single().songs.last()
        assertEquals(online.id, actual.id)
        assertEquals("abc", JSONObject(actual.sourceInfo!!).getString("hash"))
    }
}
