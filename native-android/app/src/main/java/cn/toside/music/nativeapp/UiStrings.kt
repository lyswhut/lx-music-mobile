package cn.toside.music.nativeapp

import android.content.Context

internal fun PlayMode.localized(context: Context): String = context.getString(when (this) {
    PlayMode.LIST_LOOP -> R.string.ui_2fe0943eacb3; PlayMode.ORDER -> R.string.ui_5bbcac595bc6
    PlayMode.SINGLE -> R.string.ui_8cde791504d2; PlayMode.SHUFFLE -> R.string.ui_f34b7ce61098
})
internal fun LyricAlignment.localized(context: Context): String = context.getString(when (this) {
    LyricAlignment.LEFT -> R.string.ui_2bd74486069f; LyricAlignment.CENTER -> R.string.ui_4cc3885c182e; LyricAlignment.RIGHT -> R.string.ui_331c711e0660
})
internal fun SyncFeature.localized(context: Context): String = context.getString(if (this == SyncFeature.LIST) R.string.ui_473e57b72072 else R.string.ui_2a3ec620e12c)

/** Translate controller status without changing the stable protocol/error text used by the sync core. */
internal fun Context.syncMessage(message: String): String {
    val localized = UiPreferences.context(this, scaleFonts = false)
    fun featureNames(value: String) = SyncFeature.entries.fold(value) { result, feature -> result.replace(feature.label, feature.localized(localized)) }
    return when {
        message == "正在连接同步服务…" -> localized.getString(R.string.sync_connecting)
        message == "同步已断开" -> localized.getString(R.string.ui_49d0208f4a94)
        message == "同步连接超时，正在重试…" -> localized.getString(R.string.sync_timeout_retry)
        message == "同步连接中断，正在重试…" -> localized.getString(R.string.sync_interrupted_retry)
        message == "同步已取消" -> localized.getString(R.string.sync_cancelled)
        message == "已达到系统后台同步时限，返回应用后继续" -> localized.getString(R.string.sync_time_limit)
        message.startsWith("正在后台同步") -> localized.getString(R.string.sync_active, featureNames(message.removePrefix("正在后台同步")))
        message.startsWith("请返回应用选择") && message.endsWith("同步方式") -> localized.getString(R.string.sync_choose, featureNames(message.removePrefix("请返回应用选择").removeSuffix("同步方式")))
        message.startsWith("同步已停止：") -> localized.getString(R.string.sync_stopped, message.removePrefix("同步已停止："))
        else -> message
    }
}
