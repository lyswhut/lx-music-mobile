package cn.toside.music.nativeapp.update

import cn.toside.music.nativeapp.R

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Environment
import android.provider.Settings
import android.util.AtomicFile
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import kotlin.coroutines.coroutineContext

internal data class UpdateDownload(val id: Long, val version: String, val size: Long, val digest: String?)
internal data class UpdateProgress(val download: UpdateDownload, val status: Int, val current: Long, val total: Long, val reason: Int = 0)
class UpdateFileProvider : FileProvider()

/** DownloadManager owns the transfer across Activity/process restarts. Installation always uses the system UI. */
internal class NativeUpdates(private val context: Context) {
    private val manager = requireNotNull(context.getSystemService(DownloadManager::class.java))
    private val preferences = context.getSharedPreferences("native-updates", Context.MODE_PRIVATE)
    private val privateDirectory = File(context.filesDir, "updates")
    private fun file(version: String): File {
        require(version.matches(Regex("\\d{1,5}\\.\\d{1,5}\\.\\d{1,5}")))
        return File(requireNotNull(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)), "updates/native-v$version.apk")
    }
    fun saved(): UpdateDownload? = runCatching {
        val json = JSONObject(preferences.getString("download", null) ?: return@runCatching null)
        UpdateDownload(json.getLong("id"), json.getString("version"), json.optLong("size"), json.optString("digest").takeIf { it.isNotBlank() && it != "null" })
            .also { require(it.id > 0); file(it.version) }
    }.getOrNull()
    fun start(release: NativeRelease): UpdateDownload {
        require(release.size in 0..MAX_BYTES)
        val url = release.apkUrl ?: error(context.getString(R.string.update_no_apk))
        cancel()
        val target = file(release.version); target.parentFile?.mkdirs(); check(!target.exists() || target.delete())
        val request = DownloadManager.Request(Uri.parse(url)).setTitle(context.getString(R.string.update_download_title, release.version))
            .setMimeType("application/octet-stream").setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "updates/${target.name}")
        val id = manager.enqueue(request)
        val download = UpdateDownload(id, release.version, release.size, release.digest)
        if (!preferences.edit().putString("download", JSONObject().put("id", id).put("version", release.version).put("size", release.size).put("digest", release.digest).toString()).commit()) {
            manager.remove(id); error(context.getString(R.string.update_save_failed))
        }
        return download
    }
    fun progress(): UpdateProgress? {
        val download = saved() ?: return null
        @Suppress("DEPRECATION") val installed = context.packageManager.getPackageInfo(context.packageName, 0).versionName.orEmpty()
        if (NativeReleases.compare(download.version, installed) <= 0) { cancel(); return null }
        return manager.query(DownloadManager.Query().setFilterById(download.id))?.use { cursor ->
            if (!cursor.moveToFirst()) return@use null
            fun number(name: String) = cursor.getLong(cursor.getColumnIndexOrThrow(name))
            UpdateProgress(download, number(DownloadManager.COLUMN_STATUS).toInt(), number(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR),
                number(DownloadManager.COLUMN_TOTAL_SIZE_BYTES), number(DownloadManager.COLUMN_REASON).toInt())
        }?.also { if (it.current > MAX_BYTES || it.total > MAX_BYTES) { cancel(); error(context.getString(R.string.update_size_invalid)) } }
    }
    fun cancel() {
        saved()?.let { manager.remove(it.id) }
        privateDirectory.listFiles()?.filter { it.name.matches(Regex("[a-f0-9]{64}\\.apk")) && it.canonicalFile.parentFile == privateDirectory.canonicalFile }?.forEach { it.delete() }
        check(preferences.edit().remove("download").commit()) { context.getString(R.string.update_save_failed) }
    }
    suspend fun verify(download: UpdateDownload): File = withContext(Dispatchers.IO) {
        require(saved()?.id == download.id) { context.getString(R.string.update_expired) }
        val file = file(download.version)
        check(file.isFile && file.length() in 1..MAX_BYTES && (download.size == 0L || file.length() == download.size)) { context.getString(R.string.update_size_invalid) }
        privateDirectory.mkdirs()
        val staged = AtomicFile(File(privateDirectory, "incoming-${UUID.randomUUID()}.apk"))
        try {
            val digest = MessageDigest.getInstance("SHA-256"); var total = 0L
            val output = staged.startWrite()
            try {
                file.inputStream().use { input ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        coroutineContext.ensureActive(); val count = input.read(buffer); if (count < 0) break
                        total += count; check(total <= MAX_BYTES) { context.getString(R.string.update_size_invalid) }
                        digest.update(buffer, 0, count); output.write(buffer, 0, count)
                    }
                }
                staged.finishWrite(output)
            } catch (e: Exception) { staged.failWrite(output); throw e }
            check(total > 0 && (download.size == 0L || total == download.size)) { context.getString(R.string.update_size_invalid) }
            val hash = digest.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
            if (download.digest != null) check("sha256:$hash".equals(download.digest, ignoreCase = true)) { context.getString(R.string.update_hash_invalid) }
            // Parse and install the same immutable private copy, never the externally writable download.
            verifyArchive(context, staged.baseFile, download.version)
            check(saved()?.id == download.id) { context.getString(R.string.update_expired) }
            val committed = File(privateDirectory, "$hash.apk")
            check(committed.isFile || staged.baseFile.renameTo(committed)) { context.getString(R.string.update_save_failed) }
            committed
        } finally { staged.delete() }
    }
    suspend fun install(activity: Activity, download: UpdateDownload): Boolean {
        val intent = installIntent(download)
        if (!context.packageManager.canRequestPackageInstalls()) {
            activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")))
            return false
        }
        activity.startActivity(intent); return true
    }
    suspend fun installIntent(download: UpdateDownload): Intent {
        val verified = verify(download)
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", verified)
        return Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    companion object {
        internal const val MAX_BYTES = 512L * 1024 * 1024
        @Suppress("DEPRECATION")
        internal fun verifyArchive(context: Context, file: File, version: String) {
            val manager = context.packageManager
            val candidate = manager.getPackageArchiveInfo(file.absolutePath, PackageManager.GET_SIGNING_CERTIFICATES) ?: error(context.getString(R.string.update_apk_invalid))
            val installed = manager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
            check(candidate.packageName == context.packageName && candidate.versionName == version && candidate.longVersionCode > installed.longVersionCode) { context.getString(R.string.update_version_invalid) }
            check(signaturesMatch(installed, candidate)) { context.getString(R.string.update_signature_invalid) }
        }
        private fun signaturesMatch(installed: PackageInfo, candidate: PackageInfo): Boolean {
            val old = installed.signingInfo ?: return false; val next = candidate.signingInfo ?: return false
            val current = old.apkContentsSigners.map { it.toCharsString() }.toSet()
            if (current.isEmpty()) return false
            if (old.hasMultipleSigners() || next.hasMultipleSigners()) return current == next.apkContentsSigners.map { it.toCharsString() }.toSet()
            return next.signingCertificateHistory?.any { it.toCharsString() in current } == true
        }
    }
}
