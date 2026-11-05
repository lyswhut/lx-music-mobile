package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.utils.PermissionPolicy

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
    private val permissionPackages = setOf("com.android.permissioncontroller", "com.google.android.permissioncontroller",
        "com.android.packageinstaller", "com.google.android.packageinstaller")
    private fun waitUntil(condition: () -> Boolean): Boolean {
        val deadline = SystemClock.elapsedRealtime() + 5000
        while (!condition()) {
            if (SystemClock.elapsedRealtime() >= deadline) return false
            SystemClock.sleep(100)
        }
        return true
    }
    private fun permissionButton(allow: Boolean): AccessibilityNodeInfo? {
        val root = InstrumentationRegistry.getInstrumentation().uiAutomation.rootInActiveWindow ?: return null
        if (root.packageName?.toString() !in permissionPackages) return null
        val name = if (allow) "permission_allow_button" else "permission_deny_button"
        // Android 9 uses PackageInstaller; Android 10+ uses PermissionController.
        for (namespace in permissionPackages) {
            root.findAccessibilityNodeInfosByViewId("$namespace:id/$name").firstOrNull { it.isEnabled }?.let { return it }
        }
        val labels = if (allow) listOf("允许", "允許", "Allow", "ALLOW") else listOf("不允许", "不允許", "Deny", "DENY")
        return labels.asSequence().flatMap { root.findAccessibilityNodeInfosByText(it).asSequence() }
            .firstOrNull { it.isEnabled && it.isClickable }
    }
    private fun choosePermission(allow: Boolean): Boolean {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        return waitUntil {
            // Reacquire nodes on every attempt; Android 9 replaces the dialog during its animation.
            (allow && context.checkSelfPermission(PermissionPolicy.audio(Build.VERSION.SDK_INT)) == PackageManager.PERMISSION_GRANTED) ||
                permissionButton(allow)?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true
        }
    }
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
            assertTrue("点击本地音乐后应能拒绝系统权限请求", choosePermission(false))
            assertTrue(waitUntil { status.text.toString().contains("重试") })
            instrumentation.waitForIdleSync()
            assertEquals(PackageManager.PERMISSION_DENIED, context.checkSelfPermission(permission))
            assertTrue(status.text.toString().contains("重试"))
            instrumentation.runOnMainSync { status.performClick() }
            assertTrue("点击允许按钮应成功", choosePermission(true))
            assertTrue(waitUntil { context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED })
            assertEquals(PackageManager.PERMISSION_GRANTED, context.checkSelfPermission(permission))
        } finally {
            if (instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() in permissionPackages) {
                instrumentation.uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
                waitUntil { instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() !in permissionPackages }
            }
            preferences.edit().apply { if (hadHistory) putBoolean("audio-requested", oldHistory) else remove("audio-requested") }.commit()
            instrumentation.runOnMainSync { activity.finish() }
        }
    }
}
