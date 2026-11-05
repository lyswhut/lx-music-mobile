package cn.toside.music.nativeapp

import android.app.DownloadManager
import android.content.Intent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.net.ServerSocket
import java.security.MessageDigest
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread

@RunWith(AndroidJUnit4::class)
class NativeUpdatesTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    private fun digest(file: File) = file.inputStream().use { input ->
        val hash = MessageDigest.getInstance("SHA-256"); val buffer = ByteArray(65536)
        while (true) { val size = input.read(buffer); if (size < 0) break; hash.update(buffer, 0, size) }
        "sha256:" + hash.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
    }
    private fun fixture(): File {
        val path = InstrumentationRegistry.getArguments().getString("updateFixture").orEmpty()
        assumeTrue("Pass updateFixture pointing to a signed native 0.1.1/versionCode 2 APK", path.isNotEmpty())
        return File(path).also { assertTrue("Missing upgrade fixture: $path", it.isFile) }
    }
    private fun download(file: File, size: Long = file.length(), hash: String? = digest(file), action: suspend (NativeUpdates, UpdateDownload) -> Unit) = runBlocking {
        val updates = NativeUpdates(context); val server = ServerSocket(0, 4, java.net.InetAddress.getByName("127.0.0.1"))
        val failure = AtomicReference<Throwable?>()
        val worker = thread(name = "update-fixture-http") {
            try {
                server.accept().use { socket ->
                    socket.soTimeout = 20000
                    val reader = socket.getInputStream().bufferedReader()
                    while (!reader.readLine().isNullOrEmpty()) { /* consume request headers */ }
                    socket.getOutputStream().use { output ->
                        output.write("HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length()}\r\nConnection: close\r\n\r\n".toByteArray())
                        file.inputStream().use { it.copyTo(output) }
                    }
                }
            } catch (e: Throwable) { if (!server.isClosed) failure.set(e) }
        }
        try {
            val record = updates.start(NativeRelease("0.1.1", "", "fixture", "http://127.0.0.1:${server.localPort}/update.apk", size, hash))
            // The transfer is owned by the OS, with no Activity or service bound to this instance.
            val restored = NativeUpdates(context)
            assertEquals(record, restored.saved())
            val deadline = android.os.SystemClock.elapsedRealtime() + 60000
            var progress = restored.progress()
            while (progress?.status != DownloadManager.STATUS_SUCCESSFUL && android.os.SystemClock.elapsedRealtime() < deadline) {
                if (progress?.status == DownloadManager.STATUS_FAILED) fail("Download failed: ${progress.reason}; server: ${failure.get()}")
                android.os.SystemClock.sleep(100); progress = restored.progress()
            }
            assertEquals("Download did not finish: $progress / ${failure.get()}", DownloadManager.STATUS_SUCCESSFUL, progress?.status)
            assertEquals(file.length(), progress!!.current)
            action(restored, record)
        } finally { updates.cancel(); server.close(); worker.join(2000) }
    }
    @Test fun systemDownloadPersistsAndInstallerReceivesVerifiedPrivateCopy() {
        val fixture = fixture()
        download(fixture) { updates, record ->
            val verified = updates.verify(record)
            assertEquals(File(context.filesDir, "updates").canonicalFile, verified.canonicalFile.parentFile)
            assertEquals(digest(fixture), digest(verified))
            val intent = updates.installIntent(record)
            assertEquals(Intent.ACTION_VIEW, intent.action)
            assertEquals("application/vnd.android.package-archive", intent.type)
            assertEquals(Intent.FLAG_GRANT_READ_URI_PERMISSION, intent.flags)
            assertEquals("${context.packageName}.updates", intent.data!!.authority)
            val sharedHash = context.contentResolver.openInputStream(intent.data!!)!!.use { input ->
                val hash = MessageDigest.getInstance("SHA-256"); val buffer = ByteArray(65536)
                while (true) { val count = input.read(buffer); if (count < 0) break; hash.update(buffer, 0, count) }
                "sha256:" + hash.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
            }
            assertEquals(digest(fixture), sharedHash)
            updates.cancel(); assertNull(updates.saved()); assertFalse(verified.exists())
        }
    }
    @Test fun untrustedOrIncompleteDownloadsAreRejectedBeforeInstallation() {
        val file = File(context.cacheDir, "invalid-update.apk").apply { writeBytes(ByteArray(8192) { 31 }) }
        try {
            download(file, hash = "sha256:" + "0".repeat(64)) { updates, record ->
                assertTrue(runCatching { updates.verify(record) }.exceptionOrNull()?.message.orEmpty().contains(context.getString(R.string.update_hash_invalid)))
            }
            download(file, size = file.length() + 1) { updates, record ->
                assertTrue(runCatching { updates.verify(record) }.exceptionOrNull()?.message.orEmpty().contains(context.getString(R.string.update_size_invalid)))
            }
            download(file) { updates, record -> assertTrue(runCatching { updates.verify(record) }.isFailure) }
        } finally { file.delete() }
    }
    @Test fun archivePolicyRejectsDowngradeWrongPackageAndChangedSigningKey() {
        assertTrue(runCatching { NativeUpdates.verifyArchive(context, File(context.applicationInfo.sourceDir), "0.1.0") }.isFailure)
        val testContext = InstrumentationRegistry.getInstrumentation().context
        assertTrue(runCatching { NativeUpdates.verifyArchive(context, File(testContext.applicationInfo.sourceDir), "0.1.1") }.isFailure)
        val path = InstrumentationRegistry.getArguments().getString("wrongSignerFixture").orEmpty()
        assumeTrue("Pass wrongSignerFixture for a different-key upgrade APK", path.isNotEmpty())
        val exception = runCatching { NativeUpdates.verifyArchive(context, File(path), "0.1.1") }.exceptionOrNull()
        assertEquals(context.getString(R.string.update_signature_invalid), exception?.message)
    }
}
