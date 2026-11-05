package cn.toside.music.nativeapp.data

import android.content.ContextWrapper
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class QueueStoreTest {
    @Test fun persistsQueuePositionAndOnlineMetadata() = runBlocking {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(target.cacheDir, "queue-test-${System.nanoTime()}").apply { mkdirs() }
        val context = object : ContextWrapper(target) { override fun getFilesDir(): File = directory }
        try {
            val store = QueueStore(context)
            assertNull(store.load())
            val local = Song(3, Uri.parse("content://media/3"), "Local", "Artist", 100_000)
            val online = Song(5, Uri.EMPTY, "Online", "Singer", 180_000, "kg", "{\"songmid\":5}")
            val snapshot = QueueSnapshot(listOf(local, online), 1, 42_000)
            store.save(snapshot)
            assertEquals(snapshot, QueueStore(context).load())
        } finally { directory.deleteRecursively() }
    }
}
