package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences

import android.app.Activity
import android.app.AlertDialog
import android.text.util.Linkify
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** The original project's agreement text and first-use acknowledgement. */
internal fun showPact(activity: Activity, scope: CoroutineScope, accepted: (() -> Unit)? = null): AlertDialog {
    val preferences = AppPreferences(activity)
    val agreed = preferences.bool("common.isAgreePact")
    val text = activity.assets.open("licenses/project-agreement.txt").use { it.readBytes().toString(Charsets.UTF_8) }
    val body = TextView(activity).apply { setText(text); setTextIsSelectable(true); setPadding(24, 16, 24, 16); autoLinkMask = Linkify.WEB_URLS }
    var job: Job? = null
    val dialog = AlertDialog.Builder(activity).setTitle(activity.getString(R.string.pact_title))
        .setView(ScrollView(activity).apply { addView(body) }).setCancelable(agreed)
        .setPositiveButton(activity.getString(if (agreed) R.string.ui_2cd0f3be8738 else R.string.pact_accept)) { _, _ ->
            if (!agreed) { preferences.set("common.isAgreePact", true); accepted?.invoke() }
        }.apply { if (!agreed) setNegativeButton(activity.getString(R.string.pact_reject)) { _, _ -> activity.finishAndRemoveTask() } }
        .create()
    dialog.setOnDismissListener { job?.cancel() }
    dialog.setOnShowListener {
        if (!agreed) {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE); button.isEnabled = false
            job = scope.launch {
                for (seconds in 20 downTo 1) { button.text = activity.getString(R.string.pact_countdown, seconds); delay(1000) }
                button.text = activity.getString(R.string.pact_accept); button.isEnabled = true
            }
        }
    }
    dialog.show(); return dialog
}
