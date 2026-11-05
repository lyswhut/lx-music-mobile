package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.security.MessageDigest

@RunWith(AndroidJUnit4::class)
class NeteaseApiTest {
    @Test fun groupsPlaylistCategoriesInProviderOrder() {
        val data = org.json.JSONObject("""{"categories":{"1":"风格","0":"语种"},"sub":[
            {"category":1,"name":"摇滚"},{"category":0,"name":"华语"},{"category":0,"name":"华语"}]}""")
        val categories = NeteaseApi().parseCategories(data)
        org.junit.Assert.assertEquals(listOf("语种", "风格"), categories.map { it.name })
        org.junit.Assert.assertEquals(listOf("华语"), categories.first().tags)
    }
    @Test fun weapiEncryptionMatchesOriginalProtocol() {
        val (params, encryptedKey) = NeteaseApi().encrypt("{}", "0123456789abcdef")
        assertEquals("kxBNj/l03n7aQ/q0EdABwtOsIYuwYGkESNTUk4QvWCg=", params)
        val digest = MessageDigest.getInstance("SHA-256").digest(encryptedKey.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
        assertEquals("6e9d36499936641384b17788bce6a2aceb8a354b3764308148a45e2a48e6af8b", digest)
    }
    @Test fun detailMatchesPrivilegesById() {
        val data = JSONObject("""{"songs":[{"id":1,"name":"First","dt":1000,"ar":[],"al":{}},
          {"id":2,"name":"Second","dt":2000,"ar":[],"al":{}}],
          "privileges":[{"id":2,"maxbr":320000},{"id":1,"maxbr":128000}]}""")
        val songs = NeteaseApi().parseSongs(data)
        assertEquals(listOf("First", "Second"), songs.map { it.title })
        assertEquals(1, JSONObject(songs[0].sourceInfo!!).getJSONArray("types").length())
        assertEquals(2, JSONObject(songs[1].sourceInfo!!).getJSONArray("types").length())
    }
}
