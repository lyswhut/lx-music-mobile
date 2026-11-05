package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.utils.readBounded

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.PrivateKey
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

internal data class SyncCredentials(val serverId: String, val clientId: String, val key: String, val serverName: String = "")

/** Authentication for the original LX Music v4 synchronization protocol. */
internal class SyncAuth(private val address: String, private val deviceName: String) {
    private val root: String = URI(address.trim().trimEnd('/')).let { uri ->
        require(uri.scheme in setOf("http", "https") && !uri.host.isNullOrBlank() && uri.userInfo == null && uri.query == null && uri.fragment == null) { "同步服务地址无效" }
        uri.toASCIIString()
    }

    suspend fun authenticate(code: String? = null, saved: SyncCredentials? = null): SyncCredentials = withContext(Dispatchers.IO) {
        val (helloStatus, hello) = request("/hello")
        check(helloStatus == 200 && hello == HELLO) { "同步服务不可用或协议版本不匹配" }
        val (idStatus, idResponse) = request("/id")
        check(idStatus == 200 && idResponse.startsWith(ID_PREFIX) && idResponse.length > ID_PREFIX.length) { "无法读取同步服务 ID" }
        val serverId = idResponse.removePrefix(ID_PREFIX)
        val device = deviceName.replace('\n', ' ').replace('\r', ' ')
        if (code != null) {
            require(code.isNotBlank()) { "请输入同步码" }
            val codeKey = MessageDigest.getInstance("MD5").digest(code.toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it.toInt() and 255) }.take(16).toByteArray(Charsets.US_ASCII)
            val pair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.generateKeyPair()
            val publicKey = Base64.encodeToString(pair.public.encoded, Base64.NO_WRAP)
            val message = encrypt("$AUTH\n$publicKey\n$device\nlx_music_mobile", codeKey)
            val (status, response) = request("/ah", mapOf("m" to message))
            check(status == 200 && response != "Blocked IP" && response != "Auth failed") { "同步认证失败：$response" }
            val info = JSONObject(decryptRsa(response, pair.private))
            val clientId = info.getString("clientId"); val key = info.getString("key")
            require(clientId.isNotBlank() && Base64.decode(key, Base64.DEFAULT).size == 16) { "同步认证响应无效" }
            SyncCredentials(serverId, clientId, key, info.optString("serverName"))
        } else {
            require(saved != null && saved.serverId == serverId) { "需要同步码" }
            val key = Base64.decode(saved.key, Base64.DEFAULT)
            require(key.size == 16) { "同步密钥无效" }
            val (status, response) = request("/ah", mapOf("i" to saved.clientId, "m" to encrypt(AUTH + device, key)))
            check(status == 200 && decrypt(response, key) == HELLO) { "同步认证失败" }
            saved
        }
    }

    private fun request(path: String, headers: Map<String, String> = emptyMap()): Pair<Int, String> {
        val connection = URL(root + path).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 10_000; connection.readTimeout = 10_000
            headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
            val status = connection.responseCode
            if (status >= 500 || status == 408 || status == 429) throw SyncConnectionException("同步服务暂时不可用：HTTP $status")
            val body = (if (status >= 400) connection.errorStream else connection.inputStream)
                ?.use { it.readBounded(1024 * 1024).toString(Charsets.UTF_8) } ?: ""
            return status to body
        } finally { connection.disconnect() }
    }
    companion object {
        const val HELLO = "Hello~::^-^::~v4~"
        const val ID_PREFIX = "OjppZDo6"
        const val AUTH = "lx-music auth::"
        internal fun encrypt(text: String, key: ByteArray): String {
            val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
            cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"))
            return Base64.encodeToString(cipher.doFinal(text.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
        }
        internal fun decrypt(text: String, key: ByteArray): String {
            val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
            cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"))
            return cipher.doFinal(Base64.decode(text, Base64.DEFAULT)).toString(Charsets.UTF_8)
        }
        private fun decryptRsa(text: String, key: PrivateKey): String {
            val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA1AndMGF1Padding")
            cipher.init(Cipher.DECRYPT_MODE, key)
            return cipher.doFinal(Base64.decode(text, Base64.DEFAULT)).toString(Charsets.UTF_8)
        }
    }
}
