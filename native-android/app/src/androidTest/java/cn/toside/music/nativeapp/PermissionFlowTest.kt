package cn.toside.music.nativeapp

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PermissionFlowTest {
    @Test fun localAudioPermissionIsRequestedOnlyAfterUserAction() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val permission = PermissionPolicy.audio(Build.VERSION.SDK_INT)
        assumeTrue(context.checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED)
        val activity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        val preferences = context.getSharedPreferences("permission-history", 0)
        val hadHistory = preferences.contains("audio-requested")
        val oldHistory = preferences.getBoolean("audio-requested", false)
        try {
            val field = MainActivity::class.java.getDeclaredField("status").apply { isAccessible = true }
            val status = field.get(activity) as TextView
            assertTrue(status.text.toString().contains("点击这里"))
            assertEquals(PackageManager.PERMISSION_DENIED, context.checkSelfPermission(permission))
            repeat(50) {
                if (instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() != context.packageName) SystemClock.sleep(100)
            }
            assertEquals(context.packageName, instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString())
            // Ensure the first-use path is exercised without changing the device's permission flags.
            preferences.edit().remove("audio-requested").commit()
            instrumentation.runOnMainSync { status.performClick() }
            var deny: AccessibilityNodeInfo? = null
            repeat(50) {
                if (deny == null) {
                    val root = instrumentation.uiAutomation.rootInActiveWindow
                    deny = root?.findAccessibilityNodeInfosByViewId("com.android.permissioncontroller:id/permission_deny_button")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("不允许")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("Deny")?.firstOrNull()
                    if (deny == null) SystemClock.sleep(100)
                }
            }
            assertTrue("点击本地音乐后应显示系统权限请求", deny != null)
            assertTrue(deny!!.performAction(AccessibilityNodeInfo.ACTION_CLICK))
            repeat(50) { if (!status.text.toString().contains("重试")) SystemClock.sleep(100) }
            instrumentation.waitForIdleSync()
            assertEquals(PackageManager.PERMISSION_DENIED, context.checkSelfPermission(permission))
            assertTrue(status.text.toString().contains("重试"))
            instrumentation.runOnMainSync { status.performClick() }
            var allow: AccessibilityNodeInfo? = null
            repeat(50) {
                if (allow == null) {
                    val root = instrumentation.uiAutomation.rootInActiveWindow
                    allow = root?.findAccessibilityNodeInfosByViewId("com.android.permissioncontroller:id/permission_allow_button")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("允许")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("Allow")?.firstOrNull()
                    if (allow == null) SystemClock.sleep(100)
                }
            }
            assertTrue("重试应再次显示系统权限请求", allow != null)
            // PermissionController may replace its window during the second request animation.
            // Reacquire the node rather than clicking a stale accessibility snapshot.
            var clicked = false
            repeat(50) {
                if (!clicked) {
                    val root = instrumentation.uiAutomation.rootInActiveWindow
                    val current = root?.findAccessibilityNodeInfosByViewId("com.android.permissioncontroller:id/permission_allow_button")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("允许")?.firstOrNull()
                        ?: root?.findAccessibilityNodeInfosByText("Allow")?.firstOrNull()
                    clicked = context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED || current?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true
                    if (!clicked) SystemClock.sleep(100)
                }
            }
            assertTrue("点击允许按钮应成功", clicked)
            repeat(50) { if (context.checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) SystemClock.sleep(100) }
            assertEquals(PackageManager.PERMISSION_GRANTED, context.checkSelfPermission(permission))
        } finally {
            if (instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() == "com.android.permissioncontroller") {
                instrumentation.uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
            }
            preferences.edit().apply { if (hadHistory) putBoolean("audio-requested", oldHistory) else remove("audio-requested") }.commit()
            instrumentation.runOnMainSync { activity.finish() }
        }
    }
}
