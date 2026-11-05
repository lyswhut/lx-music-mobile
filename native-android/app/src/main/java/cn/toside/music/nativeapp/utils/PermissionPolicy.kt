package cn.toside.music.nativeapp.utils

import cn.toside.music.nativeapp.data.Song

import android.Manifest
import android.content.Context
import java.io.File

internal object PermissionPolicy {
    fun audio(sdk: Int): String = if (sdk >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
    fun downloadWrite(sdk: Int): String? = if (sdk <= 28) Manifest.permission.WRITE_EXTERNAL_STORAGE else null
    fun requiresLibraryAccess(context: Context, song: Song?): Boolean {
        if (song == null || song.source != "local") return false
        if (song.uri.scheme == "content") return song.uri.authority == "media"
        if (song.uri.scheme != "file") return false
        val path = runCatching { File(song.uri.path ?: return false).canonicalPath }.getOrElse { return true }
        val roots = listOfNotNull(context.filesDir, context.cacheDir, context.getExternalFilesDir(null), context.externalCacheDir)
        return roots.none { root ->
            val allowed = root.canonicalPath
            path == allowed || path.startsWith(allowed + File.separator)
        }
    }
}
