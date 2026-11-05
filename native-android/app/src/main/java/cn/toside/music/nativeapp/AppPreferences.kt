package cn.toside.music.nativeapp

import android.content.Context

internal class AppPreferences(context: Context, name: String = "app-settings") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    fun bool(key: String, fallback: Boolean = false): Boolean = preferences.all[key] as? Boolean ?: fallback
    fun set(key: String, value: Boolean) { preferences.edit().putBoolean(key, value).apply() }
    fun string(key: String, fallback: String): String = preferences.all[key] as? String ?: fallback
    fun set(key: String, value: String) { preferences.edit().putString(key, value).apply() }
    val showSource get() = bool("list.isShowSource", true)
    val showAlbum get() = bool("list.isShowAlbumName")
    val showDuration get() = bool("list.isShowInterval", true)
    val saveScroll get() = bool("list.isSaveScrollLocation", true)
    val clickPlaylistPlay get() = bool("list.isClickPlayList")
    val addAtTop get() = string("list.addMusicLocationType", "bottom") == "top"
    val allowSeek get() = bool("common.allowProgressBarSeek", true)
    val autoHidePlayer get() = bool("common.autoHidePlayBar")
    val handleAudioFocus get() = bool("player.isHandleAudioFocus", true)
    val notificationImage get() = bool("player.isShowNotificationImage", true)
    val bluetoothLyric get() = bool("player.isShowBluetoothLyric")
    val bluetoothFullLyric get() = bool("player.isShowBluetoothFullLyric")
    val savePlayTime get() = bool("player.isSavePlayTime", true)
    val startupAutoPlay get() = bool("player.startupAutoPlay")
    val startupPlayer get() = bool("player.startupPushPlayDetailScreen")
    val searchHistory get() = bool("search.isShowHistorySearch", true)
    val hotSearch get() = bool("search.isShowHotSearch")
    val recordHistory get() = bool("player.recordHistory", true)
    val autoCleanQueue get() = bool("player.isAutoCleanPlayedList")
    val audioOffload get() = bool("player.isEnableAudioOffload")
    val audioCacheBytes get() = string("player.cacheSize", "1024").toLongOrNull()?.coerceIn(0, 8192)?.times(1024 * 1024) ?: (1024L * 1024 * 1024)
    val downloadPattern get() = string("download.fileName", "歌名 - 歌手")
    val theme get() = string("theme.mode", "light")
    val accent get() = string("theme.accent", "green")
    val menuOnRight get() = string("common.drawerLayoutPosition", "left") == "right"
    val showBack get() = bool("common.showBackBtn")
    val showExit get() = bool("common.showExitBtn", true)
}
