package cn.toside.music.nativeapp

import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.CancellationException
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/** The original app's command codes and personal collections, independent of RN. */
internal class KugouSharedPlaylists(
    private val request: suspend (String, JSONObject?, Map<String, String>) -> JSONObject = { url, body, headers -> NativeHttp.json(url, body, headers) },
    private val metadata: (List<JSONObject>) -> List<Song> = { KugouPlaylists().metadata(it) },
    private val special: (String, Int) -> List<Song> = { id, page -> KugouPlaylists().songs(id, page) },
    private val text: suspend (String) -> String = { NativeHttp.text(it) },
) {
    suspend fun songs(reference: String, page: Int): List<Song> {
        require(page in 1..1000)
        if (reference.startsWith("url:")) {
            val token = reference.removePrefix("url:")
            require(token.matches(Regex("[A-Za-z0-9_-]{1,8000}")))
            val url = Base64.decode(token, Base64.URL_SAFE or Base64.NO_WRAP).toString(Charsets.UTF_8)
            val normalized = legacyUrl(url) ?: error("酷狗旧歌单链接无效")
            return metadata(hashes(checked(Uri.parse(normalized).buildUpon().appendQueryParameter("page", page.toString()).appendQueryParameter("pagesize", "100").build().toString())))
        }
        val parts = reference.split(':')
        require(parts.size in 2..3 && parts.drop(1).all { it.matches(Regex("[A-Za-z0-9_]{1,200}")) }) { "酷狗歌单标识无效" }
        return when (parts[0]) {
            "code" -> command(parts[1], page)
            "gcid" -> collection(parts[1], page, parts.getOrNull(2))
            "chain" -> chain(parts[1], page)
            "personal" -> personal(parts[1], page)
            "encoded" -> {
                val params = "dfid=-&appid=1005&mid=0&clientver=20109&clienttime=640612895&uuid=-"
                val body = JSONObject().put("ret_info", 1).put("data", JSONArray().put(JSONObject().put("id", parts[1]).put("id_type", 2)))
                val response = checked("https://t.kugou.com/v1/songlist/batch_decode?$params&signature=${sign(params, body = body.toString())}", body)
                val id = response.getJSONArray("list").getJSONObject(0).getString("global_collection_id")
                require(id.matches(Regex("[A-Za-z0-9_]{1,200}")))
                collection(id, page, null)
            }
            else -> error("未知的酷狗歌单标识")
        }
    }
    private suspend fun command(code: String, page: Int): List<Song> {
        require(code.all(Char::isDigit))
        val body = JSONObject().put("appid", 1001).put("clientver", 9020).put("mid", "21511157a05844bd085308bc76ef3343")
            .put("clienttime", 640612895).put("key", "36164c4015e704673c588ee202b9ecb8").put("data", code)
        val result = checked("https://t.kugou.com/command/", body)
        val info = result.getJSONObject("info")
        info.optString("global_collection_id").takeIf { it.isNotBlank() }?.let { return collection(it, page, null) }
        if (info.optInt("type") == 2) return special(info.getString("id"), page)
        val songs = if (info.has("userid")) {
            val data = JSONObject().put("id", info.get("id")).put("type", 3).put("userid", info.get("userid"))
                .put("collect_type", 0).put("page", page).put("pagesize", 100)
            hashes(checked("https://www2.kugou.kugou.com/apps/kucodeAndShare/app/", JSONObject(body.toString()).put("data", data)))
        } else hashes(result).drop((page - 1) * 100).take(100)
        return metadata(songs)
    }
    private suspend fun collection(id: String, page: Int, chain: String?): List<Song> {
        require(id.matches(Regex("[A-Za-z0-9_]{1,200}")))
        if (chain != null) {
            val params = "srcappid=2919&clientver=20000&clienttime=1789566751657&mid=1789566751657&uuid=1789566751657&dfid=-&listid=15&type=0&pagesize=100&global_collection_id=$id&page=$page&share_type=collect&appid=1058&chain=$chain"
            try { return metadata(hashes(checked("https://m3ws.kugou.com/v2/zlist/list?$params&signature=${sign(params, web = true)}"))) }
            catch (e: CancellationException) { throw e }
            catch (_: Exception) { /* Older collections remain available through the public collection endpoint. */ }
        }
        val params = "specialid=0&need_sort=1&module=CloudMusic&clientver=11409&pagesize=100&global_collection_id=$id&userid=0&page=$page&type=1&area_code=1&appid=1005"
        return metadata(hashes(checked("https://pubsongscdn.tx.kugou.com/v2/get_other_list_file?$params&signature=${sign(params)}")))
    }
    private suspend fun chain(chain: String, page: Int): List<Song> {
        try {
            val result = checked("https://m.kugou.com/schain/transfer?pagesize=100&chain=$chain&su=1&page=$page&n=0.7928855356604456")
            if (result.has("list")) return metadata(hashes(result))
            result.optString("global_collection_id").takeIf { it.isNotBlank() }?.let { return collection(it, page, chain) }
            result.optString("id").takeIf { it.matches(Regex("[A-Za-z0-9_]{1,200}")) }?.let { return personal(it, page) }
        } catch (e: CancellationException) { throw e }
        catch (_: Exception) { /* The original desktop share page also exposes the hashes. */ }
        val html = text("https://www.kugou.com/share/$chain.html")
        val start = Regex("(?:var\\s+)?dataFromSmarty\\s*=\\s*").find(html)?.range?.last?.plus(1) ?: error("酷狗分享页面没有歌单数据")
        val items = org.json.JSONTokener(html.substring(start)).nextValue() as? JSONArray ?: error("酷狗分享页面歌曲格式无效")
        val all = hashes(JSONObject().put("list", items))
        return metadata(all.drop((page - 1) * 100).take(100))
    }
    private suspend fun personal(id: String, page: Int): List<Song> {
        require(id.matches(Regex("[A-Za-z0-9_]{1,200}")))
        // infSign(useH5=true, isCDN=true): only srcappid/clientver are added before the sorted web signature.
        val params = "srcappid=2919&clientver=20000&appid=1058&type=0&module=playlist&page=$page&pagesize=100&specialid=$id"
        return metadata(hashes(checked("https://pubsongscdn.kugou.com/v2/get_other_list_file?$params&signature=${sign(params, web = true)}")))
    }
    private suspend fun checked(url: String, body: JSONObject? = null): JSONObject {
        val result = request(url, body, mapOf("User-Agent" to "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
            "Referer" to "https://m3ws.kugou.com/share/index.php", "KG-RC" to "1", "KG-THash" to "network_super_call.cpp:3676261689:379", "dfid" to "-",
            "mid" to (Uri.parse(url).getQueryParameter("mid") ?: "1586163242519"), "clienttime" to (Uri.parse(url).getQueryParameter("clienttime") ?: "1586163242519")))
        val error = result.optInt("error_code", result.optInt("errcode", result.optInt("err_code", 0)))
        check(error == 0) { "酷狗分享歌单返回错误：$error" }
        return result.optJSONObject("data") ?: result
    }
    private fun hashes(result: JSONObject): List<JSONObject> {
        val list = result.optJSONArray("data") ?: result.optJSONArray("list") ?: result.optJSONArray("info")
            ?: result.optJSONObject("list")?.optJSONArray("info") ?: error("酷狗歌单歌曲数据缺失")
        val result = (0 until list.length()).mapNotNull { list.optJSONObject(it) }
            .filter { it.optString("hash").matches(Regex("[A-Fa-f0-9]{32}")) }.distinctBy { it.getString("hash").lowercase() }
            .map { JSONObject().put("hash", it.getString("hash")) }
        check(list.length() == 0 || result.isNotEmpty()) { "酷狗歌单歌曲标识无效" }
        return result
    }
    companion object {
        internal fun reference(value: String): String? {
            if (value.matches(Regex("\\d{1,30}"))) return "code:$value"
            if (value.matches(Regex("id_\\d{1,30}"))) return value.removePrefix("id_")
            if (value.matches(Regex("(?:code|gcid|chain|encoded|personal):[A-Za-z0-9_]{1,200}(?::[A-Za-z0-9_]{1,200})?"))) return value
            if (value.startsWith("url:")) {
                val token = value.removePrefix("url:")
                if (token.matches(Regex("[A-Za-z0-9_-]{1,8000}"))) {
                    val decoded = runCatching { Base64.decode(token, Base64.URL_SAFE or Base64.NO_WRAP).toString(Charsets.UTF_8) }.getOrNull()
                    if (decoded != null && legacyUrl(decoded) != null) return value
                }
                return null
            }
            if (ExternalLinks.sourceFromUrl(value) != "kg") return null
            val raw = Regex("https?://[^\\s<>]+", RegexOption.IGNORE_CASE).find(value)?.value ?: return null
            val uri = Uri.parse(raw)
            fun parameter(key: String) = uri.getQueryParameter(key)?.takeIf { it.matches(Regex("[A-Za-z0-9_]{1,200}")) }
            val id = parameter("global_collection_id"); val chain = parameter("chain")
            if (id != null) return "gcid:$id" + (chain?.let { ":$it" } ?: "")
            if (chain != null) return "chain:$chain"
            legacyUrl(raw)?.let { return "url:" + Base64.encodeToString(it.toByteArray(Charsets.UTF_8), Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP) }
            Regex("gcid_[A-Za-z0-9_]{1,190}").find(uri.path.orEmpty())?.value?.let { return "encoded:$it" }
            if (!uri.path.orEmpty().contains("/special/single/") && !uri.path.orEmpty().endsWith("zlist.html")) {
                Regex("/([A-Za-z0-9_]{1,200})\\.html$").find(uri.path.orEmpty())?.groupValues?.get(1)?.let { return "chain:$it" }
            }
            return null
        }
        private fun legacyUrl(raw: String): String? {
            if (raw.length > 6000 || ExternalLinks.sourceFromUrl(raw) != "kg") return null
            val uri = Uri.parse(raw)
            if (uri.path?.endsWith("zlist.html") != true && uri.path != "/zlist/list") return null
            val builder = Uri.parse("https://m3ws.kugou.com/zlist/list").buildUpon()
            val allowed = setOf("userid", "uid", "listid", "id", "slid", "suid", "shareid", "type", "collect_type", "mid", "appid", "srcappid", "clientver", "clienttime", "uuid", "dfid", "share_type", "signature", "list_create_userid")
            uri.queryParameterNames.filter { it in allowed }.forEach { key ->
                val value = uri.getQueryParameter(key).orEmpty()
                require(value.length <= 512 && value.none { it.code < 32 })
                builder.appendQueryParameter(key, value)
            }
            return builder.build().toString()
        }
        internal fun sign(params: String, web: Boolean = false, body: String = ""): String {
            val key = if (web) "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt" else "OIlwieks28dk2k092lksi2UIkp"
            return MessageDigest.getInstance("MD5").digest((key + params.split('&').sorted().joinToString("") + body + key).toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it.toInt() and 255) }
        }
    }
}
