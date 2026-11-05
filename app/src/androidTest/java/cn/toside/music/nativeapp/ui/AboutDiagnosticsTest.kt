package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.source.UserSource
import cn.toside.music.nativeapp.update.NativeReleases
import cn.toside.music.nativeapp.utils.DiagnosticLog

import android.app.AlertDialog
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class AboutDiagnosticsTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val target get() = instrumentation.targetContext
    @Test fun logsAreOrderedBoundedRedactedAndRespectSourceAndSyncSwitches() = runBlocking {
        val name = "diagnostics-test-${System.nanoTime()}"
        val directory = File(target.cacheDir, name).apply { mkdirs() }
        val context = object : ContextWrapper(target) {
            override fun getFilesDir(): File = directory
            override fun getSharedPreferences(value: String, mode: Int) = super.getSharedPreferences(if (value == "app-settings") name else value, mode)
        }
        val log = DiagnosticLog(context)
        try {
            log.record("sync", "hidden sync"); log.record("source", "hidden source")
            assertEquals("", log.read())
            AppPreferences(context).set(DiagnosticLog.SYNC, true); AppPreferences(context).set(DiagnosticLog.SOURCE, true)
            log.record("sync", "connected", "INFO")
            log.record("source", "https://example.com/p?token=url-secret token=token-secret Cookie=MUSIC_U=cookie-secret Authorization: Bearer bearer-secret")
            val text = log.read()
            listOf("url-secret", "token-secret", "cookie-secret", "bearer-secret", "example.com").forEach { assertFalse("must redact $it", text.contains(it)) }
            assertTrue(text.contains("connected")); assertTrue(text.contains("[URL]"))
            log.clear(); assertEquals("", log.read())
            repeat(220) { log.record("app", "entry-$it " + "x".repeat(2000)) }
            val recent = log.read()
            assertTrue(recent.substringBefore("\n\n").contains("entry-219 "))
            assertTrue(recent.contains("entry-219 ")); assertFalse(recent.contains("entry-0 "))
            assertTrue(File(directory, "diagnostics.json").length() <= DiagnosticLog.MAX_BYTES)
            assertTrue(JSONArray(File(directory, "diagnostics.json").readText()).length() <= DiagnosticLog.MAX_ENTRIES)
            assertEquals(recent, DiagnosticLog(context).read())
            log.clear(); assertEquals("", log.read())
            val source = UserSource(context)
            try {
                source.import("""
                    /** @name Diagnostic fixture */
                    console.warn('source console token=script-secret');
                    lx.on(lx.EVENT_NAMES.request, async () => 'https://example.org/test.mp3');
                    lx.send(lx.EVENT_NAMES.inited, {sources:{kw:{type:'music',actions:['musicUrl'],qualitys:['128k']}}});
                """.trimIndent())
                val scriptLog = log.read()
                assertTrue(scriptLog.contains("source console")); assertFalse(scriptLog.contains("script-secret"))
            } finally { source.close() }
        } finally { log.clear(); directory.deleteRecursively(); target.deleteSharedPreferences(name) }
    }
    @Test fun updateChannelIgnoresReactNativeDraftPreviewAndNonApkReleases() {
        fun release(tag: String, asset: String = "lx-music-native-universal.apk") = JSONObject().put("tag_name", tag)
            .put("assets", JSONArray().put(JSONObject().put("name", asset)))
            .put("body", "release notes").put("html_url", "https://untrusted.invalid/")
        val data = JSONArray().put(release("v999.0.0")).put(release("native-v0.2.0"))
            .put(release("native-v0.10.0")).put(release("native-v99.0.0").put("draft", true))
            .put(release("native-v98.0.0").put("prerelease", true)).put(release("native-v97.0.0", "app-release.apk"))
            .put(release("native-v96.0.0-beta"))
        val latest = NativeReleases.parse(data.toString())!!
        assertEquals("0.10.0", latest.version)
        assertEquals("${NativeReleases.PAGE}/tag/native-v0.10.0", latest.url)
        assertEquals("release notes", latest.notes)
        assertTrue(NativeReleases.compare("0.10.0", "0.9.9") > 0)
        assertNull(NativeReleases.parse(JSONArray().put(release("v2.0.0")).toString()))
    }
    @Test fun nativeFontPreferencePreservesSystemScaleAndAboutShowsInstalledVersionAndLicense() {
        val settings = target.getSharedPreferences("app-settings", 0)
        val original = settings.getString("common.fontScale", null)
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        var activity: MainActivity? = null
        try {
            settings.edit().putString("common.fontScale", "1.3").commit()
            val base = target.resources.configuration.fontScale
            assertEquals(base * 1.3f, UiPreferences.context(target).resources.configuration.fontScale, 0.01f)
            activity = instrumentation.startActivitySync(Intent(target, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
            instrumentation.runOnMainSync { showAbout(activity!!, scope) }
            instrumentation.waitForIdleSync()
            var root: android.view.accessibility.AccessibilityNodeInfo? = null
            repeat(50) {
                if (root?.findAccessibilityNodeInfosByText("关于与版本").isNullOrEmpty()) {
                    android.os.SystemClock.sleep(100)
                    root = instrumentation.uiAutomation.rootInActiveWindow
                }
            }
            assertTrue(root?.findAccessibilityNodeInfosByText("关于与版本")?.isNotEmpty() == true)
            assertTrue(root?.findAccessibilityNodeInfosByText("版本：0.1.0")?.isNotEmpty() == true)
            assertTrue(target.assets.open("licenses/Apache-2.0.txt").use { it.readBytes().toString(Charsets.UTF_8) }.contains("Apache License"))
            instrumentation.uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
        } finally {
            instrumentation.runOnMainSync { activity?.finish() }; scope.cancel()
            settings.edit().apply { if (original == null) remove("common.fontScale") else putString("common.fontScale", original) }.commit()
        }
    }
}
