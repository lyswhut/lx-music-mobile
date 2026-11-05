package cn.toside.music.nativeapp.sync

import android.content.Context

/** Only the address and user's connection intent are stored here; credentials remain encrypted separately. */
internal class BackgroundSyncSettings(context: Context, name: String = "background-sync") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    val address: String get() = preferences.getString("address", "") ?: ""
    val enabled: Boolean get() = preferences.getBoolean("enabled", false)
    val message: String get() = preferences.getString("message", "") ?: ""
    fun enable(address: String) {
        check(preferences.edit().putString("address", address).putBoolean("enabled", true).putString("message", "").commit()) { "无法保存后台同步设置" }
    }
    fun finish(message: String, disable: Boolean) {
        val editor = preferences.edit().putString("message", message)
        if (disable) editor.putBoolean("enabled", false)
        check(editor.commit()) { "无法保存后台同步状态" }
    }
}
