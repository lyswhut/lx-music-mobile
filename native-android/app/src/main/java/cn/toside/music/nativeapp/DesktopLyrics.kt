package cn.toside.music.nativeapp

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.provider.Settings
import android.os.Build
import android.hardware.input.InputManager
import android.view.Gravity
import android.view.MotionEvent
import android.view.WindowManager
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView

internal class DesktopLyricSettings(context: Context, name: String = "desktop-lyrics") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    fun bool(key: String, fallback: Boolean = false) = preferences.getBoolean(key, fallback)
    fun int(key: String, fallback: Int) = preferences.getInt(key, fallback)
    fun set(key: String, value: Boolean) { preferences.edit().putBoolean(key, value).apply() }
    fun set(key: String, value: Int) { preferences.edit().putInt(key, value).apply() }
    var enabled: Boolean
        get() = bool("enabled")
        set(value) = set("enabled", value)
}

/** Attached to playback rather than an Activity, so lyric rendering continues after leaving the app. */
internal class DesktopLyrics(private val context: Context) : AutoCloseable {
    private val settings = DesktopLyricSettings(context)
    private val playerSettings = PlayerSettings(context)
    private val offsets = LyricOffsets(context)
    private val manager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var view: TextView? = null
    private var params: WindowManager.LayoutParams? = null
    private var renderedKey = ""
    private var dragging = false

    @SuppressLint("ClickableViewAccessibility")
    fun render(state: PlayerState, lyrics: PlayerLyrics) {
        val song = state.song
        if (!settings.enabled || song == null || !Settings.canDrawOverlays(context)) { close(); return }
        val metrics = context.resources.displayMetrics
        val width = (metrics.widthPixels * settings.int("width", 90).coerceIn(20, 100) / 100).coerceAtLeast(1)
        val target = view ?: TextView(context).also { label ->
            view = label; label.contentDescription = context.getString(R.string.ui_37e60fc85ddb)
            label.setPadding(12, 8, 12, 8)
            label.setOnClickListener { context.startActivity(Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("open-player", true)) }
            var startX = 0f; var startY = 0f; var x = 0; var y = 0; var moved = false
            label.setOnTouchListener { _, event ->
                val layout = params ?: return@setOnTouchListener false
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> { dragging = true; startX = event.rawX; startY = event.rawY; x = layout.x; y = layout.y; moved = false; true }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - startX; val dy = event.rawY - startY
                        if (kotlin.math.abs(dx) + kotlin.math.abs(dy) > 8) moved = true
                        layout.x = (x + dx.toInt()).coerceIn(0, (metrics.widthPixels - layout.width).coerceAtLeast(0))
                        layout.y = (y + dy.toInt()).coerceIn(0, (metrics.heightPixels - label.height).coerceAtLeast(0))
                        runCatching { manager.updateViewLayout(label, layout) }; true
                    }
                    MotionEvent.ACTION_UP -> {
                        dragging = false
                        if (moved) { settings.set("x", layout.x); settings.set("y", layout.y) } else label.performClick()
                        true
                    }
                    MotionEvent.ACTION_CANCEL -> { dragging = false; settings.set("x", layout.x); settings.set("y", layout.y); true }
                    else -> false
                }
            }
        }
        val flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            (if (settings.bool("locked")) WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE else 0)
        val layout = params ?: WindowManager.LayoutParams(width, WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, flags, PixelFormat.TRANSLUCENT).apply {
                gravity = Gravity.TOP or Gravity.START
                x = settings.int("x", 0); y = settings.int("y", metrics.heightPixels / 3)
            }
        layout.width = width; layout.flags = flags
        val opacity = settings.int("opacity", 100).coerceIn(10, 100) / 100f
        // Android 12+ checks window alpha, not the TextView's alpha, for cross-app touch pass-through.
        layout.alpha = if (settings.bool("locked") && Build.VERSION.SDK_INT >= 31)
            minOf(opacity, context.getSystemService(InputManager::class.java)?.maximumObscuringOpacityForTouch ?: 0.8f) else opacity
        if (!dragging) {
            layout.x = settings.int("x", layout.x).coerceIn(0, (metrics.widthPixels - width).coerceAtLeast(0))
            layout.y = settings.int("y", layout.y).coerceIn(0, (metrics.heightPixels - target.height.coerceAtLeast(48)).coerceAtLeast(0))
        }
        target.textSize = settings.int("font", 18).coerceIn(10, 40).toFloat()
        target.alpha = 1f
        target.maxLines = if (settings.bool("single")) 1 else settings.int("lines", 5).coerceIn(1, 10)
        target.gravity = when (settings.int("align", 0)) { 1 -> Gravity.CENTER_HORIZONTAL; 2 -> Gravity.END; else -> Gravity.START } or
            when (settings.int("vertical", 0)) { 1 -> Gravity.CENTER_VERTICAL; 2 -> Gravity.BOTTOM; else -> Gravity.TOP }
        target.setShadowLayer(3f, 1f, 1f, settings.int("shadow", Color.BLACK))
        val unplayed = settings.int("unplayed", Color.WHITE); val played = settings.int("played", Color.rgb(7, 197, 86))
        target.setTextColor(played)
        val position = LyricTiming.lyricPosition(state.position.toLong(), offsets.get(song))
        val index = LrcParser.indexAt(lyrics.lines, position)
        val line = lyrics.lines.getOrNull(index)
        val key = "${lyrics.key}:$index"
        target.text = if (line == null || lyrics.key != "${song.source}:${song.id}") "${song.title} · ${song.artist}" else
            LyricRendering.styled(line, playerSettings, true, position, unplayed, played)
        if (key != renderedKey && settings.bool("animation", true)) { target.alpha = 0.4f; target.animate().alpha(1f).setDuration(180).start() }
        renderedKey = key
        try {
            if (params == null) { manager.addView(target, layout); params = layout } else manager.updateViewLayout(target, layout)
        } catch (_: RuntimeException) { close() }
    }
    override fun close() {
        view?.let { label -> label.animate().cancel(); runCatching { manager.removeView(label) } }
        view = null; params = null; renderedKey = ""; dragging = false
    }
}

internal fun showDesktopLyricSettings(activity: Activity, refresh: () -> Unit): AlertDialog {
    val settings = DesktopLyricSettings(activity)
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
    fun toggle(label: String, key: String, fallback: Boolean = false) {
        content.addView(CheckBox(activity).apply {
            text = label; contentDescription = label; isChecked = settings.bool(key, fallback)
            setOnCheckedChangeListener { _, value ->
                settings.set(key, value)
                if (key == "enabled" && value && !Settings.canDrawOverlays(activity)) {
                    try { activity.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${activity.packageName}"))) }
                    catch (_: RuntimeException) { settings.enabled = false; isChecked = false }
                }
                refresh()
            }
        })
    }
    toggle(activity.getString(R.string.ui_fbd649d1c94d), "enabled"); toggle(activity.getString(R.string.ui_6de595beb4c0), "locked")
    if (Build.VERSION.SDK_INT >= 31) content.addView(TextView(activity).apply { text = activity.getString(R.string.ui_ad6fb7bbb54d) })
    toggle(activity.getString(R.string.ui_1c3ff44df48b), "single"); toggle(activity.getString(R.string.ui_7459e7da0ad4), "animation", true)
    fun slider(title: String, key: String, min: Int, max: Int, fallback: Int) {
        val label = TextView(activity).apply { text = "$title：${settings.int(key, fallback)}" }
        content.addView(label)
        content.addView(SeekBar(activity).apply {
            this.min = min; this.max = max; progress = settings.int(key, fallback).coerceIn(min, max); contentDescription = title
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar?, value: Int, user: Boolean) {
                    label.text = "$title：$value"; if (user) { settings.set(key, value); refresh() }
                }
                override fun onStartTrackingTouch(bar: SeekBar?) = Unit
                override fun onStopTrackingTouch(bar: SeekBar?) = Unit
            })
        })
    }
    slider(activity.getString(R.string.ui_f71561b5af0a), "font", 10, 40, 18); slider(activity.getString(R.string.ui_4b7334f3d8ae), "width", 20, 100, 90)
    slider(activity.getString(R.string.ui_eda53a9cf5c1), "lines", 1, 10, 5); slider(activity.getString(R.string.ui_04405e4a9ffd), "opacity", 10, 100, 100)
    fun choices(title: String, key: String, labels: Array<String>, values: IntArray) {
        content.addView(Button(activity).apply {
            text = title
            setOnClickListener { AlertDialog.Builder(activity).setTitle(title).setItems(labels) { _, which -> settings.set(key, values[which]); refresh() }.show() }
        })
    }
    choices(activity.getString(R.string.ui_d1b14abbc00a), "align", arrayOf(activity.getString(R.string.ui_e2e0c454e5d5), activity.getString(R.string.ui_a567bdaa1136), activity.getString(R.string.ui_14ab1f2bce0a)), intArrayOf(0, 1, 2))
    choices(activity.getString(R.string.ui_128f6e763147), "vertical", arrayOf(activity.getString(R.string.ui_6f2a4a02e60e), activity.getString(R.string.ui_4cc3885c182e), activity.getString(R.string.ui_3f049887991b)), intArrayOf(0, 1, 2))
    val labels = arrayOf(activity.getString(R.string.ui_f56e7eff58bf), activity.getString(R.string.ui_30c83dc25b12), activity.getString(R.string.ui_67035e6b7f82), activity.getString(R.string.ui_789f61dbfcc7), activity.getString(R.string.ui_ed7d2c54184b), activity.getString(R.string.ui_d451c07d739b))
    val colors = intArrayOf(Color.WHITE, Color.rgb(7, 197, 86), Color.CYAN, Color.RED, Color.BLACK, Color.YELLOW)
    choices(activity.getString(R.string.ui_6f6364983f72), "unplayed", labels, colors); choices(activity.getString(R.string.ui_5b4844acaf2f), "played", labels, colors); choices(activity.getString(R.string.ui_2b40dbdb39f9), "shadow", labels, colors)
    return AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_486b54a7b0af)).setView(ScrollView(activity).apply { addView(content) })
        .setMessage(activity.getString(R.string.ui_d874760c91f0))
        .setPositiveButton(activity.getString(R.string.ui_c0b3fbff51cc), null).setNeutralButton(activity.getString(R.string.ui_8143c43db805)) { _, _ -> settings.set("x", 0); settings.set("y", 0); refresh() }.show()
}
