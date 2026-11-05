package cn.toside.music.nativeapp

import org.junit.Assert.*
import org.junit.Test

class LyricTimingTest {
    @Test fun calibrationDelaysOrAdvancesTheSameParsedLineIncludingEmbeddedOffsets() {
        val lines = LrcParser.parse("[offset:-200]\n[00:01.00]first\n[00:02.00]second")
        assertEquals("first", LrcParser.lineAt(lines, LyricTiming.lyricPosition(1000, 0)))
        assertNull(LrcParser.lineAt(lines, LyricTiming.lyricPosition(1000, 500)))
        assertEquals("first", LrcParser.lineAt(lines, LyricTiming.lyricPosition(1300, 500)))
        assertEquals("second", LrcParser.lineAt(lines, LyricTiming.lyricPosition(1300, -500)))
        assertEquals(1300, LyricTiming.seekPosition(lines[0].timeMs, 500, 5000))
    }
    @Test fun aDelayedZeroTimestampStaysInactiveUntilItsCalibratedTime() {
        val lines = LrcParser.parse("[00:00.00]start\n[00:01.00]next")
        assertEquals(-1, LrcParser.indexAt(lines, LyricTiming.lyricPosition(0, 500)))
        assertEquals(-1, LrcParser.indexAt(lines, LyricTiming.lyricPosition(499, 500)))
        assertEquals(0, LrcParser.indexAt(lines, LyricTiming.lyricPosition(500, 500)))
        assertEquals(1, LrcParser.indexAt(lines, LyricTiming.lyricPosition(1500, 500)))
    }
    @Test fun seekingClampsToTheTrackAndLookupHandlesDuplicateTimestamps() {
        val lines = LrcParser.parse("[00:01.00]a\n[00:01.00]b\n[00:02.00]c")
        assertEquals(1, LrcParser.indexAt(lines, 1000))
        assertEquals("b", LrcParser.lineAt(lines, 1000))
        assertEquals(0, LyricTiming.seekPosition(1000, -2000, 5000))
        assertEquals(5000, LyricTiming.seekPosition(4000, 2000, 5000))
        assertEquals(0, LyricTiming.seekPosition(4000, 2000, 0))
        assertEquals(-1, LrcParser.indexAt(emptyList(), 1000))
    }
}
