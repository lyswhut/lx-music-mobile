package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.utils.NativeHttp

import android.content.Context
import android.text.Html
import org.json.JSONArray
import org.json.JSONObject

internal class SearchHistory(context: Context, name: String = "search-history") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    fun list(): List<String> = runCatching { JSONArray(preferences.getString("terms", "[]")).let { a ->
        (0 until a.length()).map { a.getString(it) }
    } }.getOrDefault(emptyList())
    fun add(query: String) {
        val value = query.trim().take(200); if (value.isEmpty()) return
        val terms = (listOf(value) + list().filterNot { it.equals(value, true) }).take(50)
        preferences.edit().putString("terms", JSONArray(terms).toString()).apply()
    }
    fun remove(query: String) { preferences.edit().putString("terms", JSONArray(list().filterNot { it == query }).toString()).apply() }
    fun clear() { preferences.edit().clear().apply() }
}

internal class SearchSuggestions {
    suspend fun suggestions(source: String, query: String): List<String> {
        // The old Migu web suggestion endpoint now returns its HTML site (and was disabled in RN).
        // Build suggestions from the working native public song search instead.
        if (source == "mg") return OnlineSearch().search(query, source = "mg").take(10).map { "${it.title} - ${it.artist}" }.distinct()
        val q = NativeHttp.encode(query)
        val result = when (source) {
            "kw" -> NativeHttp.json("https://tips.kuwo.cn/t.s?corp=kuwo&newver=3&p2p=1&notrace=0&c=mbox&w=$q&encoding=utf8&rformat=json")
            "kg" -> NativeHttp.json("https://searchtip.kugou.com/getSearchTip?MusicTipCount=10&keyword=$q", headers = mapOf("Referer" to "https://www.kugou.com/"))
            "tx" -> NativeHttp.json("https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?format=json&key=$q&inCharset=utf8&outCharset=utf-8", headers = mapOf("Referer" to "https://y.qq.com/"))
            "wy" -> NeteaseApi().publicRequest("/weapi/search/suggest/web", JSONObject().put("s", query))
            else -> return emptyList()
        }
        return parseSuggestions(source, result)
    }
    suspend fun hot(source: String): List<String> {
        val result = when (source) {
            "kw" -> NativeHttp.json("http://hotword.kuwo.cn/hotword.s?prod=kwplayer_ar_9.3.0.1&newver=2&uid=0&plat=kwplayer_ar&rformat=json&encoding=utf8&tabid=1")
            "kg" -> NativeHttp.json("http://gateway.kugou.com/api/v3/search/hot_tab?signature=ee44edb9d7155821412d220bcaf509dd&appid=1005&clientver=10026&plat=0", headers = mapOf(
                "dfid" to "1ssiv93oVqMp27cirf2CvoF1", "mid" to "156798703528610303473757548878786007104", "clienttime" to "1584257267",
                "x-router" to "msearch.kugou.com", "kg-rc" to "1", "User-Agent" to "Android9-AndroidPhone-10020-130-0-searchrecommendprotocol-wifi"))
            "tx" -> NativeHttp.json("https://u.y.qq.com/cgi-bin/musicu.fcg", JSONObject().put("comm", JSONObject().put("ct", "19").put("cv", "1803"))
                .put("hotkey", JSONObject().put("method", "GetHotkeyForQQMusicPC").put("module", "tencent_musicsoso_hotkey.HotkeyService")
                    .put("param", JSONObject().put("search_id", "").put("uin", 0))), mapOf("Referer" to "https://y.qq.com/"))
            "wy" -> NativeHttp.json("http://interface.music.163.com/eapi/batch", form = mapOf("params" to OnlineSearch().eapi("/api/search/chart/detail",
                JSONObject().put("id", "HOT_SEARCH_SONG#@#").toString())), headers = mapOf("Origin" to "https://music.163.com"))
            "mg" -> NativeHttp.json("http://jadeite.migu.cn:7090/music_search/v3/search/hotword")
            else -> return emptyList()
        }
        return parseHot(source, result)
    }
    internal fun parseSuggestions(source: String, data: JSONObject): List<String> = clean(when (source) {
        "kw" -> strings(data.optJSONArray("WORDITEMS"), "RELWORD")
        "kg" -> strings(data.optJSONArray("data")?.optJSONObject(0)?.optJSONArray("RecordDatas"), "HintInfo")
        "tx" -> objects(data.optJSONObject("data")?.optJSONObject("song")?.optJSONArray("itemlist")).map { "${it.optString("name")} - ${it.optString("singer")}" }
        "wy" -> objects(data.optJSONObject("result")?.optJSONArray("songs")).map { song ->
            "${song.optString("name")} - ${strings(song.optJSONArray("artists"), "name").joinToString("、")}" }
        "mg" -> objects(data.optJSONArray("songs")).map { "${it.optString("name")} - ${it.optString("singerName")}" }
        else -> emptyList()
    })
    internal fun parseHot(source: String, data: JSONObject): List<String> = clean(when (source) {
        "kw" -> strings(data.optJSONArray("tagvalue"), "key")
        "kg" -> objects(data.optJSONObject("data")?.optJSONArray("list")).flatMap { strings(it.optJSONArray("keywords"), "keyword") }
        "tx" -> strings(data.optJSONObject("hotkey")?.optJSONObject("data")?.optJSONArray("vec_hotkey"), "query")
        "wy" -> strings(data.optJSONObject("data")?.optJSONArray("itemList") ?: data.optJSONArray("data"), "searchWord")
        "mg" -> objects(data.optJSONObject("data")?.optJSONArray("hotwords")?.optJSONObject(0)?.optJSONArray("hotwordList"))
            .filter { it.optString("resourceType") == "song" }.map { it.optString("word") }
        else -> emptyList()
    })
    private fun objects(a: JSONArray?): List<JSONObject> = if (a == null) emptyList() else (0 until a.length()).mapNotNull { a.optJSONObject(it) }
    private fun strings(a: JSONArray?, key: String) = objects(a).map { it.optString(key) }
    private fun clean(values: List<String>) = values.map { Html.fromHtml(it, Html.FROM_HTML_MODE_LEGACY).toString().trim() }.filter { it.isNotBlank() }.distinct().take(50)
}
