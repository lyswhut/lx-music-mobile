package cn.toside.music.nativeapp.ui

import android.app.Activity
import android.app.AlertDialog
import android.app.Dialog
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.text.InputFilter
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.Switch
import android.widget.TextView
import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.data.CacheMaintenance
import cn.toside.music.nativeapp.data.PlaylistCredentials
import cn.toside.music.nativeapp.player.PlaybackService
import cn.toside.music.nativeapp.source.OnlineSourceImport
import cn.toside.music.nativeapp.source.UserSourceEntry
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal class SettingsActions(
    val importLocal: () -> Unit,
    val sourceActions: (UserSourceEntry, () -> Unit) -> Unit,
    val playback: () -> Unit,
    val quality: () -> Unit,
    val desktopLyrics: () -> Unit,
    val sync: () -> Unit,
    val about: () -> Unit,
)

/** Desktop category sidebar on wide windows, mobile category tabs on narrow windows. */
internal class SettingsDialog(
    private val activity: Activity,
    parentScope: CoroutineScope,
    private val player: () -> PlaybackService?,
    private val actions: SettingsActions,
    private val layout: AdaptiveLayout,
    state: Bundle? = null,
    private val refresh: () -> Unit,
) : Dialog(activity, if (NativeThemes(activity).active().dark) R.style.NativeDark else R.style.NativeLight) {
    private val preferences = AppPreferences(activity)
    private val palette = UiPalette(activity, NativeThemes(activity).active())
    private val styles = LxStyles(activity, palette, Typeface.createFromAsset(activity.assets, "fonts/icomoon.ttf"))
    private val scope = CoroutineScope(parentScope.coroutineContext + SupervisorJob(parentScope.coroutineContext[Job]))
    private val originalAppearance = appearanceKeys.map { preferences.string(it, "") }
    private val originalStatusBar = preferences.bool("common.alwaysKeepStatusbarHeight")
    private val originalTheme = themeKeys.map { preferences.bool(it) }
    private var pageJob: Job? = null
    private var importJob: Job? = null
    private var current = state?.getString("category")?.takeIf { id -> categories.any { it.first == id } } ?: "basic"
    private var sourceUrl = state?.getString("source-url").orEmpty()
    private val positions = categories.associate { it.first to (state?.getInt("scroll-${it.first}") ?: 0) }.toMutableMap()
    private val tabs = mutableMapOf<String, TextView>()
    private var tabStrip: HorizontalScrollView? = null
    private lateinit var content: LinearLayout
    private lateinit var scroll: ScrollView
    private var sourceStatus: TextView? = null
    private var sourceList: LinearLayout? = null
    private var sourceInput: EditText? = null
    private var importButton: TextView? = null
    private var localImport: View? = null
    private var progress: ProgressBar? = null
    private var sourceMessage: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createContent())
        window?.apply {
            setBackgroundDrawableResource(android.R.color.transparent)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            ScreenInsets.install(this, findViewById(android.R.id.content))
        }
        setOnDismissListener {
            scope.cancel()
            if (!activity.isFinishing && !activity.isChangingConfigurations && !activity.isDestroyed &&
                (originalAppearance != appearanceKeys.map { preferences.string(it, "") } ||
                    originalStatusBar != preferences.bool("common.alwaysKeepStatusbarHeight") ||
                    originalTheme != themeKeys.map { preferences.bool(it) })) activity.recreate()
        }
    }

    internal fun saveState() = Bundle().apply {
        putString("category", current); putString("source-url", sourceInput?.text?.toString() ?: sourceUrl)
        categories.forEach { putInt("scroll-${it.first}", if (it.first == current && ::scroll.isInitialized) scroll.scrollY else positions[it.first] ?: 0) }
    }

    // Measure the same real Views offscreen to cover phone, tablet and split-screen dimensions.
    internal fun createContent(): View {
        tabs.clear()
        val root = column().apply { tag = "settings-root"; setBackgroundColor(palette.surface) }
        val header = LinearLayout(activity).apply { gravity = Gravity.CENTER_VERTICAL; setPadding(dp(8), dp(4), dp(12), dp(4)) }
        header.addView(button("‹") { dismiss() }.apply { contentDescription = text(R.string.ui_3fd47edce45b); textSize = 30f; setPadding(0, 0, 0, 0) }, LinearLayout.LayoutParams(dp(48), dp(48)))
        header.addView(label(text(R.string.settings_title), 21f).apply { setTypeface(null, Typeface.BOLD) }, LinearLayout.LayoutParams(0, -2, 1f))
        header.addView(button(text(R.string.ui_c0b3fbff51cc)) { dismiss() })
        root.addView(header); divider(root)
        val body = LinearLayout(activity).apply { orientation = if (layout.expanded) LinearLayout.HORIZONTAL else LinearLayout.VERTICAL }
        val nav = LinearLayout(activity).apply {
            tag = if (layout.expanded) "settings-sidebar" else "settings-tabs"
            orientation = if (layout.expanded) LinearLayout.VERTICAL else LinearLayout.HORIZONTAL
            setPadding(dp(8), dp(8), dp(8), dp(8)); setBackgroundColor(styles.panel)
        }
        categories.forEach { (id, title) ->
            val tab = label(text(title), 14f).apply {
                tag = "settings-category-$id"; gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(16), dp(14), dp(16), dp(14)); minHeight = dp(48)
                isFocusable = true; setOnClickListener { select(id) }
            }
            tabs[id] = tab
            nav.addView(tab, LinearLayout.LayoutParams(if (layout.expanded) -1 else -2, -2).apply { bottomMargin = if (layout.expanded) dp(4) else 0 })
        }
        if (layout.expanded) {
            body.addView(ScrollView(activity).apply { isFillViewport = true; isVerticalScrollBarEnabled = false; addView(nav) }, LinearLayout.LayoutParams(dp(if (layout.widthDp >= 840) 208 else 168), -1))
            body.addView(View(activity).apply { setBackgroundColor(palette.divider) }, LinearLayout.LayoutParams(dp(1), -1))
        } else body.addView(HorizontalScrollView(activity).apply {
            tabStrip = this; isHorizontalScrollBarEnabled = false; addView(nav)
            addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> tabs[current]?.let { scrollTo(it.left - dp(8), 0) } }
        }, LinearLayout.LayoutParams(-1, -2))
        content = column().apply { setPadding(dp(if (layout.expanded) 28 else 20), dp(12), dp(if (layout.expanded) 28 else 20), dp(32)) }
        scroll = ScrollView(activity).apply { tag = "settings-content"; isFillViewport = true; addView(content) }
        body.addView(scroll, if (layout.expanded) LinearLayout.LayoutParams(0, -1, 1f) else LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(body, LinearLayout.LayoutParams(-1, 0, 1f)); render()
        return root
    }

    private fun select(id: String) {
        if (id == current) return
        positions[current] = scroll.scrollY
        sourceInput?.let { sourceUrl = it.text.toString() }
        current = id; render()
    }
    private fun render() {
        pageJob?.cancel(); content.removeAllViews()
        sourceInput = null; sourceStatus = null; sourceList = null; progress = null; importButton = null; localImport = null
        tabs.forEach { (id, tab) ->
            tab.isSelected = id == current; tab.setTextColor(if (tab.isSelected) palette.primary else palette.foreground)
            tab.background = styles.touch(if (tab.isSelected) styles.selected else Color.TRANSPARENT)
            tab.setTypeface(null, if (tab.isSelected) Typeface.BOLD else Typeface.NORMAL)
        }
        heading(text(categories.first { it.first == current }.second))
        when (current) {
            "basic" -> basic()
            "playback" -> playback()
            "list" -> lists()
            "sources" -> sources()
            "theme" -> themes()
            "cache" -> cache()
            "sync" -> { note(text(R.string.ui_f40e986f62c5)); action(text(R.string.ui_727036c7fc2a), click = actions.sync) }
            "about" -> { note("LX Music"); action(text(R.string.ui_4fd38bc4f6d4), click = actions.about) }
        }
        val selected = current
        scroll.post { if (current == selected) scroll.scrollTo(0, positions[current] ?: 0) }
        tabs[current]?.post { tabs[current]?.let { tabStrip?.smoothScrollTo(it.left - dp(8), 0) } }
    }

    private fun basic() {
        note(text(R.string.settings_apply_hint))
        choice(R.string.interface_language, "common.langId", arrayOf(text(R.string.language_system), "简体中文", "繁體中文", "English"), arrayOf("", "zh-CN", "zh-TW", "en"), "")
        choice(R.string.ui_6089721beb10, "common.fontScale", arrayOf("80%", "90%", "100%", "110%", "120%", "130%", "150%"), arrayOf("0.8", "0.9", "1.0", "1.1", "1.2", "1.3", "1.5"), "1.0")
        toggle(R.string.ui_11c5a044b748, "common.showBackBtn")
        toggle(R.string.ui_c9edbe7646fb, "common.showExitBtn", true)
        choice(R.string.ui_d715550e650d, "common.drawerLayoutPosition", arrayOf(text(R.string.ui_6a24b14f33c7), text(R.string.ui_1cf1d4d0b24b)), arrayOf("left", "right"), "left")
        toggle(R.string.home_page_swipe, "common.homePageScroll", true)
        toggle(R.string.reserve_status_bar, "common.alwaysKeepStatusbarHeight")
        toggle(R.string.ui_e3b61ed71904, "common.allowProgressBarSeek", true)
        toggle(R.string.ui_d7295a6e9a5a, "common.autoHidePlayBar")
        choice(R.string.ui_729baeb8ad16, "common.shareType", arrayOf(text(R.string.ui_13a1c63fb5dc), text(R.string.ui_ae788c9d4b50)), arrayOf("system", "clipboard"), "system")
        choice(R.string.ui_b23ed4004e18, "common.sourceNameType", arrayOf(text(R.string.ui_7bc846cd34a3), text(R.string.ui_23fbf53da512)), arrayOf("alias", "real"), "alias")
    }
    private fun playback() {
        action(text(R.string.ui_599818eb56df), click = actions.quality)
        action(text(R.string.ui_8c38525734c0), click = actions.playback)
        action(text(R.string.ui_486b54a7b0af), click = actions.desktopLyrics)
        toggle(R.string.ui_8a47499c40e0, "player.startupAutoPlay")
        toggle(R.string.ui_d6320dc2f6f6, "player.startupPushPlayDetailScreen")
        toggle(R.string.ui_5da5740ba417, "player.isSavePlayTime", true)
        toggle(R.string.ui_4a79cf8d0791, "player.recordHistory", true)
        toggle(R.string.ui_1a232faf3bfe, "player.autoSwitchSource", true)
        toggle(R.string.ui_4affe217c432, "player.isAutoCleanPlayedList")
        toggle(R.string.ui_2f9d06b47ed2, "player.isHandleAudioFocus", true)
        toggle(R.string.ui_ff6ed64098b9, "player.isEnableAudioOffload")
        toggle(R.string.ui_46749ca81e12, "player.isShowNotificationImage", true)
        toggle(R.string.ui_d5b0714beafd, "player.isShowBluetoothLyric")
        toggle(R.string.ui_7a36a9f3c4ab, "player.isShowBluetoothFullLyric")
    }
    private fun lists() {
        toggle(R.string.ui_0aec06d42251, "list.isClickPlayList")
        toggle(R.string.ui_c41fc8ebc9bb, "list.isShowSource", true)
        toggle(R.string.ui_1855017a0392, "list.isShowAlbumName")
        toggle(R.string.ui_5b5ca57648a2, "list.isShowInterval", true)
        toggle(R.string.ui_3b432f3fe1df, "list.isSaveScrollLocation", true)
        toggle(R.string.ui_9d379ca17d16, "search.isShowHistorySearch", true)
        toggle(R.string.ui_02eeee3c6016, "search.isShowHotSearch")
        choice(R.string.ui_0e32883df479, "list.addMusicLocationType", arrayOf(text(R.string.ui_6f2a4a02e60e), text(R.string.ui_3f049887991b)), arrayOf("top", "bottom"), "bottom")
        choice(R.string.ui_94cbb4dbf89e, "download.fileName", arrayOf(text(R.string.ui_7df84c1fad91), text(R.string.ui_5b43dcf6bbaa), text(R.string.ui_a01594f78908)), arrayOf("歌名 - 歌手", "歌手 - 歌名", "歌名"), "歌名 - 歌手")
    }

    private fun sources() {
        note(text(R.string.settings_source_hint)); section(text(R.string.settings_source_online))
        val fieldLabel = label(text(R.string.settings_source_url), 13f, palette.muted).also { content.addView(it) }
        sourceInput = EditText(activity).apply {
            id = View.generateViewId(); tag = "settings-source-url"; hint = "https://example.com/source.js"
            contentDescription = text(R.string.settings_source_url); inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setSingleLine(true); filters = arrayOf(InputFilter.LengthFilter(8192)); imeOptions = EditorInfo.IME_ACTION_GO; setText(sourceUrl)
            setTextColor(palette.foreground); setHintTextColor(palette.muted); textSize = 14f
            backgroundTintList = ColorStateList.valueOf(palette.primary); fieldLabel.labelFor = id
            setOnEditorActionListener { _, action, _ -> if (action == EditorInfo.IME_ACTION_GO) { startImport(); true } else false }
            content.addView(this, LinearLayout.LayoutParams(-1, dp(56)))
        }
        note(text(R.string.settings_source_url_hint))
        importButton = button(text(R.string.settings_source_online), true) { startImport() }.apply { tag = "settings-source-import" }
        content.addView(importButton, LinearLayout.LayoutParams(if (layout.expanded) -2 else -1, -2).apply { topMargin = dp(8) })
        progress = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply { isIndeterminate = true; indeterminateTintList = ColorStateList.valueOf(palette.primary) }
        content.addView(progress, LinearLayout.LayoutParams(-1, dp(4)).apply { topMargin = dp(12) })
        sourceStatus = note(sourceMessage.orEmpty()).apply { tag = "settings-source-status"; accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE }
        updateImportState()
        localImport = action(text(R.string.ui_3158c8d56b7b)) { if (importJob?.isActive != true) actions.importLocal() }.apply { tag = "settings-source-local-import" }
        section(text(R.string.settings_source_installed))
        sourceList = column().apply { tag = "settings-source-list"; content.addView(this) }
        updateImportState()
        refreshSources()
    }
    private fun startImport() {
        if (importJob?.isActive == true) return
        sourceUrl = sourceInput?.text?.toString() ?: return
        sourceMessage = text(R.string.settings_source_downloading)
        importJob = scope.launch {
            try {
                val service = checkNotNull(player()) { text(R.string.ui_7ca47a28e695) }
                val script = OnlineSourceImport(activity).download(sourceUrl)
                sourceMessage = text(R.string.settings_source_validating); updateImportState()
                service.importSource(script)
                sourceMessage = text(R.string.settings_source_success); sourceUrl = ""; sourceInput?.text?.clear(); refreshSources()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { sourceMessage = activity.getString(R.string.ui_03f6f90cdb7a, e.localizedMessage.orEmpty()) }
            finally { importJob = null; updateImportState() }
        }
        updateImportState()
    }
    private fun updateImportState() {
        val busy = importJob?.isActive == true
        sourceInput?.isEnabled = !busy
        importButton?.apply { isEnabled = !busy; alpha = if (busy) .6f else 1f; text = if (busy) text(R.string.settings_source_importing) else text(R.string.settings_source_online) }
        progress?.visibility = if (busy) View.VISIBLE else View.GONE
        sourceStatus?.apply { text = sourceMessage.orEmpty(); visibility = if (text.isEmpty()) View.GONE else View.VISIBLE }
        localImport?.apply { isEnabled = !busy; alpha = if (busy) .6f else 1f }
        sourceList?.let { list ->
            list.alpha = if (busy) .6f else 1f
            for (index in 0 until list.childCount) list.getChildAt(index).isEnabled = !busy
        }
    }
    internal fun refreshSources() {
        if (current != "sources") return
        val list = sourceList ?: return
        pageJob?.cancel()
        pageJob = scope.launch {
            try {
                val service = player() ?: return@launch
                val catalog = service.sourceCatalog(); list.removeAllViews()
                action(text(R.string.ui_98e96c39ccf6), if (catalog.selected == null) text(R.string.ui_7f1c18aeb640) else "", list) {
                    if (importJob?.isActive == true) return@action
                    scope.launch { try { service.selectSource(null); refreshSources() } catch (e: CancellationException) { throw e } catch (e: Exception) { sourceMessage = e.localizedMessage; updateImportState() } }
                }
                if (catalog.entries.isEmpty()) list.addView(noteView(text(R.string.settings_source_no_sources)))
                catalog.entries.forEach { entry ->
                    val details = listOf(if (entry.id == catalog.selected) text(R.string.settings_selected) else "", entry.version, entry.author).filter { it.isNotBlank() }.joinToString(" · ")
                    action(entry.name, details, list) { if (importJob?.isActive != true) actions.sourceActions(entry, ::refreshSources) }
                }
                updateImportState()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { list.removeAllViews(); list.addView(noteView(activity.getString(R.string.ui_b0f9363c052f, e.localizedMessage.orEmpty()))) }
        }
    }

    private fun themes() {
        note(text(R.string.ui_8874d3825cf1))
        toggle(R.string.ui_c7970c3d538e, "common.isAutoTheme"); toggle(R.string.ui_76a0950acd56, "theme.hideBgDark")
        toggle(R.string.ui_7c0f1e4ec56f, "theme.dynamicBg"); toggle(R.string.ui_490573c22811, "theme.fontShadow")
        section(text(R.string.ui_788db1cfec2a))
        val themes = NativeThemes(activity)
        themes.all().forEach { theme ->
            action(themes.name(theme), if (theme.id == preferences.string("theme.id", "green")) text(R.string.settings_selected) else "") {
                preferences.set("theme.id", theme.id); preferences.set(if (theme.dark) "theme.darkId" else "theme.lightId", theme.id)
                positions[current] = scroll.scrollY; render()
            }.addView(View(activity).apply { background = styles.shape(theme.primary, 12) }, 0, LinearLayout.LayoutParams(dp(24), dp(24)).apply { marginEnd = dp(12) })
        }
        note(text(R.string.settings_apply_hint))
    }
    private fun cache() {
        choice(R.string.ui_0269e7020043, "player.cacheSize", arrayOf(text(R.string.ui_363b6afc345c), "128 MB", "512 MB", "1 GB", "2 GB", "4 GB", "8 GB"), arrayOf("0", "128", "512", "1024", "2048", "4096", "8192"), "1024")
        val status = note(text(R.string.ui_3ea7896aff54))
        suspend fun updateSize() {
            val cache = CacheMaintenance(activity)
            status.text = activity.getString(R.string.ui_31b0dd704fee, (cache.audioBytes() / 1024 / 1024).toString(), (cache.resourceBytes() / 1024).toString(), (cache.lyricBytes() / 1024).toString())
        }
        pageJob = scope.launch { try { updateSize() } catch (e: CancellationException) { throw e } catch (e: Exception) { status.text = e.localizedMessage } }
        fun clear(title: Int, block: suspend () -> Unit) { action(text(title)) {
            scope.launch { try { block(); updateSize() } catch (e: CancellationException) { throw e } catch (e: Exception) { status.text = activity.getString(R.string.ui_ca88f243ff2a, e.localizedMessage.orEmpty()) } }
        } }
        clear(R.string.ui_12ccb655405b) { CacheMaintenance(activity).clearResources() }
        clear(R.string.ui_26cc8d0af3e5) { CacheMaintenance(activity).clearAudio() }
        clear(R.string.ui_a84c68e6881a) { CacheMaintenance(activity).clearLyrics(); refresh() }
        val matches = note(activity.getString(R.string.matching_cache_count, player()?.matchingCacheCount ?: 0))
        action(text(R.string.matching_cache_clear)) { player()?.clearMatchingCache(); matches.text = activity.getString(R.string.matching_cache_count, player()?.matchingCacheCount ?: 0) }
        action(text(R.string.ui_e4272bc9fe9f)) { scope.launch {
            try { withContext(Dispatchers.IO) { PlaylistCredentials(activity).clear() }; status.text = text(R.string.ui_2619b193e7ef) }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = activity.getString(R.string.ui_2ff467120772, e.localizedMessage.orEmpty()) }
        } }
    }

    private fun column() = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL }
    private fun label(value: String, size: Float = 15f, color: Int = palette.foreground) = TextView(activity).apply { text = value; textSize = size; setTextColor(color) }
    private fun heading(value: String) { content.addView(label(value, 22f, palette.primary).apply { setTypeface(null, Typeface.BOLD); setPadding(0, dp(12), 0, dp(20)); isAccessibilityHeading = true }) }
    private fun section(value: String) { content.addView(label(value, 15f, palette.primary).apply { setTypeface(null, Typeface.BOLD); setPadding(0, dp(24), 0, dp(12)); isAccessibilityHeading = true }) }
    private fun noteView(value: String) = label(value, 13f, palette.muted).apply { setPadding(0, dp(4), 0, dp(16)); setLineSpacing(dp(3).toFloat(), 1f) }
    private fun note(value: String) = noteView(value).also { content.addView(it) }
    private fun divider(parent: LinearLayout) { parent.addView(View(activity).apply { setBackgroundColor(palette.divider) }, LinearLayout.LayoutParams(-1, dp(1))) }
    private fun button(value: String, primary: Boolean = false, click: () -> Unit) = label(value, 14f, if (primary) palette.surface else palette.primary).apply {
        gravity = Gravity.CENTER; minHeight = dp(48); setPadding(dp(18), dp(12), dp(18), dp(12))
        background = styles.touch(if (primary) palette.primary else Color.TRANSPARENT); isFocusable = true; setOnClickListener { click() }
        accessibilityDelegate = object : View.AccessibilityDelegate() {
            override fun onInitializeAccessibilityNodeInfo(host: View, info: android.view.accessibility.AccessibilityNodeInfo) { super.onInitializeAccessibilityNodeInfo(host, info); info.className = "android.widget.Button" }
        }
    }
    private fun action(title: String, value: String = "", parent: LinearLayout = content, click: () -> Unit): LinearLayout {
        val row = LinearLayout(activity).apply {
            gravity = Gravity.CENTER_VERTICAL; minimumHeight = dp(64); setPadding(dp(4), dp(12), dp(4), dp(12))
            background = styles.touch(); isFocusable = true; setOnClickListener { click() }
        }
        val labels = column().apply { addView(label(title)); if (value.isNotBlank()) addView(label(value, 12f, palette.muted).apply { setPadding(0, dp(6), 0, 0) }) }
        row.addView(labels, LinearLayout.LayoutParams(0, -2, 1f))
        row.addView(label("›", 22f, palette.muted).apply { gravity = Gravity.CENTER }, LinearLayout.LayoutParams(dp(32), -2))
        parent.addView(row, LinearLayout.LayoutParams(-1, -2)); divider(parent)
        return row
    }
    private fun toggle(title: Int, key: String, fallback: Boolean = false) {
        val row = LinearLayout(activity).apply { gravity = Gravity.CENTER_VERTICAL; minimumHeight = dp(64); setPadding(dp(4), dp(8), dp(4), dp(8)) }
        row.addView(label(text(title)), LinearLayout.LayoutParams(0, -2, 1f).apply { marginEnd = dp(16) })
        @Suppress("UseSwitchCompatOrMaterialCode")
        val toggle = Switch(activity).apply {
            tag = "settings-$key"; contentDescription = text(title); isChecked = preferences.bool(key, fallback)
            thumbTintList = ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(palette.primary, palette.muted))
            minHeight = dp(48); setOnCheckedChangeListener { _, checked -> preferences.set(key, checked); refresh() }
        }
        row.addView(toggle); row.setOnClickListener { toggle.toggle() }
        content.addView(row, LinearLayout.LayoutParams(-1, -2)); divider(content)
    }
    private fun choice(title: Int, key: String, labels: Array<String>, values: Array<String>, fallback: String) {
        lateinit var row: LinearLayout
        row = action(text(title), labels[values.indexOf(preferences.string(key, fallback)).coerceAtLeast(0)]) {
            AlertDialog.Builder(activity).setTitle(text(title)).setSingleChoiceItems(labels, values.indexOf(preferences.string(key, fallback)).coerceAtLeast(0)) { dialog, index ->
                preferences.set(key, values[index]); refresh()
                ((row.getChildAt(0) as LinearLayout).getChildAt(1) as TextView).text = labels[index]
                dialog.dismiss()
            }.setNegativeButton(text(R.string.ui_2cd0f3be8738), null).show()
        }
        row.tag = "settings-$key"
    }
    private fun text(id: Int) = activity.getString(id)
    private fun dp(value: Int) = styles.dp(value)
    companion object {
        private val categories = listOf("basic" to R.string.settings_basic, "playback" to R.string.settings_playback,
            "sources" to R.string.settings_sources, "list" to R.string.ui_6e34875b6fe3, "theme" to R.string.ui_788db1cfec2a,
            "cache" to R.string.ui_e3ca04a9cb13, "sync" to R.string.ui_727036c7fc2a, "about" to R.string.settings_about)
        private val appearanceKeys = listOf("common.drawerLayoutPosition", "common.fontScale", "common.langId", "theme.id", "theme.darkId", "theme.lightId")
        private val themeKeys = listOf("common.isAutoTheme", "theme.hideBgDark", "theme.dynamicBg", "theme.fontShadow")
    }
}
