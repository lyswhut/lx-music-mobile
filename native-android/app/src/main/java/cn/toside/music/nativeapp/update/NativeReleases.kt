package cn.toside.music.nativeapp.update

import cn.toside.music.nativeapp.utils.NativeHttp

import org.json.JSONArray

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
