package cn.toside.music.nativeapp.lyrics

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

class QrcCipherTest {
    @Test fun matchesOriginalNonstandardQrcBlock() {
        val input = byteArrayOf(0, 1, 2, 3, 4, 5, 6, 7)
        val encrypted = QrcCipher.crypt(input, encrypt = true)
        assertEquals("ce92cac4ea3c8406", encrypted.joinToString("") { "%02x".format(it.toInt() and 255) })
        assertArrayEquals(input, QrcCipher.crypt(encrypted, encrypt = false))
        val multi = "ff00112233445566abcdef789abcdef0".chunked(2).map { it.toInt(16).toByte() }.toByteArray()
        val result = QrcCipher.crypt(multi, encrypt = true)
        assertEquals("ba293aa46c6896b10dc0f0bca212f9ff", result.joinToString("") { "%02x".format(it.toInt() and 255) })
        assertArrayEquals(multi, QrcCipher.crypt(result, encrypt = false))
    }
}
