package cn.toside.music.nativeapp

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import android.app.DownloadManager
import android.text.format.Formatter
import org.json.JSONArray

internal fun checkNativeUpdatesOnStartup(activity: Activity, scope: CoroutineScope) {
    val settings = AppPreferences(activity)
    if (!settings.bool("version.autoCheck", true)) return
    val now = System.currentTimeMillis(); val previous = settings.string("version.lastCheck", "0").toLongOrNull() ?: 0
    if (now - previous in 0 until 24 * 60 * 60 * 1000L) return
    settings.set("version.lastCheck", now.toString())
    scope.launch {
        try {
            val release = NativeReleases.latest() ?: return@launch
            @Suppress("DEPRECATION") val current = activity.packageManager.getPackageInfo(activity.packageName, 0).versionName.orEmpty()
            if (activity.isFinishing || NativeReleases.compare(release.version, current) <= 0 || settings.string("version.ignored", "") == release.version) return@launch
            AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_936707017ead, release.version)).setMessage(release.notes)
                .setPositiveButton(activity.getString(R.string.update_download)) { _, _ -> scope.launch {
                    try { withContext(Dispatchers.IO) { NativeUpdates(activity).start(release) }; showAbout(activity, scope) }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { android.widget.Toast.makeText(activity, activity.getString(R.string.update_failed, e.localizedMessage.orEmpty()), android.widget.Toast.LENGTH_LONG).show() }
                } }.setNeutralButton(activity.getString(R.string.update_ignore)) { _, _ -> settings.set("version.ignored", release.version) }
                .setNegativeButton(activity.getString(android.R.string.cancel), null).show()
        } catch (e: CancellationException) { throw e }
        catch (e: Exception) { DiagnosticLog(activity).record("update", e.javaClass.simpleName, "INFO") }
    }
}

internal data class NativeRelease(val version: String, val url: String, val notes: String, val apkUrl: String? = null, val size: Long = 0, val digest: String? = null)
internal object NativeReleases {
    const val REPOSITORY = "savet-save/lx-music-android"
    const val PAGE = "https://github.com/$REPOSITORY/releases"
    // Separate tags keep existing React Native releases out of the native update channel.
    internal fun parse(json: String): NativeRelease? {
        val releases = JSONArray(json)
        return (0 until releases.length()).mapNotNull { index ->
            val item = releases.getJSONObject(index)
            val tag = item.optString("tag_name")
            val version = tag.removePrefix("native-v")
            if (!tag.startsWith("native-v") || !version.matches(Regex("\\d{1,5}\\.\\d{1,5}\\.\\d{1,5}")) || item.optBoolean("draft") || item.optBoolean("prerelease")) return@mapNotNull null
            val assets = item.optJSONArray("assets") ?: return@mapNotNull null
            val asset = (0 until assets.length()).mapNotNull { assets.optJSONObject(it) }.firstOrNull {
                it.optString("name").matches(Regex("lx-music-native-[A-Za-z0-9._-]+\\.apk")) && it.optLong("size") in 0..NativeUpdates.MAX_BYTES &&
                    it.optString("state", "uploaded") == "uploaded"
            } ?: return@mapNotNull null
            val digest = asset.optString("digest").takeIf { it.isNotBlank() && it != "null" }
            if (digest != null && !digest.matches(Regex("sha256:[a-fA-F0-9]{64}"))) return@mapNotNull null
            NativeRelease(version, "$PAGE/tag/$tag", item.optString("body").take(32_000),
                "https://github.com/$REPOSITORY/releases/download/$tag/${asset.getString("name")}", asset.optLong("size"), digest)
        }.maxWithOrNull { a, b -> compare(a.version, b.version) }
    }
    internal fun compare(first: String, second: String): Int {
        val a = first.substringBefore('-').split('.').map { it.toIntOrNull() ?: 0 }
        val b = second.substringBefore('-').split('.').map { it.toIntOrNull() ?: 0 }
        return (0 until maxOf(a.size, b.size)).firstNotNullOfOrNull { index ->
            (a.getOrElse(index) { 0 }).compareTo(b.getOrElse(index) { 0 }).takeIf { it != 0 }
        } ?: 0
    }
    suspend fun latest(): NativeRelease? = parse(NativeHttp.text("https://api.github.com/repos/$REPOSITORY/releases?per_page=100",
        headers = mapOf("Accept" to "application/vnd.github+json"), maxBytes = 2 * 1024 * 1024))
}

internal fun showAbout(activity: Activity, scope: CoroutineScope) {
    val work = CoroutineScope(scope.coroutineContext + SupervisorJob(scope.coroutineContext[Job]))
    @Suppress("DEPRECATION")
    val info = activity.packageManager.getPackageInfo(activity.packageName, 0)
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
    content.addView(CheckBox(activity).apply {
        text = activity.getString(R.string.update_auto_check); isChecked = AppPreferences(activity).bool("version.autoCheck", true)
        setOnCheckedChangeListener { _, value -> AppPreferences(activity).set("version.autoCheck", value) }
    })
    content.addView(TextView(activity).apply {
        text = activity.getString(R.string.ui_22425f239f2d, java.lang.String.valueOf(info.versionName), java.lang.String.valueOf(info.longVersionCode))
        setTextIsSelectable(true)
    })
    fun button(label: String, action: () -> Unit) { content.addView(Button(activity).apply { text = label; setOnClickListener { action() } }) }
    fun open(url: String) { runCatching { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }
    button(activity.getString(R.string.pact_title)) { showPact(activity, scope) }
    val status = TextView(activity); content.addView(status)
    val check = Button(activity).apply { text = activity.getString(R.string.ui_4db966cc21a9) }; content.addView(check)
    var opened = true
    var available: NativeRelease? = null
    val updates = NativeUpdates(activity)
    val download = Button(activity).apply { text = activity.getString(R.string.update_download); isEnabled = false }; content.addView(download)
    val install = Button(activity).apply { text = activity.getString(R.string.update_install); isEnabled = false }; content.addView(install)
    val cancel = Button(activity).apply { text = activity.getString(R.string.update_cancel); isEnabled = false }; content.addView(cancel)
    val transferStatus = TextView(activity); content.addView(transferStatus)
    var transferNotice: String? = null
    var verifying = false
    fun begin(release: NativeRelease) {
        if (verifying) return
        download.isEnabled = false; transferNotice = null
        work.launch {
            try { withContext(Dispatchers.IO) { updates.start(release) } }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (opened) transferStatus.text = activity.getString(R.string.update_failed, e.localizedMessage.orEmpty()) }
        }
    }
    download.setOnClickListener { available?.let(::begin) }
    cancel.setOnClickListener { work.launch {
        try { withContext(Dispatchers.IO) { updates.cancel() }; transferNotice = null; if (opened) transferStatus.text = activity.getString(R.string.update_cancelled) }
        catch (e: CancellationException) { throw e }
        catch (e: Exception) { if (opened) transferStatus.text = activity.getString(R.string.update_failed, e.localizedMessage.orEmpty()) }
    } }
    install.setOnClickListener { work.launch {
        try {
            val current = updates.saved() ?: error(activity.getString(R.string.update_expired))
            install.isEnabled = false; verifying = true; transferNotice = null; transferStatus.text = activity.getString(R.string.update_verifying)
            if (opened && !updates.install(activity, current)) { transferNotice = activity.getString(R.string.update_install_permission); transferStatus.text = transferNotice }
        } catch (e: CancellationException) { throw e }
        catch (e: Exception) { if (opened) { transferNotice = activity.getString(R.string.update_failed, e.localizedMessage.orEmpty()); transferStatus.text = transferNotice } }
        finally { verifying = false; if (opened) install.isEnabled = true }
    } }
    work.launch {
        while (opened) {
            try {
                val value = withContext(Dispatchers.IO) { updates.progress() }
                if (!opened) break
                val active = value?.status in setOf(DownloadManager.STATUS_PENDING, DownloadManager.STATUS_RUNNING, DownloadManager.STATUS_PAUSED)
                download.isEnabled = available?.apkUrl != null && !active && !verifying
                install.isEnabled = value?.status == DownloadManager.STATUS_SUCCESSFUL && !verifying
                cancel.isEnabled = value != null
                if (value != null && !verifying) transferStatus.text = when (value.status) {
                    DownloadManager.STATUS_SUCCESSFUL -> transferNotice ?: activity.getString(R.string.update_ready)
                    DownloadManager.STATUS_FAILED -> activity.getString(R.string.update_download_error, value.reason)
                    DownloadManager.STATUS_RUNNING -> activity.getString(R.string.update_progress, Formatter.formatShortFileSize(activity, value.current.coerceAtLeast(0)), Formatter.formatShortFileSize(activity, value.total.coerceAtLeast(0)))
                    else -> activity.getString(R.string.update_waiting)
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (opened) transferStatus.text = activity.getString(R.string.update_failed, e.localizedMessage.orEmpty()) }
            delay(500)
        }
    }
    check.setOnClickListener {
        check.isEnabled = false; status.text = activity.getString(R.string.ui_6b72c3d6855c)
        work.launch {
            try {
                val release = NativeReleases.latest()
                if (!opened) return@launch
                available = release?.takeIf { NativeReleases.compare(it.version, info.versionName.orEmpty()) > 0 }
                status.text = when {
                    release == null -> activity.getString(R.string.ui_ca985784214d)
                    NativeReleases.compare(release.version, info.versionName.orEmpty()) <= 0 -> activity.getString(R.string.ui_cda525a300a1, java.lang.String.valueOf(release.version))
                    else -> activity.getString(R.string.ui_3f07b0d41217, java.lang.String.valueOf(release.version))
                }
                if (release != null && NativeReleases.compare(release.version, info.versionName.orEmpty()) > 0) {
                    AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_936707017ead, java.lang.String.valueOf(release.version))).setMessage(release.notes.ifBlank { activity.getString(R.string.ui_1c947644f8de) })
                        .setPositiveButton(activity.getString(R.string.update_download)) { _, _ -> begin(release) }
                        .setNeutralButton(activity.getString(R.string.update_ignore)) { _, _ -> AppPreferences(activity).set("version.ignored", release.version) }
                        .setNegativeButton(activity.getString(R.string.ui_3fd47edce45b), null).show()
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (opened) status.text = activity.getString(R.string.ui_506c6f6ae493, java.lang.String.valueOf(e.localizedMessage)) }
            finally { if (opened) check.isEnabled = true }
        }
    }
    button(activity.getString(R.string.ui_88e03b310fe2)) { open("https://github.com/${NativeReleases.REPOSITORY}") }
    button(activity.getString(R.string.ui_bac19e2d086b)) { open(NativeReleases.PAGE) }
    button(activity.getString(R.string.ui_397b5581b4a9)) { open("https://github.com/lyswhut/lx-music-mobile") }
    button(activity.getString(R.string.ui_45a6d115fdfb)) { open("https://lyswhut.github.io/lx-music-doc/mobile/faq") }
    button(activity.getString(R.string.ui_31882138222f)) { open("https://github.com/${NativeReleases.REPOSITORY}/issues") }
    button(activity.getString(R.string.ui_038ad816c53f)) {
        val license = "LX Music — Apache License 2.0\n\n" + activity.assets.open("licenses/Apache-2.0.txt").use { it.readBytes().toString(Charsets.UTF_8) } +
            "\n\nJAudiotagger 3.0.1 — LGPL 2.1 or later\nhttps://www.jthink.net/jaudiotagger/\nSource: https://repo.maven.apache.org/maven2/net/jthink/jaudiotagger/3.0.1/jaudiotagger-3.0.1-sources.jar\n\n" + activity.assets.open("licenses/LGPL-2.1.txt").use { it.readBytes().toString(Charsets.UTF_8) }
        val text = TextView(activity).apply { setText(license); setTextIsSelectable(true); setPadding(24, 12, 24, 12) }
        AlertDialog.Builder(activity).setTitle("Apache License 2.0").setView(ScrollView(activity).apply { addView(text) }).setPositiveButton(activity.getString(R.string.ui_3fd47edce45b), null).show()
    }
    AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_4fd38bc4f6d4)).setView(ScrollView(activity).apply { addView(content) })
        .setPositiveButton(activity.getString(R.string.ui_3fd47edce45b), null).create().apply { setOnDismissListener { opened = false; work.cancel() }; show() }
}

internal fun showDiagnostics(activity: Activity, scope: CoroutineScope, export: () -> Unit) {
    val preferences = AppPreferences(activity); val log = DiagnosticLog(activity)
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
    listOf(activity.getString(R.string.ui_c7520af426a5) to DiagnosticLog.SYNC, activity.getString(R.string.ui_8a57b342c746) to DiagnosticLog.SOURCE).forEach { (label, key) ->
        content.addView(CheckBox(activity).apply { text = label; isChecked = preferences.bool(key)
            setOnCheckedChangeListener { _, value -> preferences.set(key, value) } })
    }
    val text = TextView(activity).apply { textSize = 12f; setTextIsSelectable(true); minLines = 4 }; content.addView(text)
    var opened = true
    fun refresh() { scope.launch { val value = log.read(); if (opened) text.text = value.ifBlank { activity.getString(R.string.ui_10fafbeaa7fd) } } }
    refresh()
    AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_bb1d19b85634)).setView(ScrollView(activity).apply { addView(content) })
        .setPositiveButton(activity.getString(R.string.ui_3fd47edce45b), null).setNeutralButton(activity.getString(R.string.ui_76420433f22d)) { _, _ -> export() }.setNegativeButton(activity.getString(R.string.ui_1ef3de06b32e), null)
        .create().apply {
            setOnDismissListener { opened = false }
            setOnShowListener { getButton(AlertDialog.BUTTON_NEGATIVE).setOnClickListener { scope.launch { log.clear(); refresh() } } }
            show()
        }
}
