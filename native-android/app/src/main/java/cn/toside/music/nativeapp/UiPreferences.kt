package cn.toside.music.nativeapp

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

internal object UiPreferences {
    fun context(base: Context, scaleFonts: Boolean = true): Context {
        val scale = AppPreferences(base).string("common.fontScale", "1.0").toFloatOrNull()?.coerceIn(0.8f, 1.6f) ?: 1f
        // Multiply, rather than replace, the user's accessibility font preference.
        return base.createConfigurationContext(Configuration(base.resources.configuration).apply {
            if (scaleFonts) fontScale *= scale
            val language = AppPreferences(base).string("common.langId", "")
            if (language in setOf("zh-CN", "zh-TW", "en")) setLocale(Locale.forLanguageTag(language))
        })
    }
    fun sourceName(context: Context, source: String): String = if (AppPreferences(context).string("common.sourceNameType", "alias") == "alias") {
        context.getString(when (source) { "kw" -> R.string.ui_5b9757b493aa; "kg" -> R.string.ui_883798ba73cb; "tx" -> R.string.ui_0bef848c17a7; "wy" -> R.string.ui_6e2dc7dc5b3c; "mg" -> R.string.ui_7f11bc755c6f; else -> R.string.ui_bf4ad761840f })
    } else context.getString(when (source) { "kw" -> R.string.ui_7920e0816ab9; "kg" -> R.string.ui_7d0e8317588d; "tx" -> R.string.ui_3ef42060a2e5; "wy" -> R.string.ui_f2a5bbaf0de8; "mg" -> R.string.ui_3b6993b997df; else -> R.string.ui_bf4ad761840f })
}
