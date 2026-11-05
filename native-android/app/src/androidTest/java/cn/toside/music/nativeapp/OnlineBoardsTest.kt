package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OnlineBoardsTest {
    @Test fun convertsBoardItemsToCompatibleKugouSongInfo() {
        val items = JSONArray("""[{"audio_id":123,"hash":"hash1","songname":"Song","duration":120,
            "authors":[{"author_name":"Singer"}],"album_id":7,"remark":"Album",
            "filesize":100,"320filesize":200,"320hash":"hash2"}]""")
        val song = OnlineBoards().parse(items).single()
        assertEquals("Singer", song.artist)
        val info = JSONObject(song.sourceInfo!!)
        assertEquals("hash1", info.getString("hash"))
        assertEquals("hash2", info.getJSONObject("_types").getJSONObject("320k").getString("hash"))
    }
    @Test fun convertsMiguBoardMetadata() {
        val raw = JSONArray("""[{"objectInfo":{"songId":"42","copyrightId":"88","songName":"Song","length":"03:12",
          "artists":[{"name":"Singer"}],"newRateFormats":[{"formatType":"ZQ"}],"lrcUrl":"https://example.org/a.lrc"}}]""")
        val song = OnlineBoards().parseMigu(raw).single()
        assertEquals(192_000L, song.duration)
        assertEquals("Singer", song.artist)
        val info = JSONObject(song.sourceInfo!!)
        assertEquals("88", info.getString("copyrightId"))
        assertEquals("https://example.org/a.lrc", info.getString("lrcUrl"))
        assertEquals("flac24bit", info.getJSONArray("types").getJSONObject(0).getString("type"))
    }
}
