package cn.toside.music.nativeapp

import org.junit.Assert.*
import org.junit.Test

class LyricFormatsTest {
    @Test fun enhancedLrcPreservesWordsOffsetsAndRepeatedTimestamps() {
        val lines = LrcParser.parse("[offset:100]\n[00:01.00][00:03.00]<0,500>Hello <500,500>world")
        assertEquals(listOf("Hello world", "Hello world"), lines.map { it.text })
        assertEquals(listOf(1100L, 3100L), lines.map { it.timeMs })
        assertEquals(listOf(1100L, 1600L), lines.first().words.map { it.startMs })
        assertEquals(0, LyricFormats.highlightedCharacters(lines[0], 1099))
        assertEquals(3, LyricFormats.highlightedCharacters(lines[0], 1350))
        assertEquals(11, LyricFormats.highlightedCharacters(lines[0], 2100))
    }
    @Test fun providerPrefixAndSuffixTimingGiveEquivalentWordBoundaries() {
        val before = LyricFormats.timedSentences("[1000,1000](1000,500,0)Hello (1500,500,0)world", true)
        val after = LyricFormats.timedSentences("[1000,1000]Hello (1000,500)world(1500,500)", false)
        assertEquals(before, after)
        assertEquals("Hello world", before.single().text)
        assertEquals(6, before.single().words[1].start)
    }
    @Test fun progressDoesNotSplitSurrogatePairsOrFillGapsPrematurely() {
        val line = LrcParser.parse("[00:00.00]<0,1000>😀<2000,1000>ab").single()
        assertEquals(0, LyricFormats.highlightedCharacters(line, 500))
        assertEquals(2, LyricFormats.highlightedCharacters(line, 1500))
        assertEquals(3, LyricFormats.highlightedCharacters(line, 2500))
    }
    @Test fun extraLyricsAlignWithinProviderPrecisionWithoutAttachingUnrelatedLines() {
        val main = LrcParser.parse("[00:01.00]hello\n[00:02.00]world")
        val result = LyricFormats.merge(main, LrcParser.parse("[00:01.05]你好\n[00:09.00]unmatched"),
            LrcParser.parse("[00:02.01]sekai"))
        assertEquals("你好", result[0].translation)
        assertEquals("", result[1].translation)
        assertEquals("sekai", result[1].romanization)
    }
}
