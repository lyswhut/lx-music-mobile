package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.PlaylistCredentials
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.utils.readBounded

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.KeyFactory
import java.security.SecureRandom
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

data class PlaylistCategory(val name: String, val tags: List<String>)

/** Native implementation of the existing public NetEase weapi playlist protocol. */
class NeteaseApi internal constructor(private val transport: ((String, JSONObject, String?) -> JSONObject)? = null) {
    private val publicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB"

    internal fun encrypt(data: String, secret: String): Pair<String, String> {
        require(secret.toByteArray().size == 16)
        fun aes(bytes: ByteArray, key: String): ByteArray {
            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key.toByteArray(), "AES"), IvParameterSpec("0102030405060708".toByteArray()))
            return cipher.doFinal(bytes)
        }
        val first = Base64.encodeToString(aes(data.toByteArray(Charsets.UTF_8), "0CoJUm6Qyw8W8jud"), Base64.NO_WRAP)
        val params = Base64.encodeToString(aes(first.toByteArray(Charsets.UTF_8), secret), Base64.NO_WRAP)
        val key = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.DEFAULT)))
        val input = ByteArray(128)
        val reversed = secret.reversed().toByteArray(Charsets.UTF_8)
        reversed.copyInto(input, input.size - reversed.size)
        val cipher = Cipher.getInstance("RSA/ECB/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        val encryptedKey = cipher.doFinal(input).joinToString("") { "%02x".format(it.toInt() and 255) }
        return params to encryptedKey
    }
    private fun request(path: String, data: JSONObject, token: String? = null): JSONObject {
        token?.let(PlaylistCredentials::validate)
        transport?.let { return it(path, data, token?.let { value -> "MUSIC_U=$value" }) }
        val random = SecureRandom()
        val secret = buildString { repeat(16) { append(random.nextInt(10)) } }
        val (params, encryptedKey) = encrypt(data.toString(), secret)
        val form = "params=${URLEncoder.encode(params, "UTF-8")}&encSecKey=$encryptedKey"
        val connection = URL("https://music.163.com$path").openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 13_000; connection.readTimeout = 13_000; connection.requestMethod = "POST"; connection.doOutput = true
            connection.instanceFollowRedirects = false
            if (token != null) connection.setRequestProperty("Cookie", "MUSIC_U=$token")
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/60.0.3112.90 Safari/537.36")
            connection.setRequestProperty("Origin", "https://music.163.com")
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connection.outputStream.use { it.write(form.toByteArray()) }
            check(connection.responseCode == 200) { "网易请求失败：${connection.responseCode}" }
            val result = JSONObject(connection.inputStream.use { it.readBounded(16 * 1024 * 1024).toString(Charsets.UTF_8) })
            check(result.optInt("code", -1) == 200) { "网易返回错误：${result.optInt("code", -1)}" }
            return result
        } finally { connection.disconnect() }
    }
    internal suspend fun publicRequest(path: String, data: JSONObject): JSONObject = withContext(Dispatchers.IO) { request(path, data) }
    suspend fun categories(): List<PlaylistCategory> = withContext(Dispatchers.IO) {
        parseCategories(request("/weapi/playlist/catalogue", JSONObject()))
    }
    internal fun parseCategories(data: JSONObject): List<PlaylistCategory> {
        val groups = data.optJSONObject("categories") ?: JSONObject()
        val sub = data.optJSONArray("sub") ?: JSONArray()
        val tags = mutableMapOf<String, MutableList<String>>()
        for (i in 0 until sub.length()) {
            val item = sub.optJSONObject(i) ?: continue
            val name = item.optString("name")
            if (name.isNotBlank()) tags.getOrPut(item.optString("category")) { mutableListOf() }.add(name)
        }
        return groups.keys().asSequence().toList().sortedBy { it.toIntOrNull() ?: Int.MAX_VALUE }.mapNotNull { id ->
            val items = tags[id].orEmpty().distinct()
            if (items.isEmpty()) null else PlaylistCategory(groups.optString(id), items)
        }
    }
    suspend fun recommended(page: Int, category: String = "全部"): List<OnlinePlaylist> = withContext(Dispatchers.IO) {
        require(page > 0)
        val result = request("/weapi/playlist/list", JSONObject().put("cat", category).put("order", "hot")
            .put("limit", 30).put("offset", 30 * (page - 1)).put("total", true))
        val items = result.optJSONArray("playlists") ?: JSONArray()
        buildList {
            for (i in 0 until items.length()) {
                val item = items.optJSONObject(i) ?: continue
                val id = item.optString("id")
                if (id.isNotBlank() && id.all(Char::isDigit)) add(OnlinePlaylist(id, "", item.optString("name"),
                    item.optJSONObject("creator")?.optString("nickname") ?: "", "wy"))
            }
        }
    }
    suspend fun playlistSongs(id: String, page: Int, token: String? = null): List<Song> = withContext(Dispatchers.IO) {
        require(id.isNotEmpty() && id.all(Char::isDigit) && page > 0)
        val detail = request("/weapi/v3/playlist/detail", JSONObject().put("id", id).put("n", 100000).put("p", 1), token)
        val trackIds = detail.getJSONObject("playlist").optJSONArray("trackIds") ?: JSONArray()
        val start = (page - 1).toLong() * 100
        if (start >= trackIds.length()) return@withContext emptyList()
        val ids = JSONArray()
        val entries = JSONArray()
        for (i in start.toInt() until minOf(start.toInt() + 100, trackIds.length())) {
            val track = trackIds.getJSONObject(i).getLong("id")
            ids.put(track); entries.put(JSONObject().put("id", track))
        }
        val songData = request("/weapi/v3/song/detail", JSONObject().put("c", entries.toString()).put("ids", ids.toString()), token)
        parseSongs(songData)
    }
    internal fun parseSongs(data: JSONObject): List<Song> {
        val songs = data.optJSONArray("songs") ?: JSONArray()
        val privileges = data.optJSONArray("privileges") ?: JSONArray()
        val byId = mutableMapOf<String, JSONObject>()
        for (i in 0 until privileges.length()) privileges.optJSONObject(i)?.let { byId[it.optString("id")] = it }
        val resources = JSONArray()
        for (i in 0 until songs.length()) {
            val song = songs.optJSONObject(i) ?: continue
            val privilege = byId[song.optString("id")] ?: continue
            val item = JSONObject(song.toString()).put("privilege", privilege)
            resources.put(JSONObject().put("baseInfo", JSONObject().put("simpleSongData", item)))
        }
        return OnlineSearch().parseWy(resources)
    }
}
