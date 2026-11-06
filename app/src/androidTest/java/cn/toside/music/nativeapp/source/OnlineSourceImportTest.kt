package cn.toside.music.nativeapp.source

import android.content.Context
import android.content.ContextWrapper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.*
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class OnlineSourceImportTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun redirectsAndUtf8ScriptsDownloadAndBecomeUsableSources() = runBlocking {
        SourceHttpFixture().use { server ->
            val script = OnlineSourceImport(context).download("  ${server.address}/redirect  ")
            assertEquals(server.script, script)
            isolated { source ->
                source.import(script)
                val entry = source.catalog().entries.single()
                assertEquals("测试", entry.author)
                assertEquals(entry.id, source.catalog().selected)
                assertEquals("https://example.org/test.mp3", source.musicUrl("kw", JSONObject()))
            }
        }
    }
    @Test fun invalidUrlsAndBadHttpResponsesGiveActionableFailures() = runBlocking {
        SourceHttpFixture().use { server ->
            val downloader = OnlineSourceImport(context)
            listOf("", "file:///source.js", "javascript:alert(1)", "ftp://example.org/source", "https://").forEach { value ->
                assertTrue(failure { downloader.download(value) }.contains("HTTP"))
            }
            assertTrue(failure { downloader.download("${server.address}/missing") }.contains("404"))
            assertTrue(failure { downloader.download("${server.address}/empty") }.isNotBlank())
            assertTrue(failure { downloader.download("${server.address}/html") }.isNotBlank())
        }
    }
    @Test fun boundsApplyWithAndWithoutContentLength() = runBlocking {
        SourceHttpFixture().use { server ->
            listOf("large", "unbounded").forEach { path ->
                assertTrue(failure { OnlineSourceImport(context).download("${server.address}/$path") }.contains("2 MB"))
            }
        }
    }
    @Test fun failedDownloadsAndInvalidScriptsKeepPreviousSelectionAndAllowRetry() = runBlocking {
        SourceHttpFixture().use { server -> isolated { source ->
            source.import(server.script)
            val selected = source.catalog().selected
            failure { source.import(OnlineSourceImport(context).download("${server.address}/invalid")) }
            assertEquals(selected, source.catalog().selected)
            failure { source.import(OnlineSourceImport(context).download("${server.address}/missing")) }
            assertEquals(selected, source.catalog().selected)
            source.import(OnlineSourceImport(context).download("${server.address}/script"))
            assertEquals(1, source.catalog().entries.size)
            assertEquals("https://example.org/test.mp3", source.musicUrl("kw", JSONObject()))
        } }
    }
    @Test fun cancellationStopsWaitingForTheDownload() = runBlocking {
        SourceHttpFixture().use { server ->
            val job = launch(Dispatchers.IO) { OnlineSourceImport(context).download("${server.address}/slow") }
            assertTrue(withContext(Dispatchers.IO) { server.started.await(3, TimeUnit.SECONDS) })
            withTimeout(1000) { job.cancelAndJoin() }
            assertTrue(job.isCancelled)
        }
    }
    private suspend fun failure(block: suspend () -> Unit): String {
        try { block() } catch (e: Exception) { return e.message.orEmpty() }
        throw AssertionError("Expected import failure")
    }
    private suspend fun isolated(block: suspend (UserSource) -> Unit) {
        val directory = File(context.cacheDir, "online-source-test-${System.nanoTime()}").apply { mkdirs() }
        val isolated = object : ContextWrapper(context) { override fun getFilesDir(): File = directory }
        val source = UserSource(isolated)
        try { block(source) } finally { source.close(); directory.deleteRecursively() }
    }
}
