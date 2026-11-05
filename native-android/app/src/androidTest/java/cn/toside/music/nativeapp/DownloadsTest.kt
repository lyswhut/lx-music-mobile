package cn.toside.music.nativeapp

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.net.InetAddress
import java.net.ServerSocket
import kotlin.concurrent.thread

@RunWith(AndroidJUnit4::class)
class DownloadsTest {
    @Test fun downloadManagerWritesAndCompletes() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val server = ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))
        val worker = thread {
            try { server.accept().use { socket ->
                val reader = socket.getInputStream().bufferedReader()
                while (reader.readLine()?.isNotEmpty() == true) { }
                val payload = "test audio"
                socket.getOutputStream().write("HTTP/1.1 200 OK\r\nContent-Type: audio/mpeg\r\nContent-Length: ${payload.length}\r\nConnection: close\r\n\r\n$payload".toByteArray())
            } } catch (_: java.net.SocketException) { }
        }
        val song = Song(-123, Uri.EMPTY, "LX 下载测试", "测试", 0, "kg", "{}")
        var id: Long? = null
        try {
            val downloadId = Downloads(context).enqueue(song, Uri.parse("http://127.0.0.1:${server.localPort}/test.mp3"))
            id = downloadId
            var status = DownloadManager.STATUS_PENDING
            var reason = 0
            repeat(80) {
                manager.query(DownloadManager.Query().setFilterById(downloadId)).use { cursor ->
                    if (cursor.moveToFirst()) {
                        status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                        reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                    }
                }
                if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) return@repeat
                delay(250)
            }
            assertEquals("DownloadManager failure reason=$reason", DownloadManager.STATUS_SUCCESSFUL, status)
        } finally {
            id?.let { manager.remove(it) }
            server.close(); worker.join(2_000)
        }
    }
}
