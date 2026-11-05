package cn.toside.music.nativeapp.utils

import android.Manifest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PermissionPolicyTest {
    @Test fun readsOtherAppsAudioWithTheVersionAppropriatePermission() {
        assertEquals(Manifest.permission.READ_EXTERNAL_STORAGE, PermissionPolicy.audio(28))
        assertEquals(Manifest.permission.READ_EXTERNAL_STORAGE, PermissionPolicy.audio(32))
        assertEquals(Manifest.permission.READ_MEDIA_AUDIO, PermissionPolicy.audio(33))
        assertEquals(Manifest.permission.READ_MEDIA_AUDIO, PermissionPolicy.audio(36))
    }
    @Test fun downloadsNeedLegacyWritePermissionOnlyOnAndroidNine() {
        assertEquals(Manifest.permission.WRITE_EXTERNAL_STORAGE, PermissionPolicy.downloadWrite(28))
        assertNull(PermissionPolicy.downloadWrite(29))
        assertNull(PermissionPolicy.downloadWrite(36))
    }
}
