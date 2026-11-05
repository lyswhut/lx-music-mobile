package cn.toside.music.nativeapp.sync

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import org.json.JSONArray
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Saves the issued device key, never the user-entered sync code. */
internal data class SyncHost(val address: String, val name: String)
internal class SyncCredentialStore(
    context: Context,
    private val alias: String = "lx-sync-credentials",
    preferencesName: String = "sync-credentials",
) {
    private val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    private val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    private fun key(): SecretKey = synchronized(lock) {
        (keystore.getKey(alias, null) as? SecretKey)?.let { return@synchronized it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        generator.generateKey()
    }
    private fun preferenceKey(address: String): String = MessageDigest.getInstance("SHA-256")
        .digest(address.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it.toInt() and 255) }

    fun lastAddress(): String = preferences.getString("lastAddress", "") ?: ""
    fun history(): List<SyncHost> = runCatching {
        val array = JSONArray(preferences.getString("hosts", "[]"))
        (0 until minOf(array.length(), 20)).mapNotNull { index -> array.optJSONObject(index)?.let {
            val address = it.optString("address"); if (address.isBlank()) null else SyncHost(address, it.optString("name"))
        } }
    }.getOrDefault(emptyList()).ifEmpty { lastAddress().takeIf { it.isNotBlank() }?.let { listOf(SyncHost(it, "")) } ?: emptyList() }
    fun save(address: String, credentials: SyncCredentials) = synchronized(lock) {
        val plain = JSONObject().put("serverId", credentials.serverId).put("clientId", credentials.clientId)
            .put("key", credentials.key).put("serverName", credentials.serverName).toString().toByteArray(Charsets.UTF_8)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        val payload = cipher.iv + cipher.doFinal(plain)
        check(preferences.edit().putString(preferenceKey(address), Base64.encodeToString(payload, Base64.NO_WRAP))
            .putString("lastAddress", address).putString("hosts", hostsJson((listOf(SyncHost(address, credentials.serverName.take(200))) + history().filterNot { it.address == address }).take(20)))
            .commit()) { "无法保存同步授权" }
    }
    fun load(address: String): SyncCredentials? {
        val saved = preferences.getString(preferenceKey(address), null) ?: return null
        return runCatching {
            val payload = Base64.decode(saved, Base64.DEFAULT)
            require(payload.size > 12 + 16)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, payload.copyOfRange(0, 12)))
            val data = JSONObject(cipher.doFinal(payload.copyOfRange(12, payload.size)).toString(Charsets.UTF_8))
            SyncCredentials(data.getString("serverId"), data.getString("clientId"), data.getString("key"), data.optString("serverName"))
        }.getOrNull()
    }
    fun remove(address: String) = synchronized(lock) {
        val remaining = history().filterNot { it.address == address }
        check(preferences.edit().remove(preferenceKey(address)).putString("hosts", hostsJson(remaining))
            .putString("lastAddress", if (lastAddress() == address) remaining.firstOrNull()?.address.orEmpty() else lastAddress()).commit()) { "无法移除同步授权" }
    }
    private fun hostsJson(hosts: List<SyncHost>) = JSONArray(hosts.map { JSONObject().put("address", it.address).put("name", it.name) }).toString()
    companion object { private val lock = Any() }
}
