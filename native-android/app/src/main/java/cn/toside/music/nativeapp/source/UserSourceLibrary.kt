package cn.toside.music.nativeapp.source

import cn.toside.music.nativeapp.utils.readBounded

import android.content.Context
import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

data class UserSourceEntry(val id: String, val name: String, val description: String, val version: String,
    val author: String, val homepage: String, val script: String, val allowUpdateAlert: Boolean = true)
internal data class UserSourceCatalog(val selected: String?, val entries: List<UserSourceEntry>)

/** The selected ID and scripts are written atomically; importing one script never discards the others. */
internal class UserSourceLibrary(private val context: Context) {
    private val target = AtomicFile(File(context.filesDir, "user-sources.json"))
    fun read(): UserSourceCatalog {
        if (!target.baseFile.isFile) {
            val legacy = File(context.filesDir, "user-source.js")
            if (!legacy.isFile) return UserSourceCatalog(null, emptyList())
            val entry = metadata(legacy.inputStream().use { it.readBounded(2 * 1024 * 1024) }.toString(Charsets.UTF_8))
            return UserSourceCatalog(entry.id, listOf(entry)).also(::write)
        }
        val data = target.openRead().use { JSONObject(it.readBounded(32 * 1024 * 1024).toString(Charsets.UTF_8)) }
        val values = data.getJSONArray("sources")
        val entries = (0 until values.length()).map { index ->
            val entry = values.getJSONObject(index)
            metadata(entry.getString("script")).copy(allowUpdateAlert = entry.optBoolean("allowUpdateAlert", true))
        }.distinctBy { it.id }
        return UserSourceCatalog(data.optString("selected").takeIf { id -> entries.any { it.id == id } }, entries)
    }
    fun selected(): UserSourceEntry? = read().let { data -> data.entries.firstOrNull { it.id == data.selected } }
    fun addValidated(script: String): UserSourceEntry {
        val entry = metadata(script); val current = read()
        write(UserSourceCatalog(entry.id, current.entries.filterNot { it.id == entry.id } + entry))
        return entry
    }
    fun select(id: String?) {
        val current = read()
        require(id == null || current.entries.any { it.id == id }) { "音源不存在" }
        write(current.copy(selected = id))
    }
    fun remove(id: String) {
        val current = read()
        write(UserSourceCatalog(current.selected.takeUnless { it == id }, current.entries.filterNot { it.id == id }))
    }
    fun allowUpdates(id: String, enabled: Boolean) {
        val current = read()
        write(current.copy(entries = current.entries.map { if (it.id == id) it.copy(allowUpdateAlert = enabled) else it }))
    }
    private fun write(data: UserSourceCatalog) {
        val raw = JSONObject().put("version", 1).put("selected", data.selected ?: JSONObject.NULL)
            .put("sources", JSONArray().apply { data.entries.forEach { put(JSONObject().put("script", it.script).put("allowUpdateAlert", it.allowUpdateAlert)) } })
            .toString().toByteArray(Charsets.UTF_8)
        require(raw.size <= 32 * 1024 * 1024) { "音源库超过 32 MB" }
        context.filesDir.mkdirs()
        val stream = target.startWrite()
        try { stream.write(raw); target.finishWrite(stream) } catch (e: Exception) { target.failWrite(stream); throw e }
    }
    companion object {
        fun metadata(script: String): UserSourceEntry {
            require(script.toByteArray(Charsets.UTF_8).size <= 2 * 1024 * 1024) { "音源文件超过 2 MB" }
            val head = script.take(8192).substringBefore("*/")
            fun field(name: String, max: Int) = Regex("(?m)^\\s*\\*?\\s*@${name}\\s+([^\\r\\n]+)").find(head)?.groupValues?.get(1)?.trim()?.take(max).orEmpty()
            val id = MessageDigest.getInstance("SHA-256").digest(script.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it.toInt() and 255) }
            return UserSourceEntry(id, field("name", 100).ifBlank { "自定义音源" }, field("description", 1024),
                field("version", 100), field("author", 128), field("homepage", 2048), script)
        }
    }
}
