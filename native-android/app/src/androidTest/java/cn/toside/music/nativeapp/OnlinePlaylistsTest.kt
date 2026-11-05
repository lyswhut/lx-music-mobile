package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OnlinePlaylistsTest {
    @Test fun parsesQqAndMiguCategoriesAndQqLists() {
        val api = OnlinePlaylists()
        val qq = api.parseQqCategories(JSONArray("""[{"group_name":"语种","v_item":[{"id":123,"name":"国语"}]}]""")).single()
        assertEquals(OnlineTag("123", "国语"), qq.tags.single())
        val lists = api.parseQqCategoryLists(JSONArray("""[{"basic":{"tid":42,"title":"Mix","creator":{"nick":"User"}}}]"""))
        assertEquals("42", lists.single().id)
        val migu = api.parseMiguCategories(JSONArray("""[{"header":{"title":"风格"},"content":[{"texts":["摇滚","456"]}]}]""")).single()
        assertEquals("风格", migu.name)
        assertEquals(OnlineTag("456", "摇滚"), migu.tags.single())
    }
    @Test fun parsesSupportedKuwoCategories() {
        val raw = JSONArray("""[{"name":"风格","data":[{"id":10,"digest":10000,"name":"摇滚"},
            {"id":11,"digest":43,"name":"专题"}]}]""")
        val category = OnlinePlaylists().parseKuwoCategories(raw).single()
        assertEquals("风格", category.name)
        assertEquals(listOf(KuwoTag("10-10000", "摇滚"), KuwoTag("11-43", "专题")), category.tags)
        val lists = OnlinePlaylists().parseKuwoSpecialLists(JSONArray("""[{"list":[{"type":"songlist","id":42,"digest":8,"name":"Mix"}]}]"""))
        assertEquals("42", lists.single().id)
    }
    @Test fun readsSupportedListsAndSongInfo() {
        val service = OnlinePlaylists()
        val items = service.parseLists(JSONArray("""[{"id":123,"digest":8,"name":"List","uname":"Creator"},{"id":456,"digest":4}]"""))
        assertEquals("123", items.single().id)
        val songs = service.parseSongs(JSONArray("""[{"id":42,"name":"Song","artist":"A&B","duration":60,
          "album":"Album","albumid":2,"N_MINFO":"level:1,bitrate:128,format:mp3,size:4M"}]"""))
        assertEquals("A、B", songs.single().artist)
        assertEquals("42", JSONObject(songs.single().sourceInfo!!).getString("songmid"))
    }
    @Test fun mapsKuwoAlbumTracks() {
        val data = JSONObject("""{"name":"Album","albumid":12,"musiclist":[{"id":42,"name":"Song",
            "artist":"Singer","pic":"https://example.org/a.jpg","formats":"MP3128|ALFLAC"}]}""")
        val info = JSONObject(OnlinePlaylists().parseKuwoAlbum(data).single().sourceInfo!!)
        assertEquals("Album", info.getString("albumName"))
        assertEquals("https://example.org/a.jpg", info.getString("img"))
        assertEquals("flac", info.getJSONArray("types").getJSONObject(1).getString("type"))
    }
    @Test fun readsMiguRecommendationsAndSongMetadata() {
        val service = OnlinePlaylists()
        val lists = service.parseMiguLists(JSONObject("""{"contents":[{"contents":[
            {"resType":"2021","resId":"123","txt":"Playlist"},
            {"resType":"2021","resId":"123","txt":"Duplicate"}]}]}"""))
        assertEquals("123", lists.single().id)
        assertEquals("mg", lists.single().source)
        val songs = service.parseMiguSongs(JSONArray("""[{"songId":"42","copyrightId":"88","songName":"Song",
            "duration":120,"singerList":[{"name":"Singer"}],"mrcUrl":"https://example.org/a.mrc",
            "audioFormats":[{"formatType":"ZQ"}]}]"""))
        assertEquals("Song", songs.single().title)
        val info = JSONObject(songs.single().sourceInfo!!)
        assertEquals("https://example.org/a.mrc", info.getString("mrcUrl"))
        assertEquals("flac24bit", info.getJSONArray("types").getJSONObject(0).getString("type"))
    }
    @Test fun readsQqRecommendations() {
        val items = JSONArray("""[{"Playlist":{"basic":{"tid":123,"title":"Rock &amp; Roll","creator":{"nick":"A &amp; B"}}}}]""")
        val list = OnlinePlaylists().parseQqLists(items).single()
        assertEquals("123", list.id)
        assertEquals("Rock & Roll", list.name)
        assertEquals("A & B", list.author)
        assertEquals("tx", list.source)
    }
}
