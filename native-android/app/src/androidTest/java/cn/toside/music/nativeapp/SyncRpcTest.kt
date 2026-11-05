package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SyncRpcTest {
    @Test fun jsonSerializationMatchesJavascriptForSyncHashInputs() {
        val json = JSONObject().put("path", "/music/a.mp3").put("note", "中文😀").put("html", "</x>").put("n", JSONObject.NULL)
        assertEquals("""{"path":"/music/a.mp3","note":"中文😀","html":"</x>","n":null}""", SyncWire.stringifyForHash(json))
    }
    @Test fun emitsMessage2call013CompatibleEnvelope() = runBlocking {
        lateinit var rpc: SyncRpc
        var sent: JSONObject? = null
        rpc = SyncRpc({ message ->
            sent = JSONObject(message.toString())
            rpc.receive(JSONObject().put("name", message.getString("name")).put("error", JSONObject.NULL).put("data", "ok"))
        }, emptyMap(), 1000)
        try {
            assertEquals("ok", rpc.call(listOf("list", "method"), JSONArray().put(42)))
            val message = sent!!
            assertTrue(message.getString("name").startsWith("list.method__"))
            assertEquals("[\"list\",\"method\"]", message.getJSONArray("path").toString())
            assertEquals(42, message.getJSONArray("data").getInt(0))
        } finally { rpc.close() }
    }
    @Test fun callsPeerAndPropagatesErrors() = runBlocking {
        lateinit var left: SyncRpc
        lateinit var right: SyncRpc
        left = SyncRpc({ right.receive(JSONObject(it.toString())) }, emptyMap(), 1000)
        right = SyncRpc({ left.receive(JSONObject(it.toString())) }, mapOf(
            "list.echo" to { args -> args.getString(0) },
            "fail" to { _ -> error("remote failure") },
        ), 1000)
        try {
            assertEquals("你好", left.call(listOf("list", "echo"), JSONArray().put("你好")))
            try { left.call(listOf("fail")); fail("failure must propagate") }
            catch (e: IllegalStateException) { assertEquals("remote failure", e.message) }
            try { left.call(listOf("missing")); fail("missing method must fail") }
            catch (e: IllegalStateException) { assertEquals("missing is not defined", e.message) }
        } finally { left.close(); right.close() }
    }

    @Test fun closeFailsOutstandingCalls() = runBlocking {
        val rpc = SyncRpc({}, emptyMap(), 10_000)
        val result = async { runCatching { rpc.call(listOf("waiting")) } }
        delay(50)
        rpc.close()
        val failure = withTimeout(1000) { result.await().exceptionOrNull() }
        assertTrue(failure is IllegalStateException)
    }
}
