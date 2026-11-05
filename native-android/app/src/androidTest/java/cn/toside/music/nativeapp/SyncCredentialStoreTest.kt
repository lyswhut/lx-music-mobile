package cn.toside.music.nativeapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import java.security.KeyStore

@RunWith(AndroidJUnit4::class)
class SyncCredentialStoreTest {
    @Test fun storesDeviceCredentialsEncryptedAndSeparatesAddresses() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "sync-credential-test-${System.nanoTime()}"
        val alias = "sync-test-${System.nanoTime()}"
        val store = SyncCredentialStore(context, alias, name)
        val credentials = SyncCredentials("server-id", "client-id", "MDEyMzQ1Njc4OWFiY2RlZg==", "Server")
        try {
            store.save("https://example.org", credentials)
            assertEquals(credentials, store.load("https://example.org"))
            assertNull(store.load("https://other.example.org"))
            assertEquals("https://example.org", store.lastAddress())
            val values = context.getSharedPreferences(name, 0).all.values.joinToString()
            assertFalse(values.contains(credentials.clientId))
            assertFalse(values.contains(credentials.key))
            store.save("https://other.example.org", credentials.copy(serverName = "Second"))
            assertEquals(listOf("https://other.example.org", "https://example.org"), store.history().map { it.address })
            store.save("https://example.org", credentials.copy(serverName = "Renamed"))
            assertEquals(2, store.history().size); assertEquals("Renamed", store.history().first().name)
            store.remove("https://example.org")
            assertNull(store.load("https://example.org"))
            assertEquals("https://other.example.org", store.lastAddress())
            assertEquals(listOf("https://other.example.org"), SyncCredentialStore(context, alias, name).history().map { it.address })
            store.remove("https://other.example.org"); assertEquals(emptyList<SyncHost>(), store.history()); assertEquals("", store.lastAddress())
        } finally {
            context.deleteSharedPreferences(name)
            KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(alias) }
        }
    }
}
