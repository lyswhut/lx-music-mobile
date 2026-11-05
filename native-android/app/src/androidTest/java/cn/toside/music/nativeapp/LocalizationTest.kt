package cn.toside.music.nativeapp

import android.content.res.Configuration
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale

@RunWith(AndroidJUnit4::class)
class LocalizationTest {
    @Test fun everyUiResourceHasUsableEnglishAndTraditionalTextAndMatchingFormatArguments() {
        val base = InstrumentationRegistry.getInstrumentation().targetContext
        fun context(language: String) = base.createConfigurationContext(Configuration(base.resources.configuration).apply { setLocale(Locale.forLanguageTag(language)) })
        val simplified = context("zh-CN"); val english = context("en"); val traditional = context("zh-TW")
        val fields = R.string::class.java.declaredFields.filter { field -> listOf("ui_", "theme_", "playback_", "metadata_", "update_", "song_").any(field.name::startsWith) }
        assertTrue(fields.size >= 500)
        val arguments = Regex("%(\\d+)\\\$([sd])")
        fields.forEach { field ->
            val id = field.getInt(null); val original = simplified.getString(id); val translated = english.getString(id)
            assertTrue("English ${field.name}", translated.isNotBlank())
            assertTrue("Traditional ${field.name}", traditional.getString(id).isNotBlank())
            if (translated !in setOf("简体中文", "繁體中文")) assertFalse("untranslated English ${field.name}: $translated", translated.any { it in '\u3400'..'\u9fff' })
            assertEquals(field.name, arguments.findAll(original).map { it.groupValues[1] }.toSet(), arguments.findAll(translated).map { it.groupValues[1] }.toSet())
            val count = arguments.findAll(original).maxOfOrNull { it.groupValues[1].toInt() } ?: 0
            if (count > 0) listOf(simplified, english, traditional).forEach {
                assertFalse(it.getString(id, *Array<Any>(count) { index -> if (arguments.findAll(original).any { match -> match.groupValues[1].toInt() == index + 1 && match.groupValues[2] == "d" }) index else "argument$index" }).contains(Regex("%\\d+\\\$[sd]")))
            }
        }
        assertEquals("App volume: 40%", english.getString(R.string.ui_f3978b48d365, "40"))
        assertEquals("應用內音量：40%", traditional.getString(R.string.ui_f3978b48d365, "40"))
        assertEquals("Playback and lyrics settings", english.getString(R.string.ui_8c38525734c0))
        assertEquals("Syncing playlists in the background", english.getString(R.string.sync_active, "playlists"))
    }
}
