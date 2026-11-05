package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OnlineSearchTest {
    @Test fun convertsKuwoSearchResultsToSourceProtocol() {
        val result = OnlineSearch().parseKw(JSONArray("""[{"MUSICRID":"MUSIC_42","SONGNAME":"Title",
            "ARTIST":"A&B","DURATION":"125","N_MINFO":"level:1,bitrate:128,format:mp3,size:5M"}]"""))
        assertEquals("A、B", result.single().artist)
        val info = JSONObject(result.single().sourceInfo!!)
        assertEquals("42", info.getString("songmid"))
        assertEquals("02:05", info.getString("interval"))
        assertEquals("5M", info.getJSONObject("_types").getJSONObject("128k").getString("size"))
    }
    @Test fun convertsQqResultsAndSignsExactRequestBody() {
        val search = OnlineSearch()
        assertEquals("zzc3aeb15c8g08cxbjovqteliiq9ebaheowma1999c1cf", search.signTx("test"))
        val result = search.parseTx(JSONArray("""[{"mid":"abc","id":12,"title":"Title","interval":60,
            "singer":[{"name":"Singer"}],"album":{"mid":"album","name":"Album"},
            "file":{"media_mid":"media","size_128mp3":1,"size_flac":2}}]"""))
        val info = JSONObject(result.single().sourceInfo!!)
        assertEquals("media", info.getString("strMediaMid"))
        assertEquals("album", info.getString("albumMid"))
        assertEquals(12, info.getInt("songId"))
        assertEquals(2, info.getJSONArray("types").length())
    }
    @Test fun convertsNeteaseAndMiguResults() {
        val search = OnlineSearch()
        assertEquals("4DC723619A991588865191FD2F319BAD89A665F3FF2B75B10678911D4E9910E4690E5F68E0095E53773148F1312770C2786A0951D5B32887C8AE362CEF057841F3A83A42DA35956C149F335E924490D4", search.eapi("/api/test", "{}"))
        val wy = search.parseWy(JSONArray("""[{"baseInfo":{"simpleSongData":{"id":77,"name":"Song","dt":61000,
          "ar":[{"name":"Singer"}],"al":{"id":9,"name":"Album"},"privilege":{"maxbr":320000}}}}]"""))
        assertEquals("01:01", JSONObject(wy.single().sourceInfo!!).getString("interval"))
        assertEquals(2, JSONObject(wy.single().sourceInfo).getJSONArray("types").length())
        val mg = search.parseMg(JSONArray("""[[{"songId":"1","copyrightId":"2","name":"Song","duration":90,
          "singerList":[{"name":"Singer"}],"audioFormats":[{"formatType":"PQ"}]}]]"""))
        assertEquals("2", JSONObject(mg.single().sourceInfo!!).getString("copyrightId"))
        assertEquals(90_000L, mg.single().duration)
    }
}
