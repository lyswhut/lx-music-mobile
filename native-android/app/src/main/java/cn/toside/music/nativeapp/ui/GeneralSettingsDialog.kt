package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.data.CacheMaintenance
import cn.toside.music.nativeapp.data.PlaylistCredentials
import cn.toside.music.nativeapp.player.PlaybackService

import android.app.Activity
import android.app.AlertDialog
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal fun showGeneralSettings(activity: Activity, scope: CoroutineScope, player: PlaybackService? = null, refresh: () -> Unit) {
    val preferences = AppPreferences(activity)
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
    fun title(text: String) { content.addView(TextView(activity).apply { this.text = text; textSize = 18f; setPadding(0, 24, 0, 12) }) }
    fun toggle(text: String, key: String, fallback: Boolean = false) {
        content.addView(CheckBox(activity).apply {
            this.text = text; contentDescription = text; isChecked = preferences.bool(key, fallback)
            setOnCheckedChangeListener { _, value -> preferences.set(key, value); refresh() }
        })
    }
    title(activity.getString(R.string.ui_c3396195e91c))
    toggle(activity.getString(R.string.ui_8a47499c40e0), "player.startupAutoPlay")
    toggle(activity.getString(R.string.ui_d6320dc2f6f6), "player.startupPushPlayDetailScreen")
    toggle(activity.getString(R.string.ui_5da5740ba417), "player.isSavePlayTime", true)
    toggle(activity.getString(R.string.ui_4a79cf8d0791), "player.recordHistory", true)
    toggle(activity.getString(R.string.ui_1a232faf3bfe), "player.autoSwitchSource", true)
    toggle(activity.getString(R.string.ui_4affe217c432), "player.isAutoCleanPlayedList")
    toggle(activity.getString(R.string.ui_2f9d06b47ed2), "player.isHandleAudioFocus", true)
    toggle(activity.getString(R.string.ui_ff6ed64098b9), "player.isEnableAudioOffload")
    toggle(activity.getString(R.string.ui_46749ca81e12), "player.isShowNotificationImage", true)
    toggle(activity.getString(R.string.ui_d5b0714beafd), "player.isShowBluetoothLyric")
    toggle(activity.getString(R.string.ui_7a36a9f3c4ab), "player.isShowBluetoothFullLyric")
    title(activity.getString(R.string.ui_6e34875b6fe3))
    toggle(activity.getString(R.string.ui_0aec06d42251), "list.isClickPlayList")
    toggle(activity.getString(R.string.ui_c41fc8ebc9bb), "list.isShowSource", true)
    toggle(activity.getString(R.string.ui_1855017a0392), "list.isShowAlbumName")
    toggle(activity.getString(R.string.ui_5b5ca57648a2), "list.isShowInterval", true)
    toggle(activity.getString(R.string.ui_3b432f3fe1df), "list.isSaveScrollLocation", true)
    toggle(activity.getString(R.string.ui_9d379ca17d16), "search.isShowHistorySearch", true)
    toggle(activity.getString(R.string.ui_02eeee3c6016), "search.isShowHotSearch")
    toggle(activity.getString(R.string.ui_e3b61ed71904), "common.allowProgressBarSeek", true)
    toggle(activity.getString(R.string.ui_d7295a6e9a5a), "common.autoHidePlayBar")
    fun choice(text: String, key: String, labels: Array<String>, values: Array<String>, fallback: String) {
        content.addView(Button(activity).apply {
            this.text = text; contentDescription = text
            setOnClickListener { AlertDialog.Builder(activity).setTitle(text).setSingleChoiceItems(labels,
                values.indexOf(preferences.string(key, fallback)).coerceAtLeast(0)) { dialog, index ->
                preferences.set(key, values[index]); refresh(); dialog.dismiss()
            }.setNegativeButton(activity.getString(R.string.ui_2cd0f3be8738), null).show() }
        })
    }
    choice(activity.getString(R.string.ui_0e32883df479), "list.addMusicLocationType", arrayOf(activity.getString(R.string.ui_6f2a4a02e60e), activity.getString(R.string.ui_3f049887991b)), arrayOf("top", "bottom"), "bottom")
    choice(activity.getString(R.string.ui_94cbb4dbf89e), "download.fileName", arrayOf(activity.getString(R.string.ui_7df84c1fad91), activity.getString(R.string.ui_5b43dcf6bbaa), activity.getString(R.string.ui_a01594f78908)), arrayOf("歌名 - 歌手", "歌手 - 歌名", "歌名"), "歌名 - 歌手")
    choice(activity.getString(R.string.ui_729baeb8ad16), "common.shareType", arrayOf(activity.getString(R.string.ui_13a1c63fb5dc), activity.getString(R.string.ui_ae788c9d4b50)), arrayOf("system", "clipboard"), "system")
    choice(activity.getString(R.string.ui_b23ed4004e18), "common.sourceNameType", arrayOf(activity.getString(R.string.ui_7bc846cd34a3), activity.getString(R.string.ui_23fbf53da512)), arrayOf("alias", "real"), "alias")
    title(activity.getString(R.string.ui_9e820f904830))
    toggle(activity.getString(R.string.ui_11c5a044b748), "common.showBackBtn")
    toggle(activity.getString(R.string.ui_c9edbe7646fb), "common.showExitBtn", true)
    choice(activity.getString(R.string.ui_d715550e650d), "common.drawerLayoutPosition", arrayOf(activity.getString(R.string.ui_6a24b14f33c7), activity.getString(R.string.ui_1cf1d4d0b24b)), arrayOf("left", "right"), "left")
    choice(activity.getString(R.string.ui_6089721beb10), "common.fontScale", arrayOf("80%", "90%", "100%", "110%", "120%", "130%", "150%"), arrayOf("0.8", "0.9", "1.0", "1.1", "1.2", "1.3", "1.5"), "1.0")
    title(activity.getString(R.string.ui_e3ca04a9cb13))
    choice(activity.getString(R.string.ui_0269e7020043), "player.cacheSize", arrayOf(activity.getString(R.string.ui_363b6afc345c), "128 MB", "512 MB", "1 GB", "2 GB", "4 GB", "8 GB"), arrayOf("0", "128", "512", "1024", "2048", "4096", "8192"), "1024")
    val cacheStatus = TextView(activity).apply { text = activity.getString(R.string.ui_3ea7896aff54) }; content.addView(cacheStatus)
    suspend fun updateSize() {
        val cache = CacheMaintenance(activity)
        cacheStatus.text = activity.getString(R.string.ui_31b0dd704fee, java.lang.String.valueOf(cache.audioBytes() / 1024 / 1024), java.lang.String.valueOf(cache.resourceBytes() / 1024), java.lang.String.valueOf(cache.lyricBytes() / 1024))
    }
    scope.launch { runCatching { updateSize() } }
    val matches = TextView(activity).apply { text = activity.getString(R.string.matching_cache_count, player?.matchingCacheCount ?: 0) }; content.addView(matches)
    content.addView(Button(activity).apply {
        text = activity.getString(R.string.matching_cache_clear); isEnabled = player != null
        setOnClickListener { player?.clearMatchingCache(); matches.text = activity.getString(R.string.matching_cache_count, player?.matchingCacheCount ?: 0) }
    })
    content.addView(Button(activity).apply {
        text = activity.getString(R.string.ui_12ccb655405b); setOnClickListener { scope.launch {
            try { CacheMaintenance(activity).clearResources(); updateSize() }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { cacheStatus.text = activity.getString(R.string.ui_ca88f243ff2a, java.lang.String.valueOf(e.localizedMessage)) }
        } }
    })
    content.addView(Button(activity).apply {
        text = activity.getString(R.string.ui_26cc8d0af3e5); setOnClickListener { scope.launch {
            try { CacheMaintenance(activity).clearAudio(); updateSize() }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { cacheStatus.text = activity.getString(R.string.ui_ca88f243ff2a, java.lang.String.valueOf(e.localizedMessage)) }
        } }
    })
    content.addView(Button(activity).apply {
        text = activity.getString(R.string.ui_a84c68e6881a); setOnClickListener { scope.launch {
            try { CacheMaintenance(activity).clearLyrics(); updateSize(); refresh() }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { cacheStatus.text = activity.getString(R.string.ui_ca88f243ff2a, java.lang.String.valueOf(e.localizedMessage)) }
        } }
    })
    content.addView(Button(activity).apply {
        text = activity.getString(R.string.ui_e4272bc9fe9f); setOnClickListener { scope.launch {
            try { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { PlaylistCredentials(activity).clear() }; cacheStatus.text = activity.getString(R.string.ui_2619b193e7ef) }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { cacheStatus.text = activity.getString(R.string.ui_2ff467120772, java.lang.String.valueOf(e.localizedMessage)) }
        } }
    })
    choice(activity.getString(R.string.interface_language), "common.langId", arrayOf(activity.getString(R.string.language_system), "简体中文", "繁體中文", "English"), arrayOf("", "zh-CN", "zh-TW", "en"), "")
    toggle(activity.getString(R.string.home_page_swipe), "common.homePageScroll", true)
    toggle(activity.getString(R.string.reserve_status_bar), "common.alwaysKeepStatusbarHeight")
    val originalStatusBar = preferences.bool("common.alwaysKeepStatusbarHeight")
    val originalLayout = listOf("common.drawerLayoutPosition", "common.fontScale", "common.langId").map { preferences.string(it, "") }
    AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_18a9d61deeb3)).setView(ScrollView(activity).apply { addView(content) }).setPositiveButton(activity.getString(R.string.ui_c0b3fbff51cc), null)
        .create().apply {
            setOnDismissListener {
                if (originalStatusBar != preferences.bool("common.alwaysKeepStatusbarHeight") ||
                    originalLayout != listOf("common.drawerLayoutPosition", "common.fontScale", "common.langId").map { preferences.string(it, "") }) activity.recreate()
            }
            show()
        }
}
