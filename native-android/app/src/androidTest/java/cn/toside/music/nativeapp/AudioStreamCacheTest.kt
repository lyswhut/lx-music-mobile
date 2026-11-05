@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package cn.toside.music.nativeapp

import android.net.Uri
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.cache.ContentMetadataMutations
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class AudioStreamCacheTest {
    @Test fun readsCachedAudioOfflineAndEvictsLeastRecentlyUsedSpansWhenLimitChanges() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(context.cacheDir, "audio-cache-test-${System.nanoTime()}")
        val cache = AudioStreamCache(context, directory)
        try {
            fun store(key: String, content: String) {
                val bytes = content.toByteArray()
                val hole = cache.cache.startReadWrite(key, 0, bytes.size.toLong())
                try {
                    val file = cache.cache.startFile(key, 0, bytes.size.toLong())
                    file.writeBytes(bytes); cache.cache.commitFile(file, bytes.size.toLong())
                    val metadata = ContentMetadataMutations()
                    ContentMetadataMutations.setContentLength(metadata, bytes.size.toLong())
                    cache.cache.applyContentMetadataMutations(key, metadata)
                    cache.remember(key, Uri.parse("http://127.0.0.1:1/$key"))
                } finally { cache.cache.releaseHoleSpan(hole) }
            }
            store("older", "12345"); Thread.sleep(5); store("recent", "67890")
            assertEquals(10L, cache.bytes)
            assertNotNull(cache.cachedUri("recent"))
            val source = cache.dataSource().createDataSource()
            try {
                assertEquals(5L, source.open(DataSpec.Builder().setUri("http://127.0.0.1:1/recent").setKey("recent").build()))
                val bytes = ByteArray(5); assertEquals(5, source.read(bytes, 0, 5)); assertEquals("67890", bytes.toString(Charsets.UTF_8))
            } finally { source.close() }
            cache.updateLimit(5)
            assertNull(cache.cachedUri("older")); assertNotNull(cache.cachedUri("recent")); assertEquals(5L, cache.bytes)
            cache.updateLimit(100)
            store("kw:1::128k", "one"); store("kw:1::flac", "two"); store("kw:10::128k", "keep")
            cache.removeSong("kw:1::")
            assertNull(cache.cachedUri("kw:1::128k")); assertNull(cache.cachedUri("kw:1::flac")); assertNotNull(cache.cachedUri("kw:10::128k"))
            cache.updateLimit(0); assertEquals(0L, cache.bytes); assertNull(cache.cachedUri("recent"))
        } finally { cache.close(); directory.deleteRecursively() }
    }
}
