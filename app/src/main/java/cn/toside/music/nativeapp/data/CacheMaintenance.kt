package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.player.AudioStreamCache

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

internal class CacheMaintenance(context: Context) {
    private val appContext = context.applicationContext
    private val lyrics = context.filesDir.resolve("lyrics")
    private val resources = context.cacheDir.resolve("artwork")
    private fun files(): List<File> = lyrics.listFiles()?.filter { it.isFile && it.name.endsWith(".json") } ?: emptyList()
    suspend fun lyricBytes(): Long = withContext(Dispatchers.IO) { files().sumOf { it.length() } }
    suspend fun clearLyrics() = withContext(Dispatchers.IO) {
        files().forEach { file -> check(file.delete() || !file.exists()) { "无法清理 ${file.name}" } }
    }
    suspend fun audioBytes(): Long = withContext(Dispatchers.IO) { AudioStreamCache.get(appContext).bytes }
    suspend fun clearAudio() = withContext(Dispatchers.IO) { AudioStreamCache.get(appContext).clear() }
    suspend fun resourceBytes(): Long = withContext(Dispatchers.IO) { resources.listFiles()?.filter { it.isFile }?.sumOf(File::length) ?: 0 }
    suspend fun clearResources() = withContext(Dispatchers.IO) {
        resources.listFiles()?.filter { it.isFile }?.forEach { check(it.delete() || !it.exists()) { "无法清理封面缓存" } }
    }
}
