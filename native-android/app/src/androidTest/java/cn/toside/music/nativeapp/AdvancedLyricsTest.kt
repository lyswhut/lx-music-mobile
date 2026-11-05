package cn.toside.music.nativeapp

import android.content.ContextWrapper
import android.net.Uri
import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class AdvancedLyricsTest {
    @Test fun kugouLanguageBlocksAndWordTimingRemainAttachedToTheSameLine() {
        val language = """{"content":[{"type":1,"lyricContent":[["你好"],["世界"]]},{"type":0,"lyricContent":[["ni ","hao"],["shi jie"]]}]}"""
        val encoded = Base64.encodeToString(language.toByteArray(), Base64.NO_WRAP)
        val lines = OnlineLyrics().parseKrcText("[offset:100]\n[language:$encoded]\n[1000,800]<0,400,0>Hello <400,400,0>world\n[2000,400]<0,400,0>next")
        assertEquals("Hello world", lines[0].text); assertEquals(1100L, lines[0].timeMs)
        assertEquals("你好", lines[0].translation); assertEquals("ni hao", lines[0].romanization)
        assertEquals(1500L, lines[0].words[1].startMs)
        assertEquals("世界", lines[1].translation)
    }
    @Test fun neteaseUsesYrcAndKeepsTranslatedAndRomanizedLines() {
        val data = JSONObject("""{"lrc":{"lyric":"[00:01.00]fallback"},"yrc":{"lyric":"[1000,1000](1000,500,0)Hello (1500,500,0)world"},"ytlrc":{"lyric":"[00:01.00]你好世界"},"yromalrc":{"lyric":"[00:01.00]ni hao shi jie"}}""")
        val line = LyricFormats.netease(data).single()
        assertEquals("Hello world", line.text); assertEquals(2, line.words.size)
        assertEquals("你好世界", line.translation); assertEquals("ni hao shi jie", line.romanization)
    }
    @Test fun qqEntitiesPreserveWordIndicesAndTranslationCanUseOrdinaryLrc() {
        val lines = OnlineLyrics().parseQrc("<Lyric LyricContent=\"[1000,1000]Hello &amp; (1000,500)world(1500,500)&#10;[2000,500]Next(2000,500)\"/>")
        assertEquals("Hello & world", lines[0].text)
        assertEquals(8, lines[0].words[1].start)
        assertEquals(2, lines.size)
    }
    @Test fun cachedVariantsAndWordsSurviveReloadAndImportedLyricsTakePriority() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(target.cacheDir, "lyric-cache-${System.nanoTime()}").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = directory }
        try {
            val song = Song(42, Uri.EMPTY, "song", "artist", 3000, "kw")
            val lines = LrcParser.parse("[00:01.00]<0,500>Hello").map { it.copy(translation = "你好", romanization = "ni hao") }
            val lyrics = Lyrics(context)
            lyrics.cache(song, lines)
            assertEquals(lines, Lyrics(context).load(42, "kw"))
            val imported = File(directory, "import.lrc").apply { writeText("[00:01.00]manual") }
            lyrics.import(42, "kw", Uri.fromFile(imported))
            assertEquals("manual", lyrics.load(42, "kw").single().text)
            lyrics.clearOnlineCache(song)
            assertEquals("manual", lyrics.load(42, "kw").single().text)
        } finally { directory.deleteRecursively() }
    }
}
