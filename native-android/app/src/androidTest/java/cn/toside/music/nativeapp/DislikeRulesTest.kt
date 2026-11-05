package cn.toside.music.nativeapp

import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DislikeRulesTest {
    private fun song(name: String, artist: String) = Song(name.hashCode().toLong(), Uri.EMPTY, name, artist, 1000)
    @Test fun parsesAndMatchesOriginalRuleForms() {
        val rules = DislikeRules.parse("  SONG  \n@Artist\n Title @ Singer \nSONG\n")
        assertEquals("song\n@artist\ntitle@singer", rules.text)
        assertTrue(rules.matches(song("Song", "Another")))
        assertTrue(rules.matches(song("Another", "ARTIST")))
        assertTrue(rules.matches(song("TITLE", "Singer")))
        assertFalse(rules.matches(song("Title", "Other")))
        assertTrue(DislikeRules.parse("a#b@artist").matches(song("a@b", "Artist")))
    }
    @Test fun navigationSkipsBlockedSongsWithoutBreakingOrderOrRepeat() {
        val songs = listOf(song("A", "X"), song("B", "X"), song("C", "X"))
        val rules = DislikeRules.parse("b")
        assertEquals(2, nextAllowedSongIndex(PlayMode.LIST_LOOP, 0, songs, true, rules::matches) { 0 })
        assertEquals(0, previousAllowedSongIndex(2, songs, rules::matches))
        assertNull(nextAllowedSongIndex(PlayMode.ORDER, 2, songs, true, rules::matches) { 0 })
        assertEquals(2, nextAllowedSongIndex(PlayMode.SINGLE, 2, songs, true, rules::matches) { 0 })
        assertEquals(2, nextAllowedSongIndex(PlayMode.SINGLE, 1, songs, true, rules::matches) { 0 })
        assertEquals(2, nextAllowedSongIndex(PlayMode.SHUFFLE, 0, songs, true, rules::matches) { 0 })
        assertNull(nextAllowedSongIndex(PlayMode.LIST_LOOP, 0, songs, true, { true }) { 0 })
    }
}
