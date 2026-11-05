package cn.toside.music.nativeapp

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal object MetadataMatching {
    private suspend fun request(context: Context, song: Song, action: String): JSONObject {
        val source = UserSource(context)
        try {
            check(source.loadSaved() && source.supports("local", action)) { context.getString(R.string.metadata_match_source) }
            val info = JSONObject(song.sourceInfo ?: "{}").put("name", song.title).put("singer", song.artist)
                .put("songmid", song.uri.path).put("filePath", song.uri.path).put("interval", song.duration / 1000)
            return source.sourceRequest("local", action, info)
        } finally { source.close() }
    }
    suspend fun lyric(context: Context, song: Song): String {
        val data = request(context, song, "lyric").getJSONObject("data")
        val lyrics = data.optString("lxlyric").takeUnless { it.isBlank() || it == "null" } ?: data.optString("lyric").takeUnless { it == "null" }.orEmpty()
        check(lyrics.isNotBlank()) { context.getString(R.string.metadata_match_empty) }
        val settings = PlayerSettings(context)
        if (!settings.showTranslation && !settings.showRomanization) return lyrics
        return LyricFormats.merge(LrcParser.parse(lyrics), LrcParser.parse(data.optString("tlyric")), LrcParser.parse(data.optString("rlyric"))).joinToString("\n") { line ->
            "[%02d:%02d.%03d]".format(java.util.Locale.ROOT, line.timeMs / 60000, line.timeMs / 1000 % 60, line.timeMs % 1000) + line.text +
                (if (settings.showTranslation && line.translation.isNotBlank()) " / ${line.translation}" else "") +
                (if (settings.showRomanization && line.romanization.isNotBlank()) " / ${line.romanization}" else "")
        }
    }
    suspend fun cover(context: Context, song: Song): ByteArray {
        val url = request(context, song, "pic").getString("data")
        require(URL(url).protocol in setOf("https", "http"))
        return withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.connectTimeout = 10000; connection.readTimeout = 10000
                check(connection.responseCode in 200..299)
                connection.inputStream.use { it.readBounded(8 * 1024 * 1024) }
            } finally { connection.disconnect() }
        }
    }
}
