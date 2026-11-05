package cn.toside.music.nativeapp

import org.junit.Assert.assertEquals
import org.junit.Test

class MrcCipherTest {
    @Test fun matchesTheExistingJavascriptProviderForSigned64BitArithmetic() {
        // Fixture generated and independently decrypted by src/utils/musicSdk/mg/utils/mrc.js.
        val cipher = "2eeccd89f42efd159e4d154615819df74d9d50dc81e0775ec16e776b8e43f3165f9c53c8b7c41f381fdde84ad3f5c790817884e64da2a97735fff5a31754b7d3d0e20135c6e6f18294381e427cbe9ac7b229cb035f1ab22d5bff2e8e4b656bca"
        assertEquals("[0,1000]Hello(0,1000)\n[1000,800]World(1000,800)\n", MrcCipher.decrypt(cipher))
        assertEquals("[00:00.00]plain", MrcCipher.decrypt("[00:00.00]plain"))
    }
}
