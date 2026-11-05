package cn.toside.music.nativeapp

import android.content.Intent
import android.content.res.Configuration
import android.graphics.Insets
import android.os.Build
import android.view.ViewGroup
import android.view.WindowInsets
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ScreenInsetsTest {
    @Test fun landscapeStatusReservationAndKeyboardCutoutNavigationInsetsProtectControls() {
        if (Build.VERSION.SDK_INT < 30) return
        val instrumentation = InstrumentationRegistry.getInstrumentation(); val context = instrumentation.targetContext
        assumeTrue(context.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE)
        val preferences = context.getSharedPreferences("app-settings", 0)
        val original = preferences.all["common.alwaysKeepStatusbarHeight"]
        val activity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        try {
            instrumentation.runOnMainSync {
                val root = activity.findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
                val hidden = WindowInsets.Builder().setInsets(WindowInsets.Type.systemBars(), Insets.of(0, 0, 0, 48))
                    .setInsetsIgnoringVisibility(WindowInsets.Type.statusBars(), Insets.of(0, 24, 0, 0))
                    .setInsets(WindowInsets.Type.displayCutout(), Insets.of(18, 0, 0, 0))
                    .setVisible(WindowInsets.Type.statusBars(), false).build()
                preferences.edit().putBoolean("common.alwaysKeepStatusbarHeight", true).commit()
                ScreenInsets.install(activity.window, root); root.dispatchApplyWindowInsets(hidden)
                assertEquals(24, root.paddingTop); assertEquals(18, root.paddingLeft); assertEquals(48, root.paddingBottom)
                val keyboard = WindowInsets.Builder(hidden).setInsets(WindowInsets.Type.ime(), Insets.of(0, 0, 0, 240)).build()
                root.dispatchApplyWindowInsets(keyboard); assertEquals(240, root.paddingBottom)
                root.dispatchApplyWindowInsets(hidden); assertEquals(48, root.paddingBottom)
                preferences.edit().putBoolean("common.alwaysKeepStatusbarHeight", false).commit()
                ScreenInsets.install(activity.window, root); root.dispatchApplyWindowInsets(hidden)
                assertEquals(0, root.paddingTop); assertEquals(18, root.paddingLeft)
            }
        } finally {
            instrumentation.runOnMainSync { activity.finish() }
            preferences.edit().apply { if (original is Boolean) putBoolean("common.alwaysKeepStatusbarHeight", original) else remove("common.alwaysKeepStatusbarHeight") }.commit()
        }
    }
}
