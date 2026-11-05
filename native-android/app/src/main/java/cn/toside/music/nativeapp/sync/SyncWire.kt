package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.utils.readBounded

import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream
import org.json.JSONObject
import java.security.MessageDigest

/** LX v4 sends JSON directly, or gzip/base64 with a cg_ prefix above 1024 UTF-16 units. */
internal object SyncWire {
    private const val MAX_MESSAGE_BYTES = 16 * 1024 * 1024
    // Android's JSONStringer escapes '/', while JavaScript JSON.stringify does not.
    fun stringifyForHash(value: JSONObject): String = value.toString().replace("\\/", "/")
    fun snapshotHash(value: JSONObject): String = textHash(stringifyForHash(value))
    fun textHash(value: String): String = MessageDigest.getInstance("MD5")
        .digest(value.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it.toInt() and 255) }
    fun encode(message: String): String {
        val data = message.toByteArray(Charsets.UTF_8)
        require(data.size <= MAX_MESSAGE_BYTES) { "同步消息过大" }
        if (message.length <= 1024) return message
        val output = ByteArrayOutputStream()
        GZIPOutputStream(output).use { it.write(data) }
        return "cg_" + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    }
    fun decode(message: String): String {
        require(message.length <= MAX_MESSAGE_BYTES * 2) { "同步消息过大" }
        val bytes = if (message.startsWith("cg_")) {
            val compressed = Base64.decode(message.substring(3), Base64.DEFAULT)
            GZIPInputStream(ByteArrayInputStream(compressed)).use { it.readBounded(MAX_MESSAGE_BYTES) }
        } else message.toByteArray(Charsets.UTF_8)
        require(bytes.size <= MAX_MESSAGE_BYTES) { "同步消息过大" }
        return bytes.toString(Charsets.UTF_8)
    }
}
