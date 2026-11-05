package cn.toside.music.nativeapp

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment

class Downloads(private val context: Context) {
    fun enqueue(song: Song, uri: Uri): Long {
        require(uri.scheme == "https" || uri.scheme == "http") { "音源返回了无效地址" }
        val ext = uri.lastPathSegment?.substringAfterLast('.', "")?.lowercase()
            ?.takeIf { it in setOf("mp3", "m4a", "aac", "flac", "ogg", "wav") } ?: "mp3"
        val display = when (AppPreferences(context).downloadPattern) {
            "歌手 - 歌名" -> "${song.artist} - ${song.title}"
            "歌名" -> song.title
            else -> "${song.title} - ${song.artist}"
        }
        val base = display.replace(Regex("[\\\\/:*?\"<>|\\p{Cntrl}]"), "_")
            .trim().take(120).ifBlank { "music" }
        val fileName = "$base-${System.currentTimeMillis()}.$ext"
        val request = DownloadManager.Request(uri).setTitle(song.title).setDescription(song.artist)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_MUSIC, "LX Music/$fileName")
        return (context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
    }
}
