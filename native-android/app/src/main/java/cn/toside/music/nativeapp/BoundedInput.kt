package cn.toside.music.nativeapp

import java.io.ByteArrayOutputStream
import java.io.InputStream

fun InputStream.readBounded(maxBytes: Int): ByteArray {
    val output = ByteArrayOutputStream()
    val buffer = ByteArray(8192)
    while (true) {
        val count = read(buffer)
        if (count < 0) return output.toByteArray()
        require(count <= maxBytes - output.size()) { "文件或响应内容过大" }
        output.write(buffer, 0, count)
    }
}
