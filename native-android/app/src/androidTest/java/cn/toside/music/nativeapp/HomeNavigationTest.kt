package cn.toside.music.nativeapp

import android.content.Intent
import android.os.SystemClock
import android.view.MotionEvent
import android.view.ViewGroup
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HomeNavigationTest {
    @Test fun horizontalGestureChangesPagesOnlyWhenEnabledAndVerticalScrollingDoesNot() {
        val instrumentation = InstrumentationRegistry.getInstrumentation(); val context = instrumentation.targetContext
        val preferences = context.getSharedPreferences("app-settings", 0)
        val keys = listOf("common.homePageScroll", "search.isShowHotSearch")
        val saved = keys.associateWith { preferences.all[it] }
        preferences.edit().putBoolean("common.homePageScroll", false).putBoolean("search.isShowHotSearch", false).commit()
        val activity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        try {
            instrumentation.waitForIdleSync()
            val root = activity.findViewById<ViewGroup>(android.R.id.content).getChildAt(0) as HomeNavigationLayout
            val online = MainActivity::class.java.getDeclaredField("onlineMode").apply { isAccessible = true }
            fun gesture(right: Boolean, vertical: Boolean = false) { instrumentation.runOnMainSync {
                val density = activity.resources.displayMetrics.density
                val from = if (right) root.width * 0.25f else root.width * 0.75f
                val to = if (right) root.width * 0.75f else root.width * 0.25f
                val y = root.paddingTop + 20 * density; val time = SystemClock.uptimeMillis()
                listOf(MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE, MotionEvent.ACTION_UP).forEachIndexed { index, action ->
                    val event = MotionEvent.obtain(time, time + index * 50, action,
                        if (vertical || index == 0) from else to, if (vertical && index > 0) y + 120 * density else y, 0)
                    root.dispatchTouchEvent(event); event.recycle()
                }
            } }
            gesture(false); assertFalse(online.getBoolean(activity))
            preferences.edit().putBoolean("common.homePageScroll", true).commit()
            gesture(false, true); assertFalse(online.getBoolean(activity))
            gesture(false); assertTrue(online.getBoolean(activity))
            preferences.edit().putBoolean("common.homePageScroll", false).commit()
            gesture(true); assertTrue(online.getBoolean(activity))
            preferences.edit().putBoolean("common.homePageScroll", true).commit()
            gesture(true); assertFalse(online.getBoolean(activity))
        } finally {
            instrumentation.runOnMainSync { activity.finish() }
            preferences.edit().apply { saved.forEach { (key, value) -> if (value is Boolean) putBoolean(key, value) else remove(key) } }.commit()
        }
    }
}
