package cn.toside.music.nativeapp.sync

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONArray
import org.json.JSONObject

@RunWith(AndroidJUnit4::class)
class SyncWireTest {
    @Test fun encodesAndDecodesPlainAndCompressedMessages() {
        val short = "测试😀"
        assertEquals(short, SyncWire.encode(short))
        assertEquals(short, SyncWire.decode(short))
        val long = "歌曲😀".repeat(300)
        val encoded = SyncWire.encode(long)
        assertTrue(encoded.startsWith("cg_"))
        assertEquals(long, SyncWire.decode(encoded))
    }
    @Test fun decodesNodeGzipVector() {
        assertEquals("hello sync", SyncWire.decode("cg_H4sIAAAAAAAACstIzcnJVyiuzEsGAJHDEMkKAAAA"))
    }
    @Test fun hashesEmptySnapshotLikeJavascript() {
        val snapshot = JSONObject().put("defaultList", JSONArray()).put("loveList", JSONArray()).put("userList", JSONArray())
        assertEquals("109cb8eb5ad2a8024a1858d037defdf7", SyncWire.snapshotHash(snapshot))
    }
}
