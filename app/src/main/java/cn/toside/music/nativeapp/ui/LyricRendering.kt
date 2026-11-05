package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.lyrics.LyricFormats
import cn.toside.music.nativeapp.lyrics.LyricLine
import cn.toside.music.nativeapp.player.PlayerSettings

import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan

internal object LyricRendering {
    fun text(line: LyricLine, settings: PlayerSettings): String = listOf(line.text,
        line.translation.takeIf { settings.showTranslation }.orEmpty(),
        line.romanization.takeIf { settings.showRomanization }.orEmpty()).filter { it.isNotBlank() }.joinToString("\n").let(settings::lyricText)

    fun styled(line: LyricLine, settings: PlayerSettings, active: Boolean, positionMs: Long, unplayed: Int, played: Int): CharSequence {
        val text = text(line, settings)
        if (!active || !settings.wordHighlight || line.words.isEmpty()) return text
        return SpannableString(text).apply {
            if (line.text.isNotEmpty()) {
                setSpan(ForegroundColorSpan(unplayed), 0, line.text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                val end = LyricFormats.highlightedCharacters(line, positionMs)
                if (end > 0) setSpan(ForegroundColorSpan(played), 0, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            if (length > line.text.length) setSpan(RelativeSizeSpan(0.8f), line.text.length, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
    }
}
