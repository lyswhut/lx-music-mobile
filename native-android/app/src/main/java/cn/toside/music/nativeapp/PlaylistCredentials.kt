package cn.toside.music.nativeapp

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** NetEase's optional ###MUSIC_U suffix is stored separately from shared playlist metadata. */
internal class PlaylistCredentials(context: Context, private val alias: String = "lx-playlist-credentials", name: String = "playlist-credentials") {
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    private val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private fun key(): SecretKey = synchronized(lock) {
        (keystore.getKey(alias, null) as? SecretKey) ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").run {
            init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
            generateKey()
        }
    }
    fun save(id: String, token: String) {
        require(id.matches(Regex("\\d{1,30}")))
        validate(token)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key())
        val payload = cipher.iv + cipher.doFinal(token.toByteArray(Charsets.UTF_8))
        check(preferences.edit().putString("wy:$id", Base64.encodeToString(payload, Base64.NO_WRAP)).commit()) { "无法保存歌单访问凭据" }
    }
    fun load(id: String): String? = runCatching {
        val saved = preferences.getString("wy:$id", null) ?: return@runCatching null
        val payload = Base64.decode(saved, Base64.DEFAULT); require(payload.size > 28)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, payload.copyOfRange(0, 12)))
        cipher.doFinal(payload.copyOfRange(12, payload.size)).toString(Charsets.UTF_8).also(::validate)
    }.getOrNull()
    fun clear() { check(preferences.edit().clear().commit()) { "无法清除歌单访问凭据" } }
    companion object {
        private val lock = Any()
        internal fun validate(token: String) { require(token.length in 1..4096 && token.all { it.code in 33..126 && it != ';' && it != '"' && it != '\\' }) { "歌单访问凭据格式无效" } }
    }
}
