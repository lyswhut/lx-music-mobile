package cn.toside.music.nativeapp

import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class KugouSharedPlaylistsTest {
    @Test fun recognizesCommandsCollectionsEncodedIdsAndChainsWithoutConfusingSpecialIds() = runBlocking {
        val examples = mapOf("123456" to "code:123456", "id_123456" to "123456",
            "https://m.kugou.com/share/?global_collection_id=abc123&chain=def456" to "gcid:abc123:def456",
            "https://m.kugou.com/share/?chain=def456" to "chain:def456",
            "https://www.kugou.com/songlist/gcid_abcd/" to "encoded:gcid_abcd",
            "https://www.kugou.com/share/abcd.html" to "chain:abcd")
        examples.forEach { (value, expected) ->
            assertEquals(expected, KugouSharedPlaylists.reference(value))
            assertEquals(expected, ExternalLinks.playlist("kg", value).id)
        }
        assertEquals("123", ExternalLinks.playlist("kg", "https://www.kugou.com/yy/special/single/123.html").id)
        assertNull(KugouSharedPlaylists.reference("https://kugou.com.evil.invalid/?chain=abcd"))
        assertNull(KugouSharedPlaylists.reference("https://m.kugou.com/share/?chain=ab%0D%0Acd"))
    }
    private fun hashes(start: Int, size: Int) = JSONArray().apply {
        repeat(size) { put(JSONObject().put("hash", "%032x".format(start + it))) }
    }
    private fun songs(values: List<JSONObject>) = values.map {
        Song(it.getString("hash").takeLast(8).toLong(16), Uri.EMPTY, "fixture", "artist", 1000, "kg", it.toString())
    }
    @Test fun codeResolvesCollectionAndPagesAllHashesIncludingEmptyFinalPage() = runBlocking {
        val requestedPages = mutableListOf<Int>()
        val api = KugouSharedPlaylists({ url, body, _ ->
            if (url.contains("/command/")) {
                assertEquals("123456", body!!.getString("data"))
                JSONObject().put("errcode", 0).put("data", JSONObject().put("info", JSONObject().put("type", 2).put("global_collection_id", "shared1")))
            } else {
                val uri = Uri.parse(url)
                assertEquals("shared1", uri.getQueryParameter("global_collection_id"))
                val page = uri.getQueryParameter("page")!!.toInt(); requestedPages.add(page)
                JSONObject().put("error_code", 0).put("data", JSONObject().put("info", when (page) { 1 -> hashes(1, 100); 2 -> hashes(101, 1); else -> JSONArray() }))
            }
        }, ::songs)
        val result = mutableListOf<Song>()
        for (page in 1..3) result.addAll(api.songs("code:123456", page))
        assertEquals(101, result.size); assertEquals(101, result.map { it.id }.toSet().size)
        assertEquals(listOf(1, 2, 3), requestedPages)
    }
    @Test fun userCommandPageAndEncodedCollectionFollowOriginalRequestShapes() = runBlocking {
        val api = KugouSharedPlaylists({ url, body, _ ->
            when {
                url.contains("/command/") -> JSONObject().put("data", JSONObject().put("info", JSONObject().put("type", 4).put("userid", 42).put("id", 15)))
                url.contains("kucodeAndShare") -> {
                    val data = body!!.getJSONObject("data")
                    assertEquals(2, data.getInt("page")); assertEquals(100, data.getInt("pagesize")); assertEquals(42, data.getInt("userid"))
                    JSONObject().put("data", hashes(101, 1))
                }
                url.contains("batch_decode") -> {
                    assertEquals("gcid_encoded", body!!.getJSONArray("data").getJSONObject(0).getString("id"))
                    assertEquals(2, body.getJSONArray("data").getJSONObject(0).getInt("id_type"))
                    JSONObject().put("data", JSONObject().put("list", JSONArray().put(JSONObject().put("global_collection_id", "decoded1"))))
                }
                else -> {
                    assertEquals("decoded1", Uri.parse(url).getQueryParameter("global_collection_id"))
                    JSONObject().put("data", JSONObject().put("info", hashes(5, 1)))
                }
            }
        }, ::songs)
        assertEquals(101, api.songs("code:123456", 2).single().id)
        assertEquals(5, api.songs("encoded:gcid_encoded", 1).single().id)
        try { api.songs("gcid:abc\r\n", 1); fail("invalid reference must fail") } catch (_: IllegalArgumentException) { }
    }
    @Test fun chainUsesShareEndpointAndFallbackDoesNotTreatMissingDataAsEmptyPlaylist() = runBlocking {
        val calls = mutableListOf<String>()
        val api = KugouSharedPlaylists({ url, _, _ ->
            calls.add(url)
            when {
                url.contains("schain/transfer") -> JSONObject().put("data", JSONObject().put("global_collection_id", "personal"))
                url.contains("m3ws.kugou.com") -> throw java.io.IOException("old collection")
                else -> JSONObject().put("data", JSONObject().put("info", hashes(10, 1)))
            }
        }, ::songs)
        assertEquals(10, api.songs("chain:abcd", 1).single().id); assertEquals(3, calls.size)
        val broken = KugouSharedPlaylists({ _, _, _ -> JSONObject().put("data", JSONObject()) }, ::songs)
        try { broken.songs("gcid:missing", 1); fail("missing list must prevent destructive refresh") } catch (_: IllegalStateException) { }
    }
    @Test fun h5PersonalSignatureMatchesOriginalInfSignAndPcPageSupportsNestedJsonAndPagination() = runBlocking {
        val api = KugouSharedPlaylists({ url, _, _ ->
            if (url.contains("schain/transfer")) JSONObject().put("data", JSONObject().put("id", "123")) else {
                val uri = Uri.parse(url)
                assertEquals("c5fd9431c3c9bce7a761a85c576ea672", uri.getQueryParameter("signature"))
                assertEquals("2", uri.getQueryParameter("page")); assertEquals("100", uri.getQueryParameter("pagesize"))
                JSONObject().put("data", JSONObject().put("info", hashes(101, 1)))
            }
        }, ::songs)
        assertEquals(101L, api.songs("chain:old", 2).single().id)
        val desktop = KugouSharedPlaylists({ _, _, _ -> throw java.io.IOException("old endpoint") }, ::songs, text = { url ->
            assertEquals("https://www.kugou.com/share/desktop.html", url)
            "<script>var dataFromSmarty = " + hashes(1, 2).apply { getJSONObject(0).put("extra", JSONArray().put("nested")) }.toString() + ";</script>"
        })
        assertEquals(listOf(1L, 2L), desktop.songs("chain:desktop", 1).map { it.id })
        assertTrue(desktop.songs("chain:desktop", 2).isEmpty())
    }
    @Test fun legacyZlistUsesTrustedEndpointAndRequestedPageInsteadOfSharedPageSize() = runBlocking {
        val reference = ExternalLinks.playlist("kg", "https://www.kugou.com/zlist.html?userid=42&listid=15&pagesize=30&page=1").id
        assertTrue(reference.startsWith("url:"))
        val api = KugouSharedPlaylists({ url, _, _ ->
            val uri = Uri.parse(url)
            assertEquals("m3ws.kugou.com", uri.host); assertEquals("/zlist/list", uri.path)
            assertEquals("42", uri.getQueryParameter("userid")); assertEquals("15", uri.getQueryParameter("listid"))
            assertEquals(listOf("2"), uri.getQueryParameters("page")); assertEquals(listOf("100"), uri.getQueryParameters("pagesize"))
            JSONObject().put("data", JSONObject().put("list", JSONObject().put("info", hashes(101, 1))))
        }, ::songs)
        assertEquals(101L, api.songs(reference, 2).single().id)
        assertNull(KugouSharedPlaylists.reference("https://kugou.com.evil.invalid/zlist.html?userid=42"))
    }
}
