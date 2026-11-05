package cn.toside.music.nativeapp

import android.content.res.Configuration
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager

internal object ScreenInsets {
    @Suppress("DEPRECATION")
    fun install(window: Window, root: View) {
        val landscape = root.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        val reserveStatus = AppPreferences(root.context).bool("common.alwaysKeepStatusbarHeight")
        root.fitsSystemWindows = false
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        if (Build.VERSION.SDK_INT >= 30) window.setDecorFitsSystemWindows(false)
        else window.decorView.systemUiVisibility = window.decorView.systemUiVisibility or
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        if (landscape) window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= 30) {
                val safe = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime())
                val status = if (landscape && reserveStatus) insets.getInsetsIgnoringVisibility(WindowInsets.Type.statusBars()).top else 0
                view.setPadding(safe.left, maxOf(safe.top, status), safe.right, safe.bottom)
                WindowInsets.CONSUMED
            } else {
                val cutout = insets.displayCutout
                val status = if (landscape && reserveStatus) insets.stableInsetTop else 0
                view.setPadding(maxOf(insets.systemWindowInsetLeft, cutout?.safeInsetLeft ?: 0),
                    maxOf(insets.systemWindowInsetTop, status, cutout?.safeInsetTop ?: 0),
                    maxOf(insets.systemWindowInsetRight, cutout?.safeInsetRight ?: 0),
                    maxOf(insets.systemWindowInsetBottom, cutout?.safeInsetBottom ?: 0))
                insets.consumeSystemWindowInsets()
            }
        }
        root.post {
            if (Build.VERSION.SDK_INT >= 30) window.insetsController?.apply {
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                if (landscape) hide(WindowInsets.Type.statusBars()) else show(WindowInsets.Type.statusBars())
            }
            root.requestApplyInsets()
        }
    }
}
