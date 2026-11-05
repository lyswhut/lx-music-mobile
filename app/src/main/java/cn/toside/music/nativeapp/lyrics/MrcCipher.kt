package cn.toside.music.nativeapp.lyrics

import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Signed 64-bit TEA variant used by the existing Migu MRC provider. */
internal object MrcCipher {
    private const val DELTA = 2654435769L
    private val key = longArrayOf(27303562373562475, 18014862372307051, 22799692160172081, 34058940340699235)
    fun decrypt(text: String): String {
        if (text.length < 32 || text.length % 16 != 0 || !text.all { it in '0'..'9' || it.lowercaseChar() in 'a'..'f' }) return text
        val data = LongArray(text.length / 16) { text.substring(it * 16, it * 16 + 16).toULong(16).toLong() }
        var y = data[0]
        var sum = (6 + 52 / data.size) * DELTA
        while (sum != 0L) {
            val e = ((sum shr 2) and 3).toInt()
            for (p in data.lastIndex downTo 1) {
                val z = data[p - 1]
                y = data[p] - (((y xor sum) + (z xor key[(p and 3) xor e])) xor
                    (((z shr 5) xor (y shl 2)) + ((y shr 3) xor (z shl 4))))
                data[p] = y
            }
            val z = data.last()
            y = data[0] - (((key[e] xor z) + (y xor sum)) xor (((z shr 5) xor (y shl 2)) + ((y shr 3) xor (z shl 4))))
            data[0] = y; sum -= DELTA
        }
        val bytes = ByteBuffer.allocate(data.size * 8).order(ByteOrder.LITTLE_ENDIAN)
        data.forEach(bytes::putLong)
        return bytes.array().toString(Charsets.UTF_16LE).trimEnd('\u0000')
    }
}
