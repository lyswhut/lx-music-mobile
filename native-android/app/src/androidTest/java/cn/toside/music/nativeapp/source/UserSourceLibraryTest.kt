package cn.toside.music.nativeapp.source

import android.content.ContextWrapper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class UserSourceLibraryTest {
    private suspend fun isolated(test: suspend (android.content.Context, UserSource) -> Unit) {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(target.cacheDir, "source-library-${System.nanoTime()}").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = directory }
        val source = UserSource(context)
        try { test(context, source) } finally { source.close(); directory.deleteRecursively() }
    }
    private fun script(name: String) = """
        /**
         * @name $name
         * @version 1.2.3
         * @author test
         */
        lx.on(lx.EVENT_NAMES.request, async () => {
            if (lx.currentScriptInfo.name !== '$name' || lx.currentScriptInfo.version !== '1.2.3') throw new Error('metadata mismatch');
            return 'https://example.org/$name.mp3';
        });
        lx.send(lx.EVENT_NAMES.inited, {sources:{kw:{type:'music',actions:['musicUrl'],qualitys:['128k']}}});
    """.trimIndent()
    @Test fun switchingDisablingAndDeletingPreserveTheOtherValidatedScripts() = runBlocking {
        isolated { _, source ->
            source.import(script("first")); val first = source.catalog().selected!!
            source.import(script("second")); val second = source.catalog().selected!!
            assertEquals(2, source.catalog().entries.size)
            source.select(first)
            assertEquals("https://example.org/first.mp3", source.musicUrl("kw", JSONObject()))
            try { source.import("throw Error('bad source')"); fail("invalid source must fail") } catch (_: Exception) { }
            assertEquals(first, source.catalog().selected)
            assertEquals("https://example.org/first.mp3", source.musicUrl("kw", JSONObject()))
            source.select(null)
            assertFalse(source.loadSaved())
            try { source.musicUrl("kw", JSONObject()); fail("disabled source must fail") } catch (_: IllegalStateException) { }
            source.remove(first)
            assertEquals(listOf(second), source.catalog().entries.map { it.id })
            source.select(second)
            assertEquals("https://example.org/second.mp3", source.musicUrl("kw", JSONObject()))
            source.remove(second)
            assertTrue(source.catalog().entries.isEmpty()); assertNull(source.catalog().selected)
        }
    }
    @Test fun legacySingleScriptMigratesWithoutChangingItsContentOrMetadata() = runBlocking {
        isolated { context, source ->
            val raw = script("legacy")
            File(context.filesDir, "user-source.js").writeText(raw)
            assertTrue(source.loadSaved())
            val entry = source.catalog().entries.single()
            assertEquals(raw, entry.script); assertEquals("legacy", entry.name); assertEquals("1.2.3", entry.version)
            assertEquals("https://example.org/legacy.mp3", source.musicUrl("kw", JSONObject()))
        }
    }
    @Test fun localLyricsAndScriptUpdatePreferencesWorkThroughTheExistingScriptProtocol() = runBlocking {
        isolated { _, source ->
            source.import("""
                /**
                 * @name Local lyrics
                 */
                lx.on(lx.EVENT_NAMES.request, async ({action}) => {
                    if(action === 'lyric') return {lyric:'[00:01.00]Hello',tlyric:'[00:01.00]你好',rlyric:'[00:01.00]ni hao'};
                    return 'https://example.org/cover.png';
                });
                lx.send(lx.EVENT_NAMES.inited,{sources:{local:{type:'music',actions:['lyric','pic'],qualitys:[]}}});
                lx.send(lx.EVENT_NAMES.updateAlert,{log:'A new version',updateUrl:'https://example.org/update'});
            """.trimIndent())
            assertTrue(source.supports("local", "lyric")); assertTrue(source.supports("local", "pic"))
            val data = source.sourceRequest("local", "lyric", JSONObject()).getJSONObject("data")
            assertEquals("[00:01.00]你好", data.getString("tlyric"))
            val alert = withTimeout(3000) { source.updates.first { it != null } }!!
            assertEquals("A new version", alert.log)
            source.allowUpdates(alert.id, false)
            assertNull(source.updates.value)
            source.select(alert.id)
            assertNull(withTimeoutOrNull(250) { source.updates.first { it != null } })
        }
    }
}
