package cn.toside.music.nativeapp.ui

import android.app.Dialog
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Switch
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.player.PlaybackService
import cn.toside.music.nativeapp.source.SourceHttpFixture
import kotlinx.coroutines.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class SettingsDialogTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val noActions = SettingsActions({}, { _, _ -> }, {}, {}, {}, {}, {})
    private fun field(activity: MainActivity, name: String): Any? = MainActivity::class.java.getDeclaredField(name).apply { isAccessible = true }.get(activity)
    private fun invoke(activity: MainActivity, method: String) = MainActivity::class.java.getDeclaredMethod(method).apply { isAccessible = true }.invoke(activity)
    private fun descendants(view: View): List<View> = listOf(view) + if (view is ViewGroup) (0 until view.childCount).flatMap { descendants(view.getChildAt(it)) } else emptyList()
    private fun start(): MainActivity {
        var activity = instrumentation.startActivitySync(Intent(instrumentation.targetContext, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        await {
            ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED).filterIsInstance<MainActivity>().firstOrNull()?.let { activity = it }
            !activity.isDestroyed && field(activity, "service") != null
        }
        return activity
    }
    private fun await(check: () -> Boolean) {
        repeat(150) {
            var done = false
            instrumentation.runOnMainSync { done = check() }
            if (done) return
            SystemClock.sleep(50)
        }
        throw AssertionError("Timed out waiting for settings")
    }
    private fun measure(view: View, width: Int, height: Int) {
        val density = view.resources.displayMetrics.density
        val w = (width * density).toInt(); val h = (height * density).toInt()
        repeat(2) { view.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY)); view.layout(0, 0, w, h) }
    }
    private fun capture(name: String, view: View) {
        if (InstrumentationRegistry.getArguments().getString("adaptiveScreenshots") != "true") return
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888).also { view.draw(Canvas(it)) }
        val output = InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")
        val directory = File(output?.let(::File) ?: instrumentation.targetContext.getExternalFilesDir(null), "settings-validation").apply { mkdirs() }
        File(directory, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }; bitmap.recycle()
    }
    @Test fun categoriesAndControlsFitPhoneTabletAndShortWindows() {
        val activity = start()
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        try {
            listOf(AdaptiveLayout(360, 800), AdaptiveLayout(600, 800), AdaptiveLayout(1024, 768), AdaptiveLayout(640, 360)).forEach { layout ->
                lateinit var root: View
                instrumentation.runOnMainSync {
                    val dialog = SettingsDialog(activity, scope, { field(activity, "service") as? PlaybackService }, noActions, layout) {}
                    root = dialog.createContent()
                }
                listOf("basic", "playback", "sources", "list", "theme", "cache", "sync", "about").forEach { category ->
                    instrumentation.runOnMainSync {
                        descendants(root).first { it.tag == "settings-category-$category" }.performClick()
                    }
                    if (category == "sources") await { (descendants(root).first { it.tag == "settings-source-list" } as ViewGroup).childCount > 0 }
                    instrumentation.runOnMainSync {
                        measure(root, layout.widthDp, layout.heightDp)
                        assertEquals(layout.expanded, descendants(root).any { it.tag == "settings-sidebar" })
                        assertEquals(!layout.expanded, descendants(root).any { it.tag == "settings-tabs" })
                        val content = descendants(root).first { it.tag == "settings-content" } as ViewGroup
                        assertTrue(content.height > 150 * activity.resources.displayMetrics.density)
                        descendants(content).filter { it.visibility == View.VISIBLE }.forEach { child ->
                            val parent = child.parent as? ViewGroup
                            if (parent != null) assertTrue("$category ${child.tag} must fit parent", child.left >= 0 && child.right <= parent.width)
                        }
                        if (category == "sources") {
                            val input = descendants(root).filterIsInstance<EditText>().single()
                            assertTrue(input.width > 150 * activity.resources.displayMetrics.density)
                            assertEquals(1, input.maxLines)
                        }
                        if (category in listOf("basic", "sources")) capture("${layout.widthDp}x${layout.heightDp}-$category", root)
                    }
                }
            }
        } finally { scope.cancel(); instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun categoryAndSourceDraftSurviveRecreation() {
        var activity = start()
        try {
            instrumentation.runOnMainSync { invoke(activity, "showSources") }
            var dialog = field(activity, "settingsDialog") as SettingsDialog
            instrumentation.runOnMainSync {
                (descendants(dialog.window!!.decorView).first { it.tag == "settings-source-url" } as EditText).setText("https://example.org/draft.js")
            }
            val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
            instrumentation.runOnMainSync { activity.recreate() }
            activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
            instrumentation.removeMonitor(monitor)
            await { (field(activity, "settingsDialog") as? Dialog)?.isShowing == true }
            dialog = field(activity, "settingsDialog") as SettingsDialog
            instrumentation.runOnMainSync {
                val root = dialog.window!!.decorView
                assertTrue(descendants(root).first { it.tag == "settings-category-sources" }.isSelected)
                assertEquals("https://example.org/draft.js", (descendants(root).first { it.tag == "settings-source-url" } as EditText).text.toString())
                assertEquals("sources", dialog.saveState().getString("category"))
                dialog.dismiss()
            }
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun onlineImportReportsFailureAllowsRetryAndRefreshesEnabledSource() = runBlocking {
        val activity = start()
        val player = field(activity, "service") as PlaybackService
        val before = player.sourceCatalog()
        try {
            SourceHttpFixture().use { server ->
                instrumentation.runOnMainSync { invoke(activity, "showSources") }
                val dialog = field(activity, "settingsDialog") as SettingsDialog
                val root = dialog.window!!.decorView
                await { (descendants(root).first { it.tag == "settings-source-list" } as ViewGroup).childCount > 0 }
                if (before.selected == null) instrumentation.runOnMainSync {
                    assertFalse(descendants(root).filterIsInstance<TextView>().any { it.text.toString() == activity.getString(R.string.settings_selected) })
                }
                fun submit(url: String) { instrumentation.runOnMainSync {
                    (descendants(root).first { it.tag == "settings-source-url" } as EditText).setText(url)
                    descendants(root).first { it.tag == "settings-source-import" }.performClick()
                } }
                submit("${server.address}/missing")
                await { (descendants(root).first { it.tag == "settings-source-status" } as TextView).text.contains("404") }
                instrumentation.runOnMainSync { assertTrue(descendants(root).first { it.tag == "settings-source-import" }.isEnabled) }
                assertEquals(before.selected, player.sourceCatalog().selected)
                submit("${server.address}/script")
                await { (descendants(root).first { it.tag == "settings-source-status" } as TextView).text.toString() == activity.getString(R.string.settings_source_success) }
                await { descendants(root).filterIsInstance<TextView>().any { it.text.toString() == "Settings import fixture" } }
                val after = player.sourceCatalog()
                assertEquals("Settings import fixture", after.entries.first { it.id == after.selected }.name)
                instrumentation.runOnMainSync {
                    assertEquals(1, descendants(root).filterIsInstance<TextView>().count { it.text.startsWith(activity.getString(R.string.settings_selected)) })
                    assertEquals("", (descendants(root).first { it.tag == "settings-source-url" } as EditText).text.toString())
                    dialog.dismiss()
                }
            }
        } finally {
            player.sourceCatalog().entries.filter { entry -> before.entries.none { it.id == entry.id } }.forEach { player.removeSource(it.id) }
            player.selectSource(before.selected)
            instrumentation.runOnMainSync { activity.finish() }
        }
    }
    @Test fun pendingImportStaysBusyAcrossCategoriesAndIsCancelledWhenClosed() = runBlocking {
        val activity = start()
        val player = field(activity, "service") as PlaybackService
        val before = player.sourceCatalog()
        try {
            SourceHttpFixture().use { server ->
                instrumentation.runOnMainSync { invoke(activity, "showSources") }
                val dialog = field(activity, "settingsDialog") as SettingsDialog
                val root = dialog.window!!.decorView
                instrumentation.runOnMainSync {
                    (descendants(root).first { it.tag == "settings-source-url" } as EditText).setText("${server.address}/slow")
                    descendants(root).first { it.tag == "settings-source-import" }.performClick()
                    assertFalse(descendants(root).first { it.tag == "settings-source-import" }.isEnabled)
                    assertFalse(descendants(root).first { it.tag == "settings-source-local-import" }.isEnabled)
                    descendants(root).first { it.tag == "settings-category-basic" }.performClick()
                    descendants(root).first { it.tag == "settings-category-sources" }.performClick()
                    assertFalse(descendants(root).first { it.tag == "settings-source-import" }.isEnabled)
                    assertFalse(descendants(root).first { it.tag == "settings-source-url" }.isEnabled)
                    dialog.dismiss()
                }
            }
            assertEquals(before.selected, player.sourceCatalog().selected)
            assertEquals(before.entries.map { it.id }, player.sourceCatalog().entries.map { it.id })
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
    @Test fun closingSettingsAppliesThemeAndRecreatesTheActivity() {
        val preferences = instrumentation.targetContext.getSharedPreferences("app-settings", 0)
        val saved = listOf("theme.id", "theme.darkId", "theme.lightId", "common.isAutoTheme").associateWith { preferences.all[it] }
        var activity = start()
        try {
            instrumentation.runOnMainSync { invoke(activity, "showSettings") }
            val dialog = field(activity, "settingsDialog") as SettingsDialog
            val target = if ((field(activity, "palette") as UiPalette).theme.id == "blue") "green" else "blue"
            instrumentation.runOnMainSync {
                preferences.edit().putBoolean("common.isAutoTheme", false).putString("theme.id", target).commit()
            }
            val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
            instrumentation.runOnMainSync { dialog.dismiss() }
            activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
            instrumentation.removeMonitor(monitor)
            await { !activity.isDestroyed && field(activity, "service") != null }
            assertEquals(target, (field(activity, "palette") as UiPalette).theme.id)
            assertFalse((field(activity, "settingsDialog") as? Dialog)?.isShowing == true)
        } finally {
            instrumentation.runOnMainSync { activity.finish() }
            preferences.edit().apply { saved.forEach { (key, value) -> when (value) { is String -> putString(key, value); is Boolean -> putBoolean(key, value); else -> remove(key) } } }.commit()
        }
    }
    @Test fun darkEnglishLargeFontsAndTogglePersistenceRemainUsable() {
        val preferences = instrumentation.targetContext.getSharedPreferences("app-settings", 0)
        val keys = listOf("common.langId", "common.fontScale", "theme.id", "common.isAutoTheme", "player.startupAutoPlay")
        val saved = keys.associateWith { preferences.all[it] }
        preferences.edit().putString("common.langId", "en").putString("common.fontScale", "1.3").putString("theme.id", "black").putBoolean("common.isAutoTheme", false).commit()
        var activity: MainActivity? = null
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        try {
            val current = start(); activity = current
            instrumentation.runOnMainSync {
                assertEquals("Settings", current.getString(R.string.settings_title))
                val dialog = SettingsDialog(current, scope, { null }, noActions, AdaptiveLayout(360, 800), Bundle().apply { putString("category", "playback") }) {}
                val root = dialog.createContent(); measure(root, 360, 800)
                val toggle = descendants(root).filterIsInstance<Switch>().first { it.tag == "settings-player.startupAutoPlay" }
                val old = toggle.isChecked; toggle.performClick()
                assertEquals(!old, preferences.getBoolean("player.startupAutoPlay", false))
                descendants(root).first { it.tag == "settings-category-basic" }.performClick(); measure(root, 360, 800)
                capture("360-dark-english-basic", root)
                descendants(root).first { it.tag == "settings-category-sources" }.performClick(); measure(root, 360, 800)
                val button = descendants(root).first { it.tag == "settings-source-import" } as TextView
                assertEquals("Import from URL", button.text.toString()); assertTrue(button.width > 0)
                capture("360-dark-english-sources", root)
            }
        } finally {
            scope.cancel(); activity?.let { instrumentation.runOnMainSync { it.finish() } }
            preferences.edit().apply { saved.forEach { (key, value) -> when (value) { is String -> putString(key, value); is Boolean -> putBoolean(key, value); else -> remove(key) } } }.commit()
        }
    }
}
