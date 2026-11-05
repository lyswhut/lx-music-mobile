package cn.toside.music.nativeapp

import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.widget.Button
import android.widget.EditText
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

@RunWith(AndroidJUnit4::class)
class LocalMetadataTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val context get() = instrumentation.targetContext
    private fun wave(): ByteArray {
        val pcm = ByteArray(16000)
        return ByteBuffer.allocate(44 + pcm.size).order(ByteOrder.LITTLE_ENDIAN).apply {
            put("RIFF".toByteArray()); putInt(36 + pcm.size); put("WAVEfmt ".toByteArray()); putInt(16); putShort(1); putShort(1)
            putInt(8000); putInt(16000); putShort(2); putShort(16); put("data".toByteArray()); putInt(pcm.size); put(pcm)
        }.array()
    }
    private fun cover(): ByteArray = ByteArrayOutputStream().also { out -> Bitmap.createBitmap(8, 8, Bitmap.Config.ARGB_8888).apply {
        eraseColor(Color.BLUE); compress(Bitmap.CompressFormat.PNG, 100, out); recycle()
    } }.toByteArray()
    private fun fixture() = File(context.filesDir, "tag-fixture-${System.nanoTime()}.wav").apply { writeBytes(wave()) }
    private fun song(file: File) = Song(System.nanoTime(), Uri.fromFile(file), "Original", "Artist", 1000)
    private fun waitUntil(condition: () -> Boolean) {
        val deadline = android.os.SystemClock.elapsedRealtime() + 15000
        while (!condition() && android.os.SystemClock.elapsedRealtime() < deadline) android.os.SystemClock.sleep(50)
        assertTrue(condition())
    }
    @Test fun writesRealAudioTagsCoverAndEmbeddedLyricsWithoutChangingPcm() = runBlocking {
        val file = fixture(); val song = song(file)
        try {
            val picture = cover(); val value = LocalMetadata("新歌曲", "New Artist", "Album", "[00:00.20]Embedded lyric", picture)
            val updated = LocalTags.write(context, song, value)
            val read = LocalTags.read(context, updated)
            assertEquals(value.title, read.title); assertEquals(value.artist, read.artist); assertEquals(value.album, read.album)
            assertEquals(value.lyric, read.lyric); assertArrayEquals(picture, read.artwork)
            assertEquals(value.lyric, LocalTags.lyric(context, updated))
            assertEquals("Album", JSONObject(updated.sourceInfo!!).getString("albumName"))
            val retriever = MediaMetadataRetriever()
            try { retriever.setDataSource(file.path); assertEquals("1000", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)) }
            finally { retriever.release() }
            val bytes = file.readBytes(); var offset = 12; var pcm: ByteArray? = null
            while (offset + 8 <= bytes.size) {
                val size = ByteBuffer.wrap(bytes, offset + 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
                if (String(bytes, offset, 4) == "data") { pcm = bytes.copyOfRange(offset + 8, offset + 8 + size); break }
                offset += 8 + size + (size and 1)
            }
            assertArrayEquals(ByteArray(16000), pcm)
            val before = file.readBytes()
            assertTrue(runCatching { LocalTags.write(context, updated, value.copy(artwork = byteArrayOf(0, 1, 2))) }.isFailure)
            assertArrayEquals(before, file.readBytes())
            LocalTags.write(context, updated, value.copy(lyric = "", artwork = null))
            assertTrue(LocalTags.read(context, updated).lyric.isEmpty()); assertNull(LocalTags.read(context, updated).artwork)
        } finally { file.delete() }
    }
    @Test fun updatesAllPlaylistReferencesAndMaterializesCompatibleSyncAndBackup() = runBlocking {
        val file = fixture(); val song = song(file); val name = "metadata-${System.nanoTime()}.db"; val lists = Playlists(context, name)
        try {
            lists.setSyncTracking(true)
            val first = lists.create("First"); val second = lists.create("Second")
            lists.add(first, song); lists.add(second, song)
            val updated = LocalTags.write(context, song, LocalMetadata("Changed", "Singer", "Album", "", null))
            lists.updateLocalMetadata(updated)
            assertEquals(updated, lists.songs(first).single()); assertEquals(updated, lists.songs(second).single())
            var remote = JSONObject("""{"defaultList":[],"loveList":[],"userList":[]}""")
            val events = lists.pendingSyncActions(mapOf(song.id to file.path))
            assertEquals(2, events.count { it.event.getString("action") == "list_music_update" })
            events.forEach { remote = SyncListReducer.apply(remote, it.event) }
            val users = remote.getJSONArray("userList")
            for (index in 0 until users.length()) {
                val item = users.getJSONObject(index).getJSONArray("list").getJSONObject(0)
                assertEquals("Changed", item.getString("name")); assertEquals("Album", item.getJSONObject("meta").getString("albumName"))
                assertEquals("local_${file.path}", item.getString("id")); assertFalse(item.has("__nativeLocalMediaId"))
            }
            val imported = LegacyBackup.parse(LegacyBackup.encode(listOf(lists.list().first { it.id == first } to lists.songs(first)), mapOf(song.id to file.path)), mapOf(file.path to updated))
            assertEquals(updated, imported.lists.single().songs.single())
        } finally { lists.close(); context.deleteDatabase(name); file.delete() }
    }
    @Test fun nativeEditorRetainsUnsavedFieldsOnRecreationAndWritesFile() = runBlocking {
        val file = fixture(); val song = song(file); var activity: MetadataActivity? = null
        fun field(name: String) = MetadataActivity::class.java.getDeclaredField(name).apply { isAccessible = true }.get(activity)
        try {
            activity = instrumentation.startActivitySync(MetadataActivity.intentFor(context, song).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MetadataActivity
            waitUntil { (field("save") as Button).isEnabled }
            val longLyric = "[00:00]" + "Long lyrics ".repeat(7000)
            instrumentation.runOnMainSync { (field("titleInput") as EditText).setText("Edited in native UI"); (field("albumInput") as EditText).setText("New album"); (field("lyricInput") as EditText).setText(longLyric) }
            val monitor = instrumentation.addMonitor(MetadataActivity::class.java.name, null, false)
            instrumentation.runOnMainSync { activity!!.recreate() }
            activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MetadataActivity
            waitUntil { (field("save") as Button).isEnabled }
            assertEquals("Edited in native UI", (field("titleInput") as EditText).text.toString())
            assertEquals(longLyric, (field("lyricInput") as EditText).text.toString())
            instrumentation.runOnMainSync { (field("save") as Button).performClick() }
            waitUntil { activity!!.isFinishing }
            val read = LocalTags.read(context, song); assertEquals("Edited in native UI", read.title); assertEquals("New album", read.album); assertEquals(longLyric, read.lyric)
        } finally { instrumentation.runOnMainSync { activity?.finish() }; file.delete() }
    }
    @Test fun editsMediaStoreAudioThroughFileDescriptor() = runBlocking {
        if (Build.VERSION.SDK_INT < 29) return@runBlocking
        val uri = context.contentResolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, ContentValues().apply {
            put(MediaStore.Audio.Media.DISPLAY_NAME, "native-tag-${System.nanoTime()}.wav"); put(MediaStore.Audio.Media.MIME_TYPE, "audio/wav"); put(MediaStore.Audio.Media.IS_PENDING, 1)
        })!!
        try {
            context.contentResolver.openOutputStream(uri)!!.use { it.write(wave()) }
            val song = Song(123, uri, "Original", "Artist", 1000)
            LocalTags.write(context, song, LocalMetadata("MediaStore title", "Singer", "Album", "[00:00]Line", null))
            assertEquals("MediaStore title", LocalTags.read(context, song).title)
            assertEquals("[00:00]Line", LocalTags.lyric(context, song))
        } finally { context.contentResolver.delete(uri, null, null) }
    }
    @Test fun metadataMatchingUsesSelectedLocalSourceWithoutChangingThePlaybackRuntime() = runBlocking {
        val directory = File(context.cacheDir, "metadata-source-${System.nanoTime()}").apply { mkdirs() }
        val isolated = object : android.content.ContextWrapper(context) { override fun getFilesDir() = directory }
        val source = UserSource(isolated)
        try {
            source.import("""
                /** @name Metadata matching fixture */
                lx.on(lx.EVENT_NAMES.request, async ({action,info}) => {
                    if(info.musicInfo.name !== 'Match title' || info.musicInfo.singer !== 'Match artist') throw new Error('wrong reference');
                    if(action === 'lyric') return {lyric:'[00:00.20]Matched lyric'};
                    return 'https://example.org/cover.png';
                });
                lx.send(lx.EVENT_NAMES.inited,{sources:{local:{type:'music',actions:['lyric','pic'],qualitys:[]}}});
            """.trimIndent())
            val reference = Song(42, Uri.parse("file:///fixture.wav"), "Match title", "Match artist", 1000)
            assertEquals("[00:00.20]Matched lyric", MetadataMatching.lyric(isolated, reference))
            assertTrue(source.supports("local", "lyric"))
            assertEquals("[00:00.20]Matched lyric", source.sourceRequest("local", "lyric", JSONObject().put("name", reference.title).put("singer", reference.artist)).getJSONObject("data").getString("lyric"))
        } finally { source.close(); directory.deleteRecursively() }
    }
}
