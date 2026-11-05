package cn.toside.music.nativeapp.utils

import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/** Encode script-provided fields and optional Buffer file values as multipart/form-data. */
internal fun multipartForm(fields: JSONObject, boundary: String): ByteArray {
    require(boundary.matches(Regex("[A-Za-z0-9-]{1,70}")))
    val output = ByteArrayOutputStream()
    fun write(value: String) { output.write(value.toByteArray(Charsets.UTF_8)) }
    fun safeName(value: String) = value.replace("\r", "").replace("\n", "").replace("\\", "\\\\").replace("\"", "\\\"")
    fun append(name: String, input: Any?) {
        val part = input as? JSONObject
        val wrapped = part != null && part.has("value")
        val value = if (wrapped) part!!.opt("value") else input
        val options = if (wrapped) part!!.optJSONObject("options") else null
        val filename = options?.optString("filename")?.takeIf { it.isNotBlank() }
        val contentType = options?.optString("contentType")?.takeIf { it.isNotBlank() }
        require(contentType == null || ('\r' !in contentType && '\n' !in contentType)) { "无效的表单内容类型" }
        write("--$boundary\r\nContent-Disposition: form-data; name=\"${safeName(name)}\"")
        if (filename != null) write("; filename=\"${safeName(filename)}\"")
        write("\r\n")
        if (contentType != null) write("Content-Type: $contentType\r\n")
        write("\r\n")
        if (value is JSONObject && value.optString("type") == "Buffer") {
            val data = value.optJSONArray("data") ?: JSONArray()
            for (i in 0 until data.length()) output.write(data.optInt(i) and 255)
        } else if (value != null && value != JSONObject.NULL) write(value.toString())
        write("\r\n")
    }
    fields.keys().forEach { key ->
        val value = fields.opt(key)
        if (value is JSONArray) for (i in 0 until value.length()) append(key, value.opt(i)) else append(key, value)
    }
    write("--$boundary--\r\n")
    return output.toByteArray()
}
