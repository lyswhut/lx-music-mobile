package cn.toside.music.nativeapp

import android.animation.ValueAnimator
import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray

internal data class NativeTheme(val id: String, val name: String, val dark: Boolean, val primary: Int, val background: Int, val image: String)
internal class NativeThemes(private val context: Context) {
    fun name(theme: NativeTheme): String = context.getString(when (theme.id) {
        "green" -> R.string.theme_green; "blue" -> R.string.theme_blue; "blue_plus" -> R.string.theme_blue_plus
        "orange" -> R.string.theme_orange; "brown" -> R.string.theme_brown; "red" -> R.string.theme_red; "pink" -> R.string.theme_pink
        "purple" -> R.string.theme_purple; "grey" -> R.string.theme_grey; "ming" -> R.string.theme_ming; "blue2" -> R.string.theme_blue2
        "black" -> R.string.theme_black; "mid_autumn" -> R.string.theme_mid_autumn; "naruto" -> R.string.theme_naruto
        "china_ink" -> R.string.theme_china_ink; else -> R.string.theme_happy_new_year
    })
    fun all(): List<NativeTheme> {
        val array = context.assets.open("themes/themes.json").use { JSONArray(it.readBytes().toString(Charsets.UTF_8).removePrefix("\uFEFF")) }
        return (0 until array.length()).map { i -> array.getJSONObject(i).let {
            NativeTheme(it.getString("id"), it.getString("name"), it.getBoolean("dark"), color(it.getString("primary")), color(it.getString("background")), it.optString("image"))
        } }
    }
    fun active(): NativeTheme {
        val settings = AppPreferences(context)
        val night = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
        val id = if (settings.bool("common.isAutoTheme")) settings.string(if (night) "theme.darkId" else "theme.lightId", if (night) "black" else "green")
            else settings.string("theme.id", "green")
        return all().firstOrNull { it.id == id } ?: all().first()
    }
    companion object {
        internal fun color(value: String): Int {
            if (value.startsWith('#')) return Color.parseColor(value)
            val values = value.substringAfter('(').substringBefore(')').split(',').map { it.trim().toFloat() }
            require(values.size in 3..4)
            return Color.argb(if (values.size == 4) (values[3] * 255).toInt().coerceIn(0, 255) else 255,
                values[0].toInt().coerceIn(0, 255), values[1].toInt().coerceIn(0, 255), values[2].toInt().coerceIn(0, 255))
        }
    }
}
internal class UiPalette(private val context: Context, val theme: NativeTheme) {
    val primary = theme.primary
    val foreground = if (theme.dark) Color.rgb(222, 222, 222) else Color.rgb(70, 70, 70)
    val muted = if (theme.dark) Color.rgb(177, 177, 177) else Color.GRAY
    val faint = if (theme.dark) Color.rgb(144, 144, 144) else Color.LTGRAY
    val surface = if (theme.dark) Color.rgb(19, 19, 19) else Color.WHITE
    val divider = if (theme.dark) Color.rgb(55, 55, 55) else Color.rgb(238, 238, 238)
    val placeholder = if (theme.dark) Color.rgb(44, 44, 44) else Color.rgb(235, 246, 239)
    fun background(view: View) {
        val preferences = AppPreferences(context)
        if (theme.image.isBlank() || theme.dark && preferences.bool("theme.hideBgDark")) { view.background = ColorDrawable(surface); return }
        val options = BitmapFactory.Options().apply { inSampleSize = 2 }
        val bitmap = context.assets.open("themes/${theme.image}").use { BitmapFactory.decodeStream(it, null, options) } ?: run { view.setBackgroundColor(surface); return }
        val backdrop = Backdrop(bitmap, theme.background)
        view.background = backdrop
        if (preferences.bool("theme.dynamicBg")) {
            val animator = ValueAnimator.ofFloat(0f, 1f).apply {
                duration = 18_000; repeatCount = ValueAnimator.INFINITE; repeatMode = ValueAnimator.REVERSE
                addUpdateListener { backdrop.phase = it.animatedValue as Float; backdrop.invalidateSelf() }
            }
            view.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
                override fun onViewAttachedToWindow(v: View) { animator.start() }
                override fun onViewDetachedFromWindow(v: View) { animator.cancel() }
            })
            if (view.isAttachedToWindow) animator.start()
        }
    }
    fun textStyle(view: View) {
        if (!AppPreferences(context).bool("theme.fontShadow")) return
        if (view is TextView) view.setShadowLayer(1.5f, 0.5f, 0.5f, if (theme.dark) Color.BLACK else Color.WHITE)
        if (view is ViewGroup) for (i in 0 until view.childCount) textStyle(view.getChildAt(i))
    }
    private class Backdrop(private val bitmap: Bitmap, private val overlay: Int) : Drawable() {
        var phase = 0.5f
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        override fun draw(canvas: Canvas) {
            val scale = maxOf(bounds.width().toFloat() / bitmap.width, bounds.height().toFloat() / bitmap.height) * 1.04f
            val width = bitmap.width * scale; val height = bitmap.height * scale
            val x = (bounds.width() - width) * phase; val y = (bounds.height() - height) * phase
            canvas.drawBitmap(bitmap, null, RectF(x, y, x + width, y + height), paint); canvas.drawColor(overlay)
        }
        override fun setAlpha(alpha: Int) { paint.alpha = alpha }
        override fun setColorFilter(filter: ColorFilter?) { paint.colorFilter = filter }
        @Deprecated("Deprecated in Android") override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
    }
}
internal fun showThemeSettings(activity: Activity) {
    val settings = AppPreferences(activity); val themes = NativeThemes(activity).all()
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
    fun toggle(text: String, key: String) { content.addView(CheckBox(activity).apply {
        this.text = text; contentDescription = text; isChecked = settings.bool(key)
        setOnCheckedChangeListener { _, value -> settings.set(key, value) }
    }) }
    toggle(activity.getString(R.string.ui_c7970c3d538e), "common.isAutoTheme"); toggle(activity.getString(R.string.ui_76a0950acd56), "theme.hideBgDark")
    toggle(activity.getString(R.string.ui_7c0f1e4ec56f), "theme.dynamicBg"); toggle(activity.getString(R.string.ui_490573c22811), "theme.fontShadow")
    content.addView(TextView(activity).apply { text = activity.getString(R.string.ui_8874d3825cf1) })
    var dialog: AlertDialog? = null
    themes.forEach { theme -> content.addView(android.widget.Button(activity).apply {
        text = NativeThemes(activity).name(theme); setTextColor(theme.primary)
        setOnClickListener {
            settings.set("theme.id", theme.id); settings.set(if (theme.dark) "theme.darkId" else "theme.lightId", theme.id)
            dialog?.dismiss(); activity.recreate()
        }
    }) }
    dialog = AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_788db1cfec2a)).setView(ScrollView(activity).apply { addView(content) })
        .setPositiveButton(activity.getString(R.string.ui_63c73c4730f4)) { _, _ -> activity.recreate() }.setNegativeButton(activity.getString(R.string.ui_2cd0f3be8738), null).show()
}
