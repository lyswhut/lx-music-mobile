package cn.toside.music.nativeapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LrcParserTest {
    @Test fun parsesRepeatedTimestampsOffsetsAndFractionPrecision() {
        val lines = LrcParser.parse("""
            [ar:artist]
            [offset:-200]
            [00:02.5][00:01.25]hello
            [00:04.123]world
            [00:80.00]invalid
        """.trimIndent())
        assertEquals(listOf(1050L, 2300L, 3923L), lines.map { it.timeMs })
        assertEquals(listOf("hello", "hello", "world"), lines.map { it.text })
        assertNull(LrcParser.lineAt(lines, 1049))
        assertEquals("hello", LrcParser.lineAt(lines, 1050))
        assertEquals("world", LrcParser.lineAt(lines, 5000))
    }
    @Test fun emptyAndUnrecognisedInputReturnsNoLines() {
        assertEquals(emptyList<LyricLine>(), LrcParser.parse("[ti:title]\nplain text"))
        assertNull(LrcParser.lineAt(emptyList(), 0))
    }
}
