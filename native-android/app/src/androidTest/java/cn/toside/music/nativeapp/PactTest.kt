package cn.toside.music.nativeapp

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PactTest {
    @Test fun firstUseDefersServicesAndDeepLinksUntilAgreementAndDecliningDoesNotAccept() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation(); val context = instrumentation.targetContext
        val preferences = AppPreferences(context)
        val agreed = preferences.bool("common.isAgreePact")
        val startup = preferences.startupAutoPlay
        val service = MainActivity::class.java.getDeclaredField("service").apply { isAccessible = true }
        val pact = MainActivity::class.java.getDeclaredField("pactDialog").apply { isAccessible = true }
        val incoming = MainActivity::class.java.getDeclaredField("incomingHandled").apply { isAccessible = true }
        fun open() = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).setAction(Intent.ACTION_VIEW)
            .setData(Uri.parse("lxmusic://player/pause")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        var activity: MainActivity? = null
        try {
            preferences.set("common.isAgreePact", false); preferences.set("player.startupAutoPlay", false)
            activity = open()
            val rejected = pact.get(activity) as AlertDialog
            assertTrue(rejected.isShowing); assertNull(service.get(activity)); assertFalse(incoming.getBoolean(activity))
            assertFalse(rejected.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled)
            instrumentation.runOnMainSync { rejected.getButton(AlertDialog.BUTTON_NEGATIVE).performClick() }
            withTimeout(5000) { while (!activity!!.isDestroyed) delay(50) }
            assertFalse(preferences.bool("common.isAgreePact"))
            activity = open(); val accepting = pact.get(activity) as AlertDialog
            withTimeout(25_000) { while (!accepting.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled) delay(50) }
            instrumentation.runOnMainSync { accepting.getButton(AlertDialog.BUTTON_POSITIVE).performClick() }
            withTimeout(10_000) { while (service.get(activity) == null || !incoming.getBoolean(activity)) delay(50) }
            assertTrue(preferences.bool("common.isAgreePact")); assertFalse(accepting.isShowing)
            val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
            instrumentation.runOnMainSync { activity!!.recreate() }
            activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
            assertNull(pact.get(activity))
        } finally {
            instrumentation.runOnMainSync { activity?.finish() }
            preferences.set("common.isAgreePact", agreed); preferences.set("player.startupAutoPlay", startup)
        }
    }
}
