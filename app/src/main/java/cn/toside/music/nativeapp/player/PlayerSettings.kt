package cn.toside.music.nativeapp.player

import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.utils.ChineseText

import android.content.Context

internal enum class LyricAlignment(val label: String) {
    LEFT("左对齐"), CENTER("居中"), RIGHT("右对齐");
}
internal data class LyricAppearance(val fontSizeSp: Int, val alignment: LyricAlignment)

/** Uses the existing native player preferences without replacing quality or playback mode. */
internal class PlayerSettings(private val context: Context, name: String = "player") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    val playbackRate: Float get() = number(RATE, 1f).takeIf { it.isFinite() && it in MIN_RATE..MAX_RATE } ?: 1f
    val volume: Float get() = number(VOLUME, 1f).takeIf { it.isFinite() && it in 0f..1f } ?: 1f
    var showTranslation: Boolean
        get() = preferences.getBoolean("lyric-translation", false)
        set(value) { preferences.edit().putBoolean("lyric-translation", value).apply() }
    var showRomanization: Boolean
        get() = preferences.getBoolean("lyric-romanization", false)
        set(value) { preferences.edit().putBoolean("lyric-romanization", value).apply() }
    var wordHighlight: Boolean
        get() = preferences.getBoolean("lyric-word-highlight", true)
        set(value) { preferences.edit().putBoolean("lyric-word-highlight", value).apply() }
    var traditionalLyrics: Boolean
        get() = preferences.getBoolean("lyric-traditional", false)
        set(value) { preferences.edit().putBoolean("lyric-traditional", value).apply() }
    fun lyricText(value: String): String = if (traditionalLyrics) ChineseText.traditional(context, value) else value
    fun setPlaybackRate(value: Float) {
        require(value.isFinite() && value in MIN_RATE..MAX_RATE) { "播放倍速应在 0.60 到 2.00 之间" }
        preferences.edit().putFloat(RATE, value).apply()
    }
    fun setVolume(value: Float) {
        require(value.isFinite() && value in 0f..1f) { "音量应在 0% 到 100% 之间" }
        preferences.edit().putFloat(VOLUME, value).apply()
    }
    fun appearance(landscape: Boolean): LyricAppearance {
        val font = number(fontKey(landscape), if (landscape) 22f else 21f)
            .takeIf { it.isFinite() && it in 10f..30f }?.toInt() ?: if (landscape) 22 else 21
        val savedAlignment = preferences.all[ALIGN] as? String
        val alignment = LyricAlignment.entries.firstOrNull { it.name == savedAlignment } ?: LyricAlignment.LEFT
        return LyricAppearance(font, alignment)
    }
    fun setFontSize(value: Int, landscape: Boolean) {
        require(value in 10..30)
        preferences.edit().putInt(fontKey(landscape), value).apply()
    }
    fun setAlignment(value: LyricAlignment) { preferences.edit().putString(ALIGN, value.name).apply() }
    private fun number(key: String, fallback: Float): Float = (preferences.all[key] as? Number)?.toFloat() ?: fallback
    private fun fontKey(landscape: Boolean) = if (landscape) FONT_HORIZONTAL else FONT_VERTICAL
    companion object {
        const val MIN_RATE = 0.6f
        const val MAX_RATE = 2f
        private const val RATE = "playback-rate"
        private const val VOLUME = "volume"
        private const val FONT_VERTICAL = "lyric-font-vertical"
        private const val FONT_HORIZONTAL = "lyric-font-horizontal"
        private const val ALIGN = "lyric-align"
    }
}

internal class LyricOffsets(context: Context, name: String = "lyric-offsets") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    fun get(song: Song): Int = (preferences.all[key(song)] as? Number)?.toLong()?.coerceIn(-MAX_DELAY.toLong(), MAX_DELAY.toLong())?.toInt() ?: 0
    fun set(song: Song, delayMs: Int) {
        require(delayMs in -MAX_DELAY..MAX_DELAY)
        val editor = preferences.edit()
        if (delayMs == 0) editor.remove(key(song)) else editor.putInt(key(song), delayMs)
        editor.apply()
    }
    private fun key(song: Song) = "${song.source}:${song.id}"
    companion object { const val MAX_DELAY = 60_000 }
}

/** Positive calibration delays the displayed line and its click-to-seek target by the same amount. */
internal object LyricTiming {
    fun lyricPosition(playbackPositionMs: Long, delayMs: Int): Long = playbackPositionMs - delayMs
    fun seekPosition(lineTimeMs: Long, delayMs: Int, durationMs: Int): Int =
        (lineTimeMs + delayMs).coerceIn(0, durationMs.coerceAtLeast(0).toLong()).toInt()
}
