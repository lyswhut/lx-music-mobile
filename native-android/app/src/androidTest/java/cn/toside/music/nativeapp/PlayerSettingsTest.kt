package cn.toside.music.nativeapp

import android.content.Context
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PlayerSettingsTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun persistsSettingsWithoutReplacingQualityModeOrTheOtherOrientation() {
        val name = "player-settings-${System.nanoTime()}"
        val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
        try {
            preferences.edit().putString("quality", "flac").putString("mode", "SHUFFLE").commit()
            val settings = PlayerSettings(context, name)
            assertEquals(1f, settings.playbackRate)
            assertEquals(1f, settings.volume)
            settings.setPlaybackRate(1.25f); settings.setVolume(0.37f)
            settings.setFontSize(26, false); settings.setAlignment(LyricAlignment.RIGHT)
            val restored = PlayerSettings(context, name)
            assertEquals(1.25f, restored.playbackRate)
            assertEquals(0.37f, restored.volume)
            assertEquals(LyricAppearance(26, LyricAlignment.RIGHT), restored.appearance(false))
            assertEquals(LyricAppearance(22, LyricAlignment.RIGHT), restored.appearance(true))
            assertEquals("flac", preferences.getString("quality", null))
            assertEquals("SHUFFLE", preferences.getString("mode", null))
        } finally { context.deleteSharedPreferences(name) }
    }
    @Test fun invalidStoredValuesFallBackAndInvalidUpdatesDoNotReplaceWorkingSettings() {
        val name = "player-settings-invalid-${System.nanoTime()}"
        try {
            val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
            preferences.edit().putFloat("playback-rate", Float.NaN).putFloat("volume", -1f)
                .putInt("lyric-font-vertical", 500).putInt("lyric-align", 123).commit()
            val settings = PlayerSettings(context, name)
            assertEquals(1f, settings.playbackRate); assertEquals(1f, settings.volume)
            assertEquals(LyricAppearance(21, LyricAlignment.LEFT), settings.appearance(false))
            settings.setPlaybackRate(1.5f); settings.setVolume(0.4f)
            for (bad in listOf(Float.NaN, Float.POSITIVE_INFINITY, 0f, 2.1f)) {
                try { settings.setPlaybackRate(bad); fail("invalid rate must fail") } catch (_: IllegalArgumentException) { }
            }
            try { settings.setVolume(1.1f); fail("invalid volume must fail") } catch (_: IllegalArgumentException) { }
            assertEquals(1.5f, settings.playbackRate); assertEquals(0.4f, settings.volume)
        } finally { context.deleteSharedPreferences(name) }
    }
    @Test fun offsetsAreIsolatedBySongAndSourceAndResetOnlyTheSelectedSong() {
        val name = "lyric-offsets-${System.nanoTime()}"
        try {
            val local = Song(42, Uri.EMPTY, "Local", "Artist", 5000)
            val online = local.copy(source = "kw")
            val other = local.copy(id = 43)
            val offsets = LyricOffsets(context, name)
            offsets.set(local, 500); offsets.set(online, -1000); offsets.set(other, 2000)
            val restored = LyricOffsets(context, name)
            assertEquals(500, restored.get(local)); assertEquals(-1000, restored.get(online))
            restored.set(local, 0)
            assertEquals(0, offsets.get(local)); assertEquals(-1000, offsets.get(online)); assertEquals(2000, offsets.get(other))
            try { offsets.set(local, 60_001); fail("out-of-range offset must fail") } catch (_: IllegalArgumentException) { }
        } finally { context.deleteSharedPreferences(name) }
    }
}
