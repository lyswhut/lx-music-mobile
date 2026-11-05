package cn.toside.music.nativeapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlayModeTest {
    @Test fun completionAndManualSkipRespectQueueMode() {
        val zero: (Int) -> Int = { 0 }
        assertNull(nextSongIndex(PlayMode.ORDER, 1, 2, true, zero))
        assertEquals(0, nextSongIndex(PlayMode.ORDER, 1, 2, false, zero))
        assertEquals(1, nextSongIndex(PlayMode.SINGLE, 1, 2, true, zero))
        assertEquals(0, nextSongIndex(PlayMode.SINGLE, 1, 2, false, zero))
        assertEquals(1, nextSongIndex(PlayMode.SHUFFLE, 0, 3, true, zero))
        assertEquals(0, nextSongIndex(PlayMode.SHUFFLE, 1, 3, true, zero))
        assertNull(nextSongIndex(PlayMode.LIST_LOOP, -1, 0, true, zero))
    }
}
