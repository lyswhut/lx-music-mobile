package cn.toside.music.nativeapp.utils

import android.content.Context
import org.json.JSONObject

/** Original simplify-chinese 1.1.0 character map; preserves UTF-16 word offsets. */
internal object ChineseText {
    @Volatile private var mappings: Map<Char, Char>? = null
    fun traditional(context: Context, text: String): String {
        val map = mappings ?: synchronized(this) {
            mappings ?: context.assets.open("i18n/s2t.json").use { stream ->
                val json = JSONObject(stream.readBytes().toString(Charsets.UTF_8).removePrefix("\uFEFF"))
                json.keys().asSequence().mapNotNull { key ->
                    val value = json.getString(key)
                    if (key.length == 1 && value.length == 1) key[0] to value[0] else null
                }.toMap().also { mappings = it }
            }
        }
        return buildString(text.length) { text.forEach { append(map[it] ?: it) } }
    }
}
