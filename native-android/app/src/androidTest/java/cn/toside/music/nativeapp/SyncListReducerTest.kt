package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SyncListReducerTest {
    private fun initial() = JSONObject("""{"defaultList":[],"loveList":[],"userList":[
      {"id":"a","name":"A","locationUpdateTime":null,"list":[{"id":"1","name":"One"},{"id":"2","name":"Two"}]},
      {"id":"b","name":"B","locationUpdateTime":null,"list":[]}]}""")
    private fun event(text: String) = JSONObject(text)
    @Test fun appliesPlaylistActionsAndPreservesOriginalOnFailure() {
        val old = initial()
        var value = SyncListReducer.apply(old, event("""{"action":"list_create","data":{"position":0,"listInfos":[{"id":"c","name":"C","locationUpdateTime":null}]}}"""))
        value = SyncListReducer.apply(value, event("""{"action":"list_update","data":[{"id":"c","name":"Changed","locationUpdateTime":null}]}"""))
        value = SyncListReducer.apply(value, event("""{"action":"list_update_position","data":{"position":2,"ids":["c"]}}"""), 123L)
        val last = value.getJSONArray("userList").getJSONObject(2)
        assertEquals("Changed", last.getString("name")); assertEquals(123L, last.getLong("locationUpdateTime"))
        value = SyncListReducer.apply(value, event("""{"action":"list_remove","data":["b"]}"""))
        assertEquals(2, value.getJSONArray("userList").length())
        try { SyncListReducer.apply(value, event("""{"action":"list_update_position","data":{"position":0,"ids":["missing"]}}""")); fail("unknown id") }
        catch (_: IllegalStateException) { }
        assertEquals("a", old.getJSONArray("userList").getJSONObject(0).getString("id"))
        assertEquals("a", value.getJSONArray("userList").getJSONObject(0).getString("id"))
    }
    @Test fun appliesMusicAddMoveUpdateReorderOverwriteAndClear() {
        var value = initial()
        value = SyncListReducer.apply(value, event("""{"action":"list_music_add","data":{"id":"a","musicInfos":[{"id":"3","name":"Three"},{"id":"1","name":"Duplicate"}],"addMusicLocationType":"top"}}"""))
        assertEquals("3", value.getJSONArray("userList").getJSONObject(0).getJSONArray("list").getJSONObject(0).getString("id"))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_move","data":{"fromId":"a","toId":"b","musicInfos":[{"id":"1","name":"One"}],"addMusicLocationType":"bottom"}}"""))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_update","data":[{"id":"b","musicInfo":{"id":"1","name":"Updated","singer":"Singer","source":"kw","interval":null,"meta":{}}}]}"""))
        assertEquals("Updated", value.getJSONArray("userList").getJSONObject(1).getJSONArray("list").getJSONObject(0).getString("name"))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_update_position","data":{"listId":"a","position":0,"ids":["2"]}}"""))
        assertEquals("2", value.getJSONArray("userList").getJSONObject(0).getJSONArray("list").getJSONObject(0).getString("id"))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_remove","data":{"listId":"a","ids":["2"]}}"""))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_overwrite","data":{"listId":"love","musicInfos":[{"id":"4"}]}}"""))
        value = SyncListReducer.apply(value, event("""{"action":"list_music_clear","data":["a","love"]}"""))
        assertEquals(0, value.getJSONArray("userList").getJSONObject(0).getJSONArray("list").length())
        assertEquals(0, value.getJSONArray("loveList").length())
        assertTrue(value.getJSONArray("userList").getJSONObject(1).getJSONArray("list").length() == 1)
    }
}
