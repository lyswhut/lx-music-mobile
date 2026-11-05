package cn.toside.music.nativeapp.utils

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.data.Song

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import org.json.JSONObject

internal object SongShare {
    fun providerPage(song: Song): Uri? {
        if (song.source == "local") return null
        val data = JSONObject(song.sourceInfo ?: "{}")
        fun value(key: String) = Uri.encode(data.optString(key))
        return when (song.source) {
            "kw" -> "https://www.kuwo.cn/play_detail/${value("songmid") }"
            "kg" -> "https://www.kugou.com/song/#hash=${value("hash")}&album_id=${value("albumId") }"
            "tx" -> "https://y.qq.com/n/yqq/song/${value("songmid")}.html"
            "wy" -> "https://music.163.com/#/song?id=${value("songmid") }"
            "mg" -> "https://music.migu.cn/v3/music/song/${value("copyrightId") }"
            else -> null
        }?.let(Uri::parse)
    }
    fun link(song: Song): Uri {
        val action: String
        val data: JSONObject
        if (song.source == "local") {
            action = "searchPlay"; data = JSONObject().put("name", song.title).put("singer", song.artist)
        } else {
            action = "play"; data = JSONObject(song.sourceInfo ?: error("歌曲没有平台信息"))
                .put("name", song.title).put("singer", song.artist).put("source", song.source)
                .put("interval", "%02d:%02d".format(song.duration / 60000, song.duration / 1000 % 60))
        }
        val uri = Uri.parse("lxmusic://music/$action").buildUpon().appendQueryParameter("data", data.toString()).build()
        require(uri.toString().length <= 100_000) { "歌曲信息过大" }
        return uri
    }
    fun intent(song: Song): Intent = Intent(Intent.ACTION_SEND).setType("text/plain")
        .putExtra(Intent.EXTRA_SUBJECT, "${song.title} · ${song.artist}").putExtra(Intent.EXTRA_TEXT, link(song).toString())
    fun share(activity: Activity, song: Song) {
        if (AppPreferences(activity).string("common.shareType", "system") == "clipboard") {
            (activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText(song.title, link(song).toString()))
            android.widget.Toast.makeText(activity, activity.getString(R.string.share_copied), android.widget.Toast.LENGTH_SHORT).show()
        } else activity.startActivity(Intent.createChooser(intent(song), activity.getString(R.string.share_song)))
    }
}
