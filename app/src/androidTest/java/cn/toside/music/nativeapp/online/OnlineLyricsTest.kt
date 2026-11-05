package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.lyrics.LrcParser
import cn.toside.music.nativeapp.lyrics.QrcCipher

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.io.ByteArrayOutputStream
import java.util.zip.DeflaterOutputStream

@RunWith(AndroidJUnit4::class)
class OnlineLyricsTest {
    @Test fun parsesKrcWordTimingAndHtmlEntities() {
        val krc = "[id:test]\n[1200,900]<0,200,0>Hello &amp; <200,700,0>world\n[2500,400]<0,400,0>next"
        val compressed = ByteArrayOutputStream().also { stream -> DeflaterOutputStream(stream).use { it.write(krc.toByteArray()) } }.toByteArray()
        val key = byteArrayOf(0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce.toByte(), 0xd2.toByte(), 0x6e, 0x69)
        compressed.indices.forEach { compressed[it] = (compressed[it].toInt() xor key[it % key.size].toInt()).toByte() }
        val lines = OnlineLyrics().parseKrc("krc1".toByteArray() + compressed)
        assertEquals(listOf(1200L, 2500L), lines.map { it.timeMs })
        assertEquals(listOf("Hello & world", "next"), lines.map { it.text })
    }
    @Test fun decodesKuwoCompressedPlainLrc() {
        val lrc = "[00:01.25]歌词\n[00:02.00]下一句"
        val compressed = ByteArrayOutputStream().also { stream -> DeflaterOutputStream(stream).use { it.write(lrc.toByteArray()) } }.toByteArray()
        val raw = "tp=content\r\nlength=1\r\n\r\n".toByteArray() + compressed
        assertEquals(lrc, OnlineLyrics().decodeKuwo(raw))
        assertEquals(listOf("歌词", "下一句"), LrcParser.parse(OnlineLyrics().decodeKuwo(raw)).map { it.text })
    }
    @Test fun decodesKuwoEncryptedWordTimedLrc() {
        val lrc = "[00:01.25]<0,300>歌词"
        val bytes = lrc.toByteArray()
        val key = "yeelion".toByteArray()
        bytes.indices.forEach { bytes[it] = (bytes[it].toInt() xor key[it % key.size].toInt()).toByte() }
        val encoded = android.util.Base64.encode(bytes, android.util.Base64.NO_WRAP)
        val compressed = ByteArrayOutputStream().also { stream -> DeflaterOutputStream(stream).use { it.write(encoded) } }.toByteArray()
        val raw = "tp=content\r\n\r\n".toByteArray() + compressed
        assertEquals("歌词", LrcParser.parse(OnlineLyrics().decodeKuwo(raw)).single().text)
    }
    @Test fun decryptsQqQrcAndConvertsWordTiming() {
        val xml = "<LyricContent LyricContent=\"[1200,900]Hello(1200,300) world(1500,600)\n[2500,300]Next(2500,300)\"/>"
        val compressed = ByteArrayOutputStream().also { stream -> DeflaterOutputStream(stream).use { it.write(xml.toByteArray()) } }.toByteArray()
        val padded = compressed.copyOf((compressed.size + 7) / 8 * 8)
        val hex = QrcCipher.crypt(padded, encrypt = true).joinToString("") { "%02X".format(it.toInt() and 255) }
        val lines = OnlineLyrics().parseQrc(OnlineLyrics().decodeQrc(hex))
        assertEquals(listOf(1200L, 2500L), lines.map { it.timeMs })
        assertEquals(listOf("Hello world", "Next"), lines.map { it.text })
    }
}
