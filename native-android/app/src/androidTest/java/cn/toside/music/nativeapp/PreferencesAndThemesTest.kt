package cn.toside.music.nativeapp

import android.content.Context
import android.content.ContextWrapper
import android.graphics.Color
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class PreferencesAndThemesTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun themesRetainAllOriginalChoicesAndRespectSavedSystemVariants() {
        val name = "theme-test-${System.nanoTime()}"
        val context = object : ContextWrapper(target) {
            override fun getSharedPreferences(value: String, mode: Int) = super.getSharedPreferences(if (value == "app-settings") name else value, mode)
        }
        try {
            val themes = NativeThemes(context); val all = themes.all()
            assertEquals(16, all.size); assertEquals(16, all.map { it.id }.toSet().size)
            assertEquals(Color.rgb(77, 175, 124), themes.active().primary)
            AppPreferences(context).set("theme.id", "black")
            assertTrue(themes.active().dark)
            assertEquals(Color.rgb(19, 19, 19), UiPalette(context, themes.active()).surface)
            all.filter { it.image.isNotBlank() }.forEach { theme -> context.assets.open("themes/${theme.image}").close() }
            assertEquals(Color.argb(127, 1, 2, 3), NativeThemes.color("rgba(1, 2, 3, 0.5)"))
        } finally { target.deleteSharedPreferences(name) }
    }
    @Test fun traditionalLyricsKeepWordOffsetsAndEmojiAndCacheCleaningKeepsImports() = runBlocking {
        val name = "lyric-theme-${System.nanoTime()}"
        val directory = File(target.cacheDir, name).apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = directory }
        try {
            assertEquals("後台歌曲😀", ChineseText.traditional(context, "后台歌曲😀"))
            val settings = PlayerSettings(context, name); settings.traditionalLyrics = true
            val line = LyricLine(0, "后台歌曲😀", listOf(LyricWord(0, 1000, 0, 2)))
            assertEquals(line.text.length, LyricRendering.text(line, settings).length)
            assertEquals("後台歌曲😀", LyricRendering.text(line, settings))
            val song = Song(1, Uri.EMPTY, "test", "", 1000)
            Lyrics(context).cache(song, listOf(line))
            val imported = File(directory, "lyrics/2.lrc").apply { writeText("[00:00]import") }
            assertTrue(CacheMaintenance(context).lyricBytes() > 0)
            CacheMaintenance(context).clearLyrics()
            assertEquals(0L, CacheMaintenance(context).lyricBytes())
            assertTrue(imported.isFile); assertEquals("import", Lyrics(context).load(2, "local").single().text)
        } finally { directory.deleteRecursively(); target.deleteSharedPreferences(name) }
    }
    @Test fun addAtTopBatchOrderingMatchesRemoteReplay() = runBlocking {
        val name = "pref-list-${System.nanoTime()}"
        val context = object : ContextWrapper(target) {
            override fun getSharedPreferences(value: String, mode: Int) = super.getSharedPreferences(if (value == "app-settings") name else value, mode)
        }
        val lists = Playlists(context, "$name.db")
        try {
            lists.setSyncTracking(true)
            val id = lists.create("top")
            val one = Song(1, Uri.EMPTY, "One", "", 1000, "kw", """{"songmid":"1"}""")
            val two = one.copy(id = 2, title = "Two", sourceInfo = """{"songmid":"2"}""")
            val three = one.copy(id = 3, title = "Three", sourceInfo = """{"songmid":"3"}""")
            lists.add(id, one); AppPreferences(context).set("list.addMusicLocationType", "top")
            lists.batchSongs(listOf(two, three), null, id, false)
            assertEquals(listOf(two, three, one), lists.songs(id))
            var remote = org.json.JSONObject("""{"defaultList":[],"loveList":[],"userList":[]}""")
            lists.pendingSyncActions(emptyMap()).forEach { remote = SyncListReducer.apply(remote, it.event) }
            val items = remote.getJSONArray("userList").getJSONObject(0).getJSONArray("list")
            assertEquals(listOf("kw_2", "kw_3", "kw_1"), (0 until items.length()).map { items.getJSONObject(it).getString("id") })
            val other = lists.create("move source"); val four = one.copy(id = 4, sourceInfo = """{"songmid":"4"}""")
            lists.add(other, four); lists.moveSong(other, id, four)
            assertEquals(listOf(four, two, three, one), lists.songs(id)); assertTrue(lists.songs(other).isEmpty())
            remote = org.json.JSONObject("""{"defaultList":[],"loveList":[],"userList":[]}""")
            lists.pendingSyncActions(emptyMap()).forEach { remote = SyncListReducer.apply(remote, it.event) }
            val moved = remote.getJSONArray("userList").getJSONObject(0).getJSONArray("list")
            assertEquals(listOf("kw_4", "kw_2", "kw_3", "kw_1"), (0 until moved.length()).map { moved.getJSONObject(it).getString("id") })
        } finally { lists.close(); target.deleteDatabase("$name.db"); target.deleteSharedPreferences(name) }
    }
}
