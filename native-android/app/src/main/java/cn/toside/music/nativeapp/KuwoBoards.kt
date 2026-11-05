package cn.toside.music.nativeapp

import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

class KuwoBoards {
    val boards = listOf(
        Board("93", "飙升榜", "kw"), Board("17", "新歌榜", "kw"), Board("16", "热歌榜", "kw"),
        Board("158", "抖音热歌榜", "kw"), Board("292", "铃声榜", "kw"), Board("284", "热评榜", "kw"),
        Board("290", "ACG新歌榜", "kw"), Board("286", "台湾KKBOX榜", "kw"), Board("279", "冬日暖心榜", "kw"),
        Board("281", "巴士随身听榜", "kw"), Board("255", "KTV点唱榜", "kw"), Board("280", "家务进行曲榜", "kw"),
        Board("282", "熬夜修仙榜", "kw"), Board("283", "枕边轻音乐榜", "kw"), Board("278", "古风音乐榜", "kw"),
        Board("264", "Vlog音乐榜", "kw"), Board("242", "电音榜", "kw"), Board("187", "流行趋势榜", "kw"),
        Board("204", "现场音乐榜", "kw"), Board("186", "ACG神曲榜", "kw"), Board("185", "最强翻唱榜", "kw"),
        Board("26", "经典怀旧榜", "kw"), Board("104", "华语榜", "kw"), Board("182", "粤语榜", "kw"),
        Board("22", "欧美榜", "kw"), Board("184", "韩语榜", "kw"), Board("183", "日语榜", "kw"),
        Board("145", "会员畅听榜", "kw"), Board("153", "网红新歌榜", "kw"), Board("64", "影视金曲榜", "kw"),
        Board("176", "DJ嗨歌榜", "kw"), Board("106", "真声音", "kw"), Board("12", "Billboard榜", "kw"),
        Board("49", "iTunes音乐榜", "kw"), Board("180", "beatport电音榜", "kw"), Board("13", "英国UK榜", "kw"),
        Board("164", "百大DJ榜", "kw"), Board("246", "YouTube音乐排行榜", "kw"), Board("265", "韩国Genie榜", "kw"),
        Board("14", "韩国M-net榜", "kw"), Board("8", "香港电台榜", "kw"), Board("15", "日本公信榜", "kw"),
        Board("151", "腾讯音乐人原创榜", "kw")
    )
    private val secret = SecretKeySpec(Base64.decode("cFcnPcf6Kb85RC1y3V6M5A==", Base64.DEFAULT), "AES")
    internal fun encode(data: String, timestamp: Long): Pair<String, String> {
        val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, secret)
        val value = Base64.encodeToString(cipher.doFinal(data.toByteArray()), Base64.NO_WRAP)
        val sign = MessageDigest.getInstance("MD5").digest("y67sprxhhpws$value$timestamp".toByteArray())
            .joinToString("") { "%02X".format(it.toInt() and 255) }
        return value to sign
    }
    internal fun decode(value: String): JSONObject {
        val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        cipher.init(Cipher.DECRYPT_MODE, secret)
        return JSONObject(cipher.doFinal(Base64.decode(Uri.decode(value), Base64.DEFAULT)).toString(Charsets.UTF_8))
    }
    suspend fun songs(board: Board, page: Int): List<Song> = withContext(Dispatchers.IO) {
        require(board.source == "kw" && board.id.isNotEmpty() && board.id.all(Char::isDigit) && page > 0)
        val request = JSONObject().put("uid", "").put("devId", "").put("sFrom", "kuwo_sdk").put("user_type", "AP")
            .put("carSource", "kwplayercar_ar_6.0.1.0_apk_keluze.apk").put("id", board.id).put("pn", page - 1).put("rn", 100)
        val time = System.currentTimeMillis()
        val (value, sign) = encode(request.toString(), time)
        val url = "https://wbd.kuwo.cn/api/bd/bang/bang_info?data=${URLEncoder.encode(value, "UTF-8")}&time=$time&appId=y67sprxhhpws&sign=$sign"
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000
            check(connection.responseCode == 200) { "获取榜单失败：${connection.responseCode}" }
            val body = connection.inputStream.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) }
            val response = decode(body)
            check(response.optInt("code") == 200) { "榜单平台返回错误" }
            parse(response.getJSONObject("data").optJSONArray("musiclist") ?: JSONArray())
        } finally { connection.disconnect() }
    }
    internal fun parse(items: JSONArray): List<Song> {
        val normalized = JSONArray()
        val images = mutableMapOf<String, String>()
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            val id = item.optString("id")
            if (id.isBlank()) continue
            images[id] = item.optString("pic")
            normalized.put(JSONObject().put("MUSICRID", id).put("SONGNAME", item.optString("name"))
                .put("ARTIST", item.optString("artist")).put("DURATION", item.opt("duration") ?: 0)
                .put("ALBUM", item.optString("album")).put("ALBUMID", item.opt("albumId") ?: "")
                .put("N_MINFO", item.optString("n_minfo")))
        }
        return OnlineSearch().parseKw(normalized).map { song ->
            val info = JSONObject(song.sourceInfo!!)
            info.put("img", images[info.optString("songmid")] ?: "")
            song.copy(sourceInfo = info.toString())
        }
    }
}
