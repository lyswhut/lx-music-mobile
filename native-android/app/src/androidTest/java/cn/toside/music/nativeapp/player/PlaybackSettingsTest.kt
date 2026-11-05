@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package cn.toside.music.nativeapp.player

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.data.Artwork
import cn.toside.music.nativeapp.data.ExternalAudio
import cn.toside.music.nativeapp.data.LegacyBackup
import cn.toside.music.nativeapp.data.Playlist
import cn.toside.music.nativeapp.data.Playlists
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.lyrics.LyricLine
import cn.toside.music.nativeapp.lyrics.Lyrics
import cn.toside.music.nativeapp.ui.DesktopLyricSettings
import cn.toside.music.nativeapp.ui.MainActivity
import cn.toside.music.nativeapp.ui.UiPalette

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.SharedPreferences
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.session.MediaSession
import android.net.Uri
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.provider.Settings
import android.util.AtomicFile
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.RadioButton
import android.widget.SeekBar
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.*
import org.junit.Assume.assumeFalse
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.net.ServerSocket
import java.net.InetAddress
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class PlaybackSettingsTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val context get() = instrumentation.targetContext
    private fun main(action: () -> Unit) { instrumentation.runOnMainSync(action); instrumentation.waitForIdleSync() }
    private suspend fun waitFor(condition: () -> Boolean) = withTimeout(12_000) { while (!condition()) delay(40) }
    private fun field(owner: Any, name: String): Any? = owner.javaClass.getDeclaredField(name).apply { isAccessible = true }.get(owner)
    private fun invoke(activity: MainActivity, name: String) = main {
        MainActivity::class.java.getDeclaredMethod(name).apply { isAccessible = true }.invoke(activity)
    }
    private fun find(view: View, description: String): View? {
        if (view.contentDescription == description) return view
        if (view is ViewGroup) for (index in 0 until view.childCount) find(view.getChildAt(index), description)?.let { return it }
        return null
    }
    private fun progress(dialog: Dialog, description: String, value: Int) = main {
        val view = find(dialog.window!!.decorView, description) as SeekBar
        assertTrue(view.performAccessibilityAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.id,
            Bundle().apply { putFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE, value.toFloat()) }))
    }
    private fun restore(store: SharedPreferences, snapshot: Map<String, *>) {
        store.edit().clear().apply { snapshot.forEach { (key, value) -> when (value) {
            is String -> putString(key, value); is Float -> putFloat(key, value)
            is Int -> putInt(key, value); is Long -> putLong(key, value); is Boolean -> putBoolean(key, value)
        } } }.commit()
    }
    private inner class Fixture(val file: File, val id: Long) {
        var activity = open()
        lateinit var player: PlaybackService
        val song = Song(id, Uri.fromFile(file), "settings test", "test artist", 30_000)
        private fun open() = instrumentation.startActivitySync(Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
        suspend fun bind() {
            waitFor { !activity.isFinishing && activity.hasWindowFocus() && field(activity, "service") != null }
            player = field(activity, "service") as PlaybackService
        }
        fun media() = field(player, "player") as MediaPlayer
        suspend fun play() {
            main { player.play(listOf(song), 0) }
            waitFor { player.state.value.song?.id == song.id && !player.state.value.preparing }
            assertNull(player.state.value.error)
            assertTrue(player.state.value.playing)
        }
        suspend fun restart() {
            val previous = player
            main { player.pause(); activity.finish() }
            context.stopService(Intent(context, PlaybackService::class.java))
            waitFor { activity.isDestroyed && (field(previous, "scope") as CoroutineScope).coroutineContext[Job]!!.isCompleted }
            activity = open(); bind()
            if (File(context.filesDir, "playback-queue.json").isFile) waitFor { player.queueState.value != null }
        }
        suspend fun close() {
            main { player.pause(); activity.finish() }
            context.stopService(Intent(context, PlaybackService::class.java))
            waitFor { (field(player, "scope") as CoroutineScope).coroutineContext[Job]!!.isCompleted }
        }
    }
    private suspend fun withPlayback(test: suspend (Fixture) -> Unit) {
        val preferences = context.getSharedPreferences("player", Context.MODE_PRIVATE)
        val saved = preferences.all.toMap()
        val offsetPreferences = context.getSharedPreferences("lyric-offsets", Context.MODE_PRIVATE)
        val offsetsSaved = offsetPreferences.all.toMap()
        val historyPreferences = context.getSharedPreferences("play-history", Context.MODE_PRIVATE)
        val historySaved = historyPreferences.all.toMap()
        val generalPreferences = context.getSharedPreferences("app-settings", Context.MODE_PRIVATE)
        val generalSaved = generalPreferences.all.toMap()
        generalPreferences.edit().clear().putBoolean("common.isAgreePact", true).putBoolean("version.autoCheck", false).putString("common.langId", "zh-CN").commit()
        val queue = AtomicFile(File(context.filesDir, "playback-queue.json"))
        val savedQueue = if (queue.baseFile.isFile) queue.openRead().use { it.readBytes() } else null
        val id = System.nanoTime()
        val file = File(context.cacheDir, "playback-settings-$id.wav")
        val buffer = ByteBuffer.allocate(44 + 16000 * 30 * 2).order(ByteOrder.LITTLE_ENDIAN)
        buffer.put("RIFF".toByteArray()).putInt(buffer.capacity() - 8).put("WAVEfmt ".toByteArray()).putInt(16)
            .putShort(1).putShort(1).putInt(16000).putInt(32000).putShort(2).putShort(16)
            .put("data".toByteArray()).putInt(buffer.capacity() - 44)
        file.writeBytes(buffer.array()) // A silent PCM track exercises the real decoder without producing sound.
        val fixture = Fixture(file, id)
        fixture.bind()
        assumeFalse(fixture.player.state.value.playing || fixture.player.state.value.preparing)
        try {
            main { fixture.player.setPlaybackRate(1f); fixture.player.setVolume(1f) }
            test(fixture)
        } finally {
            fixture.close()
            restore(preferences, saved); restore(offsetPreferences, offsetsSaved)
            restore(historyPreferences, historySaved)
            restore(generalPreferences, generalSaved)
            queue.delete()
            if (savedQueue != null) { val stream = queue.startWrite(); stream.write(savedQueue); queue.finishWrite(stream) }
            File(context.filesDir, "lyrics/$id.lrc").delete(); file.delete()
        }
    }

    @Test fun queueEditsPreserveCurrentPlaybackAndPersistClearWithoutStaleWrites() = runBlocking {
        withPlayback { fixture ->
            fixture.play()
            val b = fixture.song.copy(id = fixture.id + 1, title = "B")
            val c = fixture.song.copy(id = fixture.id + 2, title = "C")
            main {
                fixture.player.enqueue(listOf(b)); fixture.player.enqueue(listOf(c), next = true)
                assertEquals(listOf(fixture.song, c, b), fixture.player.queueState.value!!.songs)
                fixture.player.moveQueued(0, 2)
                assertEquals(2, fixture.player.queueState.value!!.index)
                assertEquals(fixture.song, fixture.player.state.value.song)
                assertTrue(fixture.media().isPlaying)
                fixture.player.removeQueued(0)
                assertEquals(1, fixture.player.queueState.value!!.index)
                fixture.player.pause(); fixture.player.removeQueued(1)
                assertEquals(b, fixture.player.state.value.song)
                assertFalse(fixture.player.state.value.playing)
            }
            fixture.restart()
            waitFor { fixture.player.queueState.value?.songs == listOf(b) }
            main { fixture.player.enqueue(listOf(c)); fixture.player.clearQueue() }
            waitFor { !File(context.filesDir, "playback-queue.json").exists() }
            fixture.restart(); delay(250)
            assertNull(fixture.player.state.value.song)
            assertNull(fixture.player.queueState.value)
        }
    }
    @Test fun sleepAtEndStopsInsteadOfAdvancingAndCanBeCancelled() = runBlocking {
        withPlayback { fixture ->
            fixture.play()
            main {
                fixture.player.enqueue(listOf(fixture.song.copy(id = fixture.id + 1)))
                fixture.player.setSleepTimer(0, true)
                fixture.player.seekTo(29_600)
            }
            waitFor { !fixture.player.state.value.playing }
            main {
                assertFalse(fixture.player.state.value.playing)
                assertFalse(fixture.media().isPlaying)
                assertFalse(fixture.player.sleepAfterCurrent)
                assertEquals(fixture.song, fixture.player.state.value.song)
                fixture.player.setSleepTimer(0, true); fixture.player.setSleepTimer(0)
                assertFalse(fixture.player.sleepAfterCurrent)
            }
        }
    }
    @Test fun openedAudioIsCopiedAndDeepLinkControlsAnExistingActivity() = runBlocking {
        withPlayback { fixture ->
            val privateDirectory = File(context.cacheDir, "owned-audio-test-${System.nanoTime()}").apply { mkdirs() }
            val privateContext = object : ContextWrapper(context) { override fun getFilesDir(): File = privateDirectory }
            val opened = ExternalAudio.import(privateContext, Uri.fromFile(fixture.file))
            try {
                assertTrue(File(opened.uri.path!!).isFile)
                assertEquals(30_000L, opened.duration)
                val paths = ExternalAudio.existing(privateContext)
                assertEquals(opened, paths[opened.uri.toString()])
                val backup = LegacyBackup.encode(listOf(Playlist(1, "private") to listOf(opened)), emptyMap())
                assertFalse(LegacyBackup.containsLocalSongs(backup, paths.keys))
                val restored = LegacyBackup.parse(backup, paths)
                assertEquals(0, restored.skipped); assertEquals(opened, restored.lists.single().songs.single())
                val copy = File(privateDirectory, "same.wav").apply { writeBytes(fixture.file.readBytes()) }
                assertEquals(opened.id, ExternalAudio.import(privateContext, Uri.fromFile(copy)).id)
                main { fixture.player.play(listOf(opened), 0) }
                waitFor { fixture.player.state.value.playing || fixture.player.state.value.error != null }
                assertTrue("opened audio: ${fixture.player.state.value}", fixture.player.state.value.playing)
                main { instrumentation.callActivityOnNewIntent(fixture.activity, Intent(Intent.ACTION_VIEW, Uri.parse("lxmusic://player/pause"))) }
                waitFor { !fixture.player.state.value.playing }
                main { instrumentation.callActivityOnNewIntent(fixture.activity, Intent(Intent.ACTION_VIEW, Uri.parse("lxmusic://player/play"))) }
                waitFor { fixture.player.state.value.playing }
                main { fixture.player.clearQueue() }
            } finally { privateDirectory.deleteRecursively() }
        }
    }
    @Test fun generalPlaybackPoliciesPersistWithoutSavingPositionWhenDisabled() = runBlocking {
        withPlayback { fixture ->
            val preferences = AppPreferences(context)
            preferences.set("player.isHandleAudioFocus", false)
            preferences.set("player.isSavePlayTime", false)
            fixture.play()
            main { fixture.player.seekTo(5000); fixture.player.pause() }
            assertEquals(0, fixture.player.queueState.value!!.position)
            fixture.restart()
            assertEquals(0, fixture.player.state.value.position)
            assertFalse(fixture.player.state.value.playing)
            preferences.set("player.startupAutoPlay", true)
            fixture.restart()
            waitFor { fixture.player.state.value.playing }
            assertEquals(fixture.song, fixture.player.state.value.song)
        }
    }
    @Test fun audioOffloadPreferenceFallsBackForPcmAndKeepsPauseSpeedAndSeek() = runBlocking {
        withPlayback { fixture ->
            AppPreferences(context).set("player.isEnableAudioOffload", true)
            main { fixture.player.play(listOf(fixture.song), 0) }
            waitFor { fixture.player.state.value.playing }
            val current = field(fixture.player, "nativePlayer") as NativeAudioPlayer
            main {
                assertEquals(androidx.media3.common.TrackSelectionParameters.AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_ENABLED,
                    current.engine.trackSelectionParameters.audioOffloadPreferences.audioOffloadMode)
                fixture.player.pause(); fixture.player.setPlaybackRate(1.5f); fixture.player.setVolume(0.25f); fixture.player.seekTo(3000)
                assertFalse(current.isPlaying)
                assertEquals(1.5f, current.engine.playbackParameters.speed, 0.01f)
                assertEquals(0.25f, current.engine.volume, 0.01f)
                assertEquals(3000, fixture.player.state.value.position)
                fixture.player.resume()
            }
            waitFor { fixture.player.state.value.playing }
        }
    }
    @Test fun failedSourceUsesMatchingRecordingFromSupportedPlatformAndCanBeDisabled() = runBlocking {
        val catalog = AtomicFile(File(context.filesDir, "user-sources.json"))
        val saved = if (catalog.baseFile.isFile) catalog.readFully() else null
        try {
            withPlayback { fixture ->
                fixture.player.importSource("""/** @name source fallback test */
                    lx.on(lx.EVENT_NAMES.request, ({source}) => source === 'kw' ? Promise.reject(new Error('unavailable')) : Promise.resolve('http://127.0.0.1/matched.mp3'));
                    lx.send(lx.EVENT_NAMES.inited, {sources: {
                      kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']},
                      tx: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}
                    }});
                """.trimIndent())
                val song = fixture.song.copy(source = "kw", sourceInfo = """{"songmid":"42"}""")
                val matcher = SongMatcher(context, field(fixture.player, "scope") as CoroutineScope) { _, source -> listOf(song.copy(source = source)) }
                main { fixture.player.javaClass.getDeclaredField("matcher").apply { isAccessible = true }.set(fixture.player, matcher) }
                assertEquals("http://127.0.0.1/matched.mp3", fixture.player.resolveUrl(song))
                AppPreferences(context).set("player.autoSwitchSource", false)
                try { fixture.player.resolveUrl(song); fail("disabled fallback must retain the original source error") }
                catch (_: IllegalStateException) { }
            }
        } finally {
            catalog.delete(); if (saved != null) { val stream = catalog.startWrite(); stream.write(saved); catalog.finishWrite(stream) }
        }
    }
    @Test fun darkThemeRecreatesActivityWithoutInterruptingPlayback() = runBlocking {
        withPlayback { fixture ->
            fixture.play()
            val original = fixture.player
            val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
            try {
                AppPreferences(context).set("theme.id", "black")
                AppPreferences(context).set("theme.hideBgDark", true)
                main { fixture.activity.recreate() }
                fixture.activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
                fixture.bind()
                main {
                    assertSame(original, fixture.player); assertTrue(fixture.media().isPlaying)
                    val palette = field(fixture.activity, "palette") as UiPalette
                    assertTrue(palette.theme.dark)
                    val root = (fixture.activity.findViewById<View>(android.R.id.content) as ViewGroup).getChildAt(0)
                    assertEquals(Color.rgb(19, 19, 19), (root.background as android.graphics.drawable.ColorDrawable).color)
                    assertEquals(palette.foreground, (field(fixture.activity, "title") as TextView).currentTextColor)
                }
            } finally { instrumentation.removeMonitor(monitor) }
        }
    }
    @Test fun coverLoadsAfterActivityStopsAndBluetoothLyricsUseServiceMetadata() = runBlocking {
        val catalog = AtomicFile(File(context.filesDir, "user-sources.json"))
        val previous = if (catalog.baseFile.isFile) catalog.readFully() else null
        val server = ServerSocket(0, 4, InetAddress.getByName("127.0.0.1"))
        val allowCover = CountDownLatch(1)
        val imageBytes = java.io.ByteArrayOutputStream().also { output ->
            Bitmap.createBitmap(8, 8, Bitmap.Config.ARGB_8888).apply { eraseColor(Color.RED) }.compress(Bitmap.CompressFormat.PNG, 100, output)
        }.toByteArray()
        val audioBytes = java.util.concurrent.atomic.AtomicReference(byteArrayOf())
        val worker = Thread {
            try {
                while (!server.isClosed) {
                    val socket = server.accept()
                    Thread {
                        runCatching {
                        socket.use { client ->
                            client.soTimeout = 5000
                            val reader = client.getInputStream().bufferedReader()
                            val request = reader.readLine().orEmpty()
                            while (!reader.readLine().isNullOrEmpty()) { }
                            val cover = request.contains("/cover")
                            if (cover) allowCover.await(8, TimeUnit.SECONDS)
                            val data = if (cover) imageBytes else audioBytes.get()
                            client.getOutputStream().use { output ->
                                output.write("HTTP/1.1 200 OK\r\nContent-Length: ${data.size}\r\nContent-Type: ${if (cover) "image/png" else "audio/wav"}\r\nConnection: close\r\n\r\n".toByteArray())
                                output.write(data); output.flush()
                            }
                        }
                        }
                    }.apply { isDaemon = true; start() }
                }
            } catch (_: java.io.IOException) { }
        }.apply { isDaemon = true; start() }
        var lyricSong: Song? = null
        var cacheKey: String? = null
        try {
            withPlayback { fixture ->
                audioBytes.set(fixture.file.readBytes())
                val base = "http://127.0.0.1:${server.localPort}"
                fixture.player.importSource("""/** @name cover test */
                    lx.on(lx.EVENT_NAMES.request, () => Promise.resolve('$base/audio'));
                    lx.send(lx.EVENT_NAMES.inited, {sources: {kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}}});
                """.trimIndent())
                val song = fixture.song.copy(source = "kw", uri = Uri.EMPTY, sourceInfo = org.json.JSONObject().put("songmid", fixture.id).put("img", "$base/cover").toString())
                lyricSong = song
                cacheKey = AudioStreamCache.key(song, context.getSharedPreferences("player", Context.MODE_PRIVATE).getString("quality", "128k") ?: "128k")
                Lyrics(context).cache(song, listOf(LyricLine(0, "第一句")))
                val preferences = AppPreferences(context)
                preferences.set("player.isShowBluetoothLyric", true); preferences.set("player.isShowBluetoothFullLyric", true)
                main { fixture.player.play(listOf(song), 0) }
                waitFor { fixture.player.state.value.playing }
                main { fixture.activity.moveTaskToBack(true) }
                waitFor { field(fixture.activity, "service") == null }
                allowCover.countDown()
                val session = field(fixture.player, "session") as MediaSession
                waitFor { session.controller.metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART) != null }
                assertTrue(session.controller.metadata!!.getString(MediaMetadata.METADATA_KEY_TITLE).startsWith("第一句 · "))
                assertEquals(8, session.controller.metadata!!.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)!!.width)
                preferences.set("player.isShowNotificationImage", false); preferences.set("player.isShowBluetoothLyric", false)
                main { fixture.player.refreshPreferences() }
                assertNull(session.controller.metadata!!.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART))
                assertEquals(song.title, session.controller.metadata!!.getString(MediaMetadata.METADATA_KEY_TITLE))
                waitFor { AudioStreamCache.existing()?.cachedUri(cacheKey!!) != null }
                main { fixture.player.pause() }
                fixture.player.selectSource(null)
                server.close()
                fixture.restart()
                main { fixture.player.resume() }
                waitFor { fixture.player.state.value.playing }
                assertNull(fixture.player.state.value.error)
                waitFor { fixture.player.artworkState.value.bitmap != null }
            }
        } finally {
            allowCover.countDown(); server.close(); worker.join(1000)
            catalog.delete(); if (previous != null) { val stream = catalog.startWrite(); stream.write(previous); catalog.finishWrite(stream) }
            lyricSong?.let { song ->
                Lyrics(context).clearOnlineCache(song)
                Artwork(context).forget(org.json.JSONObject(song.sourceInfo!!).getString("img"))
            }
            cacheKey?.let { AudioStreamCache.existing()?.remove(it) }
        }
    }
    @Test fun appliesSpeedToAudioAndMediaSessionWithoutResumingPausedPlayback() = runBlocking {
        withPlayback { fixture ->
            val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val systemVolume = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
            main { fixture.player.setPlaybackRate(1.5f); fixture.player.setVolume(0.3f) }
            fixture.play()
            assertEquals(1.5f, fixture.media().playbackParams.speed, 0.01f)
            assertEquals(1f, fixture.media().playbackParams.pitch, 0.01f)
            val session = field(fixture.player, "session") as MediaSession
            assertEquals(1.5f, session.controller.playbackState!!.playbackSpeed, 0.01f)
            main { fixture.player.setPlaybackRate(1.25f); fixture.player.setVolume(0.35f) }
            assertEquals(1.25f, fixture.media().playbackParams.speed, 0.01f)
            assertEquals(1.25f, session.controller.playbackState!!.playbackSpeed, 0.01f)
            main { fixture.player.pause(); fixture.player.setPlaybackRate(2f) }
            val position = fixture.media().currentPosition
            delay(300)
            assertFalse(fixture.media().isPlaying)
            assertEquals(position, fixture.media().currentPosition)
            assertEquals(0f, session.controller.playbackState!!.playbackSpeed, 0.01f)
            assertEquals(systemVolume, audio.getStreamVolume(AudioManager.STREAM_MUSIC))
            assertEquals(0.35f, fixture.player.state.value.volume, 0.01f)
            main { fixture.player.resume() }
            assertTrue(fixture.media().isPlaying)
            assertEquals(2f, fixture.media().playbackParams.speed, 0.01f)
            assertEquals(2f, session.controller.playbackState!!.playbackSpeed, 0.01f)
            main { fixture.player.play(listOf(fixture.song.copy(id = fixture.id + 1)), 0) }
            waitFor { !fixture.player.state.value.preparing }
            assertEquals(2f, fixture.media().playbackParams.speed, 0.01f)
            fixture.restart()
            assertEquals(2f, fixture.player.state.value.playbackRate, 0.01f)
            assertEquals(0.35f, fixture.player.state.value.volume, 0.01f)
            assertFalse(fixture.player.state.value.playing)
            main { fixture.player.play(listOf(fixture.song), 0) }
            waitFor { !fixture.player.state.value.preparing }
            assertEquals(2f, fixture.media().playbackParams.speed, 0.01f)
        }
    }

    @Test fun changingSettingsWhilePreparingKeepsAnExplicitPauseUntilResume() = runBlocking {
        withPlayback { fixture ->
            main {
                fixture.player.play(listOf(fixture.song), 0)
                fixture.player.pause()
                fixture.player.setPlaybackRate(1.75f); fixture.player.setVolume(0.25f)
            }
            waitFor { !fixture.player.state.value.preparing }
            assertNull(fixture.player.state.value.error)
            assertFalse(fixture.player.state.value.playing)
            assertFalse(fixture.media().isPlaying)
            main { fixture.player.resume() }
            assertTrue(fixture.media().isPlaying)
            assertEquals(1.75f, fixture.media().playbackParams.speed, 0.01f)
            assertEquals(0.25f, fixture.player.state.value.volume, 0.01f)
        }
    }

    @Test fun dialogPersistsAppearanceAndCalibratesHighlightAndLyricSeeking() = runBlocking {
        withPlayback { fixture ->
            val lrc = File(context.cacheDir, "settings-${fixture.id}.lrc")
            try {
                lrc.writeText("[00:00.00]zero\n[00:01.00]first\n[00:02.00]second")
                Lyrics(context).import(fixture.id, "local", Uri.fromFile(lrc))
                fixture.play()
                main { fixture.player.pause() }
                waitFor { (field(fixture.activity, "lyricLines") as List<*>).size == 3 }
                invoke(fixture.activity, "showPlayerDetails"); invoke(fixture.activity, "toggleDetailPage")
                invoke(fixture.activity, "showPlaybackSettings")
                val dialog = field(fixture.activity, "playbackSettingsDialog") as AlertDialog
                progress(dialog, "播放倍速", 125); progress(dialog, "应用内音量", 40)
                progress(dialog, "歌词字号", 25); progress(dialog, "歌词时间微调", 605)
                main { (find(dialog.window!!.decorView, "右对齐") as RadioButton).performClick() }
                assertEquals(1.25f, fixture.player.state.value.playbackRate, 0.01f)
                assertFalse(fixture.media().isPlaying)
                assertEquals(500, LyricOffsets(context).get(fixture.song))
                main { dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick(); fixture.player.seekTo(1200) }
                waitFor { (field(fixture.activity, "detailLyrics") as LinearLayout).childCount == 3 }
                val container = field(fixture.activity, "detailLyrics") as LinearLayout
                val first = container.getChildAt(0) as TextView
                val second = container.getChildAt(1) as TextView
                assertEquals(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 25f, context.resources.displayMetrics), first.textSize, 0.1f)
                assertEquals(Gravity.RIGHT, first.gravity and Gravity.HORIZONTAL_GRAVITY_MASK)
                assertEquals(Color.rgb(77, 175, 124), first.currentTextColor)
                assertEquals(Color.GRAY, second.currentTextColor)
                main { second.performClick() }
                assertEquals(1500, fixture.player.state.value.position)
                assertEquals(Color.GRAY, first.currentTextColor)
                assertEquals(Color.rgb(77, 175, 124), second.currentTextColor)
                fixture.restart()
                val settings = PlayerSettings(context)
                val landscape = fixture.activity.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
                assertEquals(LyricAppearance(25, LyricAlignment.RIGHT), settings.appearance(landscape))
                assertEquals(500, LyricOffsets(context).get(fixture.song))
                invoke(fixture.activity, "showPlaybackSettings")
                val restored = field(fixture.activity, "playbackSettingsDialog") as AlertDialog
                assertEquals(125, (find(restored.window!!.decorView, "播放倍速") as SeekBar).progress)
                main { restored.getButton(AlertDialog.BUTTON_NEUTRAL).performClick() }
                assertEquals(1f, fixture.player.state.value.playbackRate, 0.01f)
                assertEquals(1f, fixture.player.state.value.volume, 0.01f)
                assertEquals(LyricAlignment.LEFT, settings.appearance(landscape).alignment)
                assertEquals(0, LyricOffsets(context).get(fixture.song))
            } finally { lrc.delete() }
        }
    }

    @Test fun desktopLyricsSurviveBackgroundAndRespectLockDisableAndPermissionRevocation() = runBlocking {
        fun shell(command: String): String = ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command))
            .bufferedReader().use { it.readText() }
        val oldMode = Regex("SYSTEM_ALERT_WINDOW: ([a-z]+)").find(shell("appops get ${context.packageName} SYSTEM_ALERT_WINDOW"))
            ?.groupValues?.get(1) ?: "default"
        val preferences = context.getSharedPreferences("desktop-lyrics", Context.MODE_PRIVATE)
        val saved = preferences.all.toMap()
        try {
            shell("appops set ${context.packageName} SYSTEM_ALERT_WINDOW allow")
            waitFor { Settings.canDrawOverlays(context) }
            withPlayback { fixture ->
                val settings = DesktopLyricSettings(context)
                settings.enabled = true
                fixture.play()
                val overlay = field(fixture.player, "desktopLyrics")!!
                waitFor { (field(overlay, "view") as? TextView)?.isAttachedToWindow == true }
                main { fixture.activity.moveTaskToBack(true) }
                assertTrue((field(overlay, "view") as TextView).isAttachedToWindow)
                main { settings.set("locked", true); fixture.player.refreshLyricPreferences() }
                val params = field(overlay, "params") as android.view.WindowManager.LayoutParams
                assertTrue(params.flags and android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE != 0)
                if (android.os.Build.VERSION.SDK_INT >= 31) {
                    val limit = requireNotNull(context.getSystemService(android.hardware.input.InputManager::class.java)).maximumObscuringOpacityForTouch
                    assertTrue(params.alpha <= limit)
                    main { settings.set("opacity", 30); fixture.player.refreshLyricPreferences() }
                    assertEquals(0.3f, params.alpha, 0.01f)
                }
                main { settings.enabled = false; fixture.player.refreshLyricPreferences() }
                assertNull(field(overlay, "view"))
                assertTrue(fixture.player.state.value.playing)
                shell("appops set ${context.packageName} SYSTEM_ALERT_WINDOW ignore")
                waitFor { !Settings.canDrawOverlays(context) }
                main { settings.enabled = true; fixture.player.refreshLyricPreferences() }
                assertNull(field(overlay, "view"))
            }
        } finally { restore(preferences, saved); shell("appops set ${context.packageName} SYSTEM_ALERT_WINDOW $oldMode") }
    }
    @Test fun explicitExitStopsPlaybackAndRestoresQueuePausedOnNextLaunch() = runBlocking {
        withPlayback { fixture ->
            AppPreferences(context).set("player.isSavePlayTime", true)
            fixture.play()
            val second = fixture.song.copy(id = fixture.id + 1, title = "queued after exit")
            main { fixture.player.enqueue(listOf(second)); fixture.player.seekTo(5000) }
            val previous = fixture.player
            main {
                context.startService(Intent(context, PlaybackService::class.java).setAction(PlaybackService.ACTION_EXIT))
                fixture.activity.finish()
            }
            waitFor { (field(previous, "scope") as CoroutineScope).coroutineContext[Job]!!.isCompleted }
            fixture.activity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as MainActivity
            fixture.bind()
            waitFor { fixture.player.queueState.value?.songs == listOf(fixture.song, second) }
            assertFalse(fixture.player.state.value.playing)
            assertTrue(fixture.player.queueState.value!!.position >= 4900)
            assertEquals(fixture.song, fixture.player.state.value.song)
            assertFalse((context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager).activeNotifications.any { it.id == 1 })
        }
    }
    @Test fun switchingEnglishAndTraditionalRecreatesUiAndNotificationsWithoutInterruptingAudio() = runBlocking {
        fun screenshot(name: String) {
            if (InstrumentationRegistry.getArguments().getString("migrationScreenshots") != "true") return
            instrumentation.waitForIdleSync()
            android.os.SystemClock.sleep(500) // Window animations run independently of the UI message queue.
            val bitmap = requireNotNull(instrumentation.uiAutomation.takeScreenshot())
            val output = InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")
            val directory = File(output?.let(::File) ?: context.getExternalFilesDir(null), "migration-validation").apply { mkdirs() }
            try { File(directory, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) } }
            finally { bitmap.recycle() }
        }
        withPlayback { fixture ->
            fixture.play(); val original = fixture.player
            for ((language, label) in listOf("en" to "Your Library", "zh-TW" to "我的清單")) {
                // waitForMonitorWithTimeout removes the monitor after it receives one Activity.
                val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
                try {
                    AppPreferences(context).set("common.langId", language)
                    main { fixture.activity.recreate() }
                    fixture.activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
                    fixture.bind()
                    assertSame(original, fixture.player); assertTrue(fixture.player.state.value.playing)
                    val title = field(fixture.activity, "pageTitle") as TextView
                    assertEquals(label, title.text.toString())
                    val search = field(fixture.activity, "search") as TextView
                    assertEquals(if (language == "en") "Search songs or artists" else "搜索歌曲或歌手", search.hint.toString())
                    screenshot("home-$language")
                    val notification = PlaybackService::class.java.getDeclaredMethod("notification").apply { isAccessible = true }.invoke(fixture.player) as android.app.Notification
                    assertEquals(if (language == "en") "Next song" else "下一首", notification.actions[2].title.toString())
                    invoke(fixture.activity, "showPlayerDetails")
                    assertEquals(if (language == "en") "Repeat playlist" else "列表循環", (field(fixture.activity, "detailMode") as TextView).text.toString())
                    screenshot("player-$language")
                    main { (field(fixture.activity, "playerDialog") as Dialog).dismiss() }
                } finally { instrumentation.removeMonitor(monitor) }
            }
        }
    }
    @Test fun mediaPlayerFailureFallsBackOnceAndPreservesPausedPositionSpeedAndQueue() = runBlocking {
        withPlayback { fixture ->
            fixture.play(); val original = fixture.media()
            main {
                fixture.player.seekTo(3000); fixture.player.pause(); fixture.player.setPlaybackRate(1.25f); fixture.player.setVolume(0.3f)
                fixture.player.recoverMediaPlayer(original, fixture.song, fixture.song.uri, 3000, "MEDIA_ERROR_SERVER_DIED")
            }
            waitFor { !fixture.player.state.value.preparing }
            val replacement = field(fixture.player, "nativePlayer") as NativeAudioPlayer
            assertNull(field(fixture.player, "player")); assertNull(fixture.player.state.value.error)
            assertFalse(fixture.player.state.value.playing)
            assertEquals(3000, fixture.player.state.value.position)
            main {
                assertEquals(1.25f, replacement.engine.playbackParameters.speed, 0.01f)
                assertEquals(0.3f, replacement.engine.volume, 0.01f)
            }
            assertEquals(listOf(fixture.song), fixture.player.queueState.value!!.songs)
            main { fixture.player.recoverMediaPlayer(original, fixture.song, fixture.song.uri, 0, "late callback"); fixture.player.resume() }
            waitFor { fixture.player.state.value.playing }
            assertSame(replacement, field(fixture.player, "nativePlayer"))
            assertTrue(fixture.player.state.value.position >= 3000)
        }
    }
    @Test fun languageAndFontChangesKeepPlaylistSearchAndScrollWhileAudioContinues() = runBlocking {
        withPlayback { fixture ->
            fixture.play(); val player = fixture.player
            val lists = Playlists(context); val id = lists.create("page-state-${fixture.id}")
            try {
                val songs = (0 until 200).map { value -> Song(value.toLong(), Uri.EMPTY, "Song $value", "Artist", 1000, "kw", """{"songmid":"$value"}""") }
                lists.batchSongs(songs, null, id, false)
                val playlist = lists.list().single { it.id == id }
                main { MainActivity::class.java.getDeclaredMethod("loadPlaylist", Playlist::class.java).apply { isAccessible = true }.invoke(fixture.activity, playlist) }
                waitFor { (field(fixture.activity, "visibleSongs") as List<*>).size == 200 }
                main {
                    (field(fixture.activity, "search") as TextView).apply { text = "Song"; visibility = View.VISIBLE }
                    (field(fixture.activity, "list") as ListView).setSelectionFromTop(80, -12)
                }
                waitFor { (field(fixture.activity, "list") as ListView).firstVisiblePosition == 80 }
                val monitor = instrumentation.addMonitor(MainActivity::class.java.name, null, false)
                AppPreferences(context).set("common.langId", "en"); AppPreferences(context).set("common.fontScale", "1.3")
                main { fixture.activity.recreate() }
                fixture.activity = instrumentation.waitForMonitorWithTimeout(monitor, 5000) as MainActivity
                fixture.bind()
                waitFor { (field(fixture.activity, "list") as ListView).firstVisiblePosition == 80 }
                assertEquals(id, (field(fixture.activity, "activePlaylist") as Playlist).id)
                assertEquals("Song", (field(fixture.activity, "search") as TextView).text.toString())
                assertEquals(200, (field(fixture.activity, "visibleSongs") as List<*>).size)
                assertSame(player, fixture.player); assertTrue(fixture.player.state.value.playing)
            } finally { lists.delete(id); lists.close() }
        }
    }
}
