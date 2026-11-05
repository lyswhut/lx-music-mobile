package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class KuwoBoardsTest {
    @Test fun encryptionMatchesExistingProtocol() {
        val api = KuwoBoards()
        val (data, sign) = api.encode("{}", 1700000000000)
        assertEquals("8dzohWDndIHlrb8vdm/VfQ==", data)
        assertEquals("24223B41A67AD8E1C29D26C727A3863A", sign)
        assertEquals(0, api.decode(data).length())
    }
    @Test fun boardSongPreservesCoverAndQualities() {
        val song = KuwoBoards().parse(JSONArray("""[{"id":12,"name":"Song","artist":"Singer","duration":30,"pic":"https://example.org/a.jpg",
          "n_minfo":"level:1,bitrate:128,format:mp3,size:4M"}]""")).single()
        val info = org.json.JSONObject(song.sourceInfo!!)
        assertEquals("https://example.org/a.jpg", info.getString("img"))
        assertEquals("4M", info.getJSONObject("_types").getJSONObject("128k").getString("size"))
    }
}
