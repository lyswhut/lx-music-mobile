package cn.toside.music.nativeapp

import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SearchAndCommentsTest {
    @Test fun parsesFiveProviderSuggestionsAndHotWords() {
        val api = SearchSuggestions()
        val tips = mapOf(
            "kw" to """{"WORDITEMS":[{"RELWORD":"A &amp; B"}]}""",
            "kg" to """{"data":[{"RecordDatas":[{"HintInfo":"A &amp; B"}]}]}""",
            "tx" to """{"data":{"song":{"itemlist":[{"name":"A","singer":"B"}]}}}""",
            "wy" to """{"result":{"songs":[{"name":"A","artists":[{"name":"B"},{"name":"C"}]}]}}""",
            "mg" to """{"songs":[{"name":"A","singerName":"B"}]}""")
        tips.forEach { (source, fixture) -> assertTrue(source, api.parseSuggestions(source, JSONObject(fixture)).single().startsWith("A")) }
        val hot = mapOf(
            "kw" to """{"tagvalue":[{"key":"One"},{"key":"One"},{"key":""}]}""",
            "kg" to """{"data":{"list":[{"keywords":[{"keyword":"One"}]}]}}""",
            "tx" to """{"hotkey":{"data":{"vec_hotkey":[{"query":"One"}]}}}""",
            "wy" to """{"data":[{"searchWord":"One"}]}""",
            "mg" to """{"data":{"hotwords":[{"hotwordList":[{"resourceType":"song","word":"One"},{"resourceType":"album","word":"Other"}]}]}}""")
        hot.forEach { (source, fixture) -> assertEquals(source, listOf("One"), api.parseHot(source, JSONObject(fixture))) }
        assertEquals(listOf("Current"), api.parseHot("wy", JSONObject("""{"data":{"itemList":[{"searchWord":"Current"}]}}""")))
    }
    @Test fun historiesDeduplicatePersistAndClearIndependentlyOfQueue() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "history-test-${System.nanoTime()}"
        try {
            val history = SearchHistory(context, name)
            history.add(" first "); history.add("second"); history.add("FIRST")
            assertEquals(listOf("FIRST", "second"), SearchHistory(context, name).list())
            history.remove("second"); assertEquals(listOf("FIRST"), history.list()); history.clear(); assertTrue(history.list().isEmpty())
            val recent = RecentSongs(context, name)
            val song = Song(1, Uri.parse("content://media/1"), "one", "artist", 1000)
            val other = song.copy(source = "kw", sourceInfo = """{"songmid":"1"}""")
            recent.record(song); recent.record(other); recent.record(song.copy(title = "updated"))
            assertEquals(listOf("updated", "one"), RecentSongs(context, name).list().map { it.title })
            assertEquals(other.sourceInfo, recent.list().last().sourceInfo)
            recent.clear(); assertTrue(recent.list().isEmpty())
        } finally { context.deleteSharedPreferences(name) }
    }
    @Test fun commentsPreserveRepliesPicturesAndPaginationAcrossProviders() {
        val api = OnlineComments()
        val kw = api.parse("kw", JSONObject("""{"comments_counts":2,"comments":[{"id":"1","msg":"line\\nnext","u_name":"name","mpic":"https%3A%2F%2Fimg.test%2Fa.jpg","child_comments":[{"id":"2","msg":"reply"}]}]}"""), false, 1, 1)
        assertTrue(kw.hasMore); assertEquals("https://img.test/a.jpg", kw.comments.single().images.single()); assertEquals("reply", kw.comments.single().replies.single().text)
        val kg = api.parse("kg", JSONObject("""{"count":1,"list":[{"id":"1","content":"[at=2] &amp; text","atlist":[{"id":2,"name":"user"}],"images":[{"url":"https://img.test/kg"}],"like":{"likenum":3},"reply_num":5,"pcontent":"parent","puser":"root"}]}"""), true, 1)
        assertFalse(kg.hasMore); assertEquals("parent", kg.comments.single().text); assertEquals("@user  & text", kg.comments.single().replies.single().text)
        val wy = api.parse("wy", JSONObject("""{"data":{"totalCount":1,"comments":[{"commentId":1,"content":"child","user":{"nickname":"user"},"beReplied":[{"beRepliedCommentId":2,"content":"parent","user":{"nickname":"root"}}]}]}}"""), false, 1)
        assertEquals("parent", wy.comments.single().text); assertEquals("child", wy.comments.single().replies.single().text)
        val tx = api.parse("tx", JSONObject("""{"req":{"data":{"CommentList":{"Total":1,"Comments":[{"SeqNo":"1","CmId":"2","Content":"hot","Nick":"name","Pic":"https://img.test/tx","SubComments":[{"SeqNo":"3","Content":"reply"}]}]}}}}"""), true, 1)
        assertEquals("1_2", tx.comments.single().id); assertEquals("reply", tx.comments.single().replies.single().text)
        val mg = api.parse("mg", JSONObject("""{"data":{"commentNums":1,"comments":[{"commentId":"1","commentInfo":"migu","replyTotalCount":3,"user":{"nickName":"user"},"replyComments":[{"replyId":"2","replyInfo":"reply","user":{"nickName":"other"}}]}]}}"""), false, 1)
        assertEquals(3, mg.comments.single().replyCount); assertEquals("reply", mg.comments.single().replies.single().text)
    }
}
