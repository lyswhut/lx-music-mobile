package cn.toside.music.nativeapp.ui

import android.app.AlertDialog
import android.app.Dialog
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ListView
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import cn.toside.music.nativeapp.data.Song
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** Run at phone and tablet window sizes; assertions exercise actual measured views. */
@RunWith(AndroidJUnit4::class)
class AdaptiveLayoutTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private fun start(): MainActivity {
        var activity = instrumentation.startActivitySync(Intent(instrumentation.targetContext, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        repeat(100) {
            instrumentation.waitForIdleSync()
            instrumentation.runOnMainSync {
                ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED).filterIsInstance<MainActivity>()
                    .firstOrNull()?.let { activity = it }
            }
            if (!activity.isDestroyed && field(activity, "service") != null) return activity
            SystemClock.sleep(100)
        }
        assertNotNull(field(activity, "service"))
        return activity
    }
    private fun field(activity: MainActivity, name: String): Any? = MainActivity::class.java.getDeclaredField(name).apply { isAccessible = true }.get(activity)
    private fun invoke(activity: MainActivity, name: String) = MainActivity::class.java.getDeclaredMethod(name).apply { isAccessible = true }.invoke(activity)
    private fun descendants(view: View): List<View> = listOf(view) + if (view is ViewGroup) (0 until view.childCount).flatMap { descendants(view.getChildAt(it)) } else emptyList()
    private fun writeSnapshot(name: String, view: View) {
        if (InstrumentationRegistry.getArguments().getString("adaptiveScreenshots") != "true") return
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888).also { view.draw(Canvas(it)) }
        val directory = File(instrumentation.targetContext.getExternalFilesDir(null), "adaptive-validation").apply { mkdirs() }
        File(directory, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }
    private fun capture(name: String, activity: MainActivity) {
        if (InstrumentationRegistry.getArguments().getString("adaptiveScreenshots") != "true") return
        SystemClock.sleep(300)
        instrumentation.runOnMainSync {
            val dialog = listOf("playerDialog", "syncSettingsDialog").mapNotNull { field(activity, it) as? Dialog }.firstOrNull { it.isShowing }
            writeSnapshot(name, dialog?.window?.decorView ?: activity.window.decorView)
        }
    }
    @Test fun navigationAndSongColumnsFitCurrentWindow() {
        val activity = start()
        try {
            val expanded = activity.resources.configuration.screenWidthDp >= 600
            val root = activity.findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
            assertEquals(if (expanded) "home-expanded" else "home-compact", root.tag)
            assertEquals(expanded, descendants(root).any { it.tag == "home-sidebar" })
            assertEquals(!expanded, descendants(root).any { it.tag == "home-tabs" })
            @Suppress("UNCHECKED_CAST") val navigation = field(activity, "navigationItems") as Map<Int, TextView>
            instrumentation.runOnMainSync {
                val searchItem = navigation.getValue(1)
                (if (expanded) searchItem.parent as View else searchItem).performClick()
                assertEquals(true, field(activity, "onlineMode")); assertTrue(searchItem.isSelected)
                val songs = (1L..12L).map { Song(it, Uri.EMPTY, "示例歌曲 $it · A song with a long title", "示例歌手 Artist", 215000, "kw", """{"albumName":"示例专辑 Album"}""") }
                MainActivity::class.java.getDeclaredField("allSongs").apply { isAccessible = true }.set(activity, songs)
                invoke(activity, "filterSongs")
            }
            instrumentation.waitForIdleSync()
            val list = field(activity, "list") as ListView
            assertEquals(12, list.adapter.count)
            val row = list.getChildAt(0) as ViewGroup
            assertTrue(row.width > 0); assertTrue(row.right <= list.width)
            val action = row.getChildAt(row.childCount - 1)
            assertTrue(action.width >= (48 * activity.resources.displayMetrics.density).toInt())
            assertTrue(action.right <= row.width)
            assertEquals(expanded, descendants(root).any { it.tag == "song-table-header" })
            capture(if (expanded) "tablet-list" else "phone-list", activity)
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun playerPanesFitAndRemainOpenAfterRecreation() {
        var activity = start()
        try {
            instrumentation.runOnMainSync { invoke(activity, "showPlayerDetails") }
            instrumentation.waitForIdleSync()
            val split = activity.resources.configuration.let { it.screenWidthDp >= 600 && it.screenHeightDp >= 480 }
            val cover = field(activity, "detailCover") as ViewGroup
            val lyrics = field(activity, "detailScroll") as View
            if (split) {
                assertEquals(View.VISIBLE, cover.visibility); assertEquals(View.VISIBLE, lyrics.visibility)
                val coverPosition = IntArray(2); val lyricPosition = IntArray(2)
                cover.getLocationOnScreen(coverPosition); lyrics.getLocationOnScreen(lyricPosition)
                assertTrue(coverPosition[0] + cover.width <= lyricPosition[0])
            } else {
                assertEquals(View.GONE, lyrics.visibility)
                instrumentation.runOnMainSync { invoke(activity, "toggleDetailPage") }
                assertEquals(View.VISIBLE, lyrics.visibility); assertEquals(View.GONE, cover.visibility)
            }
            val album = cover.getChildAt(0)
            assertTrue(album.width <= cover.width); assertTrue(album.height <= cover.height)
            capture(if (split) "tablet-player" else "phone-player", activity)
            val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
            instrumentation.runOnMainSync { activity.recreate() }
            activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
            instrumentation.removeMonitor(monitor)
            repeat(50) {
                instrumentation.waitForIdleSync()
                if ((field(activity, "playerDialog") as? Dialog)?.isShowing == true) return@repeat
                SystemClock.sleep(100)
            }
            assertTrue((field(activity, "playerDialog") as? Dialog)?.isShowing == true)
            assertEquals(View.VISIBLE, (field(activity, "detailScroll") as View).visibility)
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun syncFormHasLabeledFieldsAndFitsWindow() {
        val activity = start()
        try {
            instrumentation.runOnMainSync { invoke(activity, "showSyncSettings") }
            instrumentation.waitForIdleSync()
            val dialog = field(activity, "syncSettingsDialog") as AlertDialog
            val inputs = descendants(dialog.window!!.decorView).filterIsInstance<EditText>()
            assertEquals(2, inputs.size); assertTrue(inputs.all { !it.contentDescription.isNullOrBlank() && it.width > 0 })
            val width = dialog.window!!.decorView.width
            assertTrue(width <= activity.window.decorView.width)
            assertTrue(width <= (560 * activity.resources.displayMetrics.density).toInt())
            capture(if (activity.resources.configuration.screenWidthDp >= 600) "tablet-sync" else "phone-sync", activity)
            instrumentation.runOnMainSync { dialog.dismiss() }
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun darkThemeEnglishLargeFontsAndRightNavigationStayUsable() {
        val preferences = instrumentation.targetContext.getSharedPreferences("app-settings", 0)
        val keys = listOf("theme.id", "common.isAutoTheme", "common.drawerLayoutPosition", "common.fontScale", "common.langId", "list.isShowAlbumName")
        val saved = keys.associateWith { preferences.all[it] }
        preferences.edit().putString("theme.id", "black").putBoolean("common.isAutoTheme", false)
            .putString("common.drawerLayoutPosition", "right").putString("common.fontScale", "1.3")
            .putString("common.langId", "en").putBoolean("list.isShowAlbumName", true).commit()
        var activity: MainActivity? = null
        try {
            val current = start(); activity = current
            val root = current.findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
            val palette = field(current, "palette") as UiPalette
            assertTrue(palette.theme.dark)
            assertEquals("Search", current.getString(cn.toside.music.nativeapp.R.string.layout_search))
            if (current.resources.configuration.screenWidthDp >= 600) {
                val sidebar = descendants(root).first { it.tag == "home-sidebar" }
                val list = field(current, "list") as View
                val sidebarPosition = IntArray(2); val listPosition = IntArray(2)
                sidebar.getLocationOnScreen(sidebarPosition); list.getLocationOnScreen(listPosition)
                assertTrue(listPosition[0] + list.width <= sidebarPosition[0])
            }
            instrumentation.runOnMainSync { invoke(current, "showPlayerDetails") }
            instrumentation.waitForIdleSync()
            val dialog = field(current, "playerDialog") as Dialog
            val buttons = descendants(dialog.window!!.decorView).filterIsInstance<TextView>().filter { it.text.toString() in listOf("Sleep timer", "Play queue") }
            assertTrue(buttons.isNotEmpty()); assertTrue(buttons.all { it.width > 0 })
            assertTrue(buttons.all { it.lineCount == 1 })
            capture(if (current.resources.configuration.screenWidthDp >= 600) "tablet-dark-player" else "phone-dark-player", current)
        } finally {
            activity?.let { instrumentation.runOnMainSync { it.finish() } }
            preferences.edit().apply { saved.forEach { (key, value) -> when (value) {
                is String -> putString(key, value); is Boolean -> putBoolean(key, value); else -> remove(key)
            } } }.commit()
        }
    }
    @Test fun phoneAndTabletViewsMeasureAndDrawAtFullWindowSizes() {
        val activity = start()
        try {
            // Measure actual Android Views offscreen: TV firmware cannot host a portrait Activity.
            listOf(AdaptiveLayout(360, 800), AdaptiveLayout(600, 800), AdaptiveLayout(1024, 768)).forEach { layout ->
                instrumentation.runOnMainSync {
                    MainActivity::class.java.getDeclaredField("uiLayout").apply { isAccessible = true }.set(activity, layout)
                    invoke(activity, "buildUi")
                    MainActivity::class.java.getDeclaredMethod("openSearchPage", Boolean::class.javaPrimitiveType).apply { isAccessible = true }.invoke(activity, false)
                    val songs = (1L..12L).map { Song(it, Uri.EMPTY, "示例歌曲 $it · A song with a long title", "示例歌手 Artist", 215000, "kw", """{"albumName":"示例专辑 Album"}""") }
                    MainActivity::class.java.getDeclaredField("allSongs").apply { isAccessible = true }.set(activity, songs)
                    invoke(activity, "filterSongs")
                    val density = activity.resources.displayMetrics.density
                    val width = (layout.widthDp * density).toInt(); val height = (layout.heightDp * density).toInt()
                    fun measure(view: View) {
                        repeat(2) {
                            view.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY))
                            view.layout(0, 0, width, height)
                        }
                    }
                    val root = activity.findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
                    measure(root)
                    val list = field(activity, "list") as ListView
                    assertTrue("The song list must have usable height", list.height > 200 * density)
                    assertEquals(layout.expanded, descendants(root).any { it.tag == "home-sidebar" })
                    assertTrue((field(activity, "miniBar") as View).bottom <= height)
                    assertNotNull(list.getChildAt(0))
                    writeSnapshot("measured-${layout.widthDp}-list", root)
                    invoke(activity, "showPlayerDetails")
                    val dialog = field(activity, "playerDialog") as Dialog
                    val content = dialog.findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
                    measure(content)
                    val cover = field(activity, "detailCover") as ViewGroup
                    val album = cover.getChildAt(0)
                    assertTrue(album.width >= 100 * density); assertTrue(album.height >= 100 * density)
                    assertTrue(album.width <= cover.width); assertTrue(album.height <= cover.height)
                    assertEquals(if (layout.splitPlayer) View.VISIBLE else View.GONE, (field(activity, "detailScroll") as View).visibility)
                    writeSnapshot("measured-${layout.widthDp}-player", content)
                    dialog.dismiss()
                }
            }
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
}
