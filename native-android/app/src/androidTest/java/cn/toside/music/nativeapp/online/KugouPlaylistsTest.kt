package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class KugouPlaylistsTest {
    @Test fun mapsCategoryIdsAndNames() {
        val groups = JSONObject("""{"风格":{"data":[{"id":12,"name":"摇滚"},{"id":"bad","name":"Invalid"}]}}""")
        val category = KugouPlaylists().parseCategories(groups).single()
        assertEquals("风格", category.name)
        assertEquals(KugouTag("12", "摇滚"), category.tags.single())
    }
    @Test fun mapsPublicPlaylistAndAudioMetadata() {
        val api = KugouPlaylists()
        val lists = api.parseLists(JSONArray("""[{"specialid":123,"specialname":"Rock &amp; Roll","nickname":"Creator"}]"""))
        assertEquals("Rock & Roll", lists.single().name)
        assertEquals("kg", lists.single().source)
        val songs = api.parseSongs(JSONArray("""[[{"author_name":"Singer","songname":"Song",
          "album_info":{"album_name":"Album","album_id":7},"audio_info":{"audio_id":42,"hash":"hash1",
          "timelength":123000,"filesize":100,"filesize_320":200,"hash_320":"hash2"}}]]"""))
        val song = songs.single()
        assertEquals(123000L, song.duration)
        assertEquals("Singer", song.artist)
        val info = JSONObject(song.sourceInfo!!)
        assertEquals("hash1", info.getString("hash"))
        assertEquals("hash2", info.getJSONObject("_types").getJSONObject("320k").getString("hash"))
    }
}
