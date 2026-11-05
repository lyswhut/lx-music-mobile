package cn.toside.music.nativeapp

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.net.Uri
import android.graphics.Bitmap
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.combine
import org.json.JSONObject

data class PlayerState(val song: Song? = null, val playing: Boolean = false, val preparing: Boolean = false,
    val position: Int = 0, val duration: Int = 0, val error: String? = null, val mode: PlayMode = PlayMode.LIST_LOOP,
    val playbackRate: Float = 1f, val volume: Float = 1f)
internal data class PlayerLyrics(val key: String? = null, val lines: List<LyricLine> = emptyList(), val error: String? = null)
internal data class PlayerArtwork(val key: String? = null, val bitmap: Bitmap? = null)

class PlaybackService : Service() {
    private fun message(resource: Int, vararg arguments: Any): String =
        UiPreferences.context(this, scaleFonts = false).getString(resource, *arguments)
    inner class LocalBinder : Binder() { val service: PlaybackService get() = this@PlaybackService }
    private val binder = LocalBinder()
    private val mutableState = MutableStateFlow(PlayerState())
    val state: StateFlow<PlayerState> = mutableState
    private lateinit var session: MediaSession
    private lateinit var audio: AudioManager
    private var focusRequest: AudioFocusRequest? = null
    private var player: MediaPlayer? = null
    private var nativePlayer: NativeAudioPlayer? = null
    private var queue = emptyList<Song>()
    private var index = -1
    private var queueEpoch = 0L
    private val mutableQueue = MutableStateFlow<QueueSnapshot?>(null)
    internal val queueState: StateFlow<QueueSnapshot?> = mutableQueue
    private var foreground = false
    private var resumeOnFocus = false
    private var playWhenReady = false
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val sourceMutex = Mutex()
    private lateinit var userSource: UserSource
    private lateinit var queueStore: QueueStore
    private lateinit var settings: PlayerSettings
    private lateinit var preferences: AppPreferences
    private lateinit var matcher: SongMatcher
    private lateinit var lyrics: Lyrics
    private var lyricLoadJob: Job? = null
    private val mutableLyrics = MutableStateFlow(PlayerLyrics())
    internal val lyricState: StateFlow<PlayerLyrics> = mutableLyrics
    private lateinit var desktopLyrics: DesktopLyrics
    private var artworkLoadJob: Job? = null
    private val mutableArtwork = MutableStateFlow(PlayerArtwork())
    internal val artworkState: StateFlow<PlayerArtwork> = mutableArtwork
    private var lastBluetoothLine: String? = null
    private var lastLoggedError: String? = null
    private var resolveJob: Job? = null
    private var sleepJob: Job? = null
    internal var sleepAfterCurrent = false
        private set
    private var mode = PlayMode.LIST_LOOP
    private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
        if (preferences.handleAudioFocus) when (change) {
            AudioManager.AUDIOFOCUS_LOSS -> { resumeOnFocus = false; pause() }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                resumeOnFocus = mutableState.value.playing || mutableState.value.preparing && playWhenReady; pause()
            }
            AudioManager.AUDIOFOCUS_GAIN -> if (resumeOnFocus) { resumeOnFocus = false; resume() }
        }
    }
    private val noisyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) { pause() }
    }

    override fun onCreate() {
        super.onCreate()
        audio = getSystemService(AUDIO_SERVICE) as AudioManager
        queueStore = QueueStore(applicationContext)
        settings = PlayerSettings(applicationContext)
        preferences = AppPreferences(applicationContext)
        matcher = SongMatcher(applicationContext, scope)
        lyrics = Lyrics(applicationContext)
        desktopLyrics = DesktopLyrics(this)
        mode = runCatching { PlayMode.valueOf(getSharedPreferences("player", MODE_PRIVATE).getString("mode", null) ?: "LIST_LOOP") }.getOrDefault(PlayMode.LIST_LOOP)
        mutableState.value = mutableState.value.copy(mode = mode, playbackRate = settings.playbackRate, volume = settings.volume)
        userSource = UserSource(applicationContext)
        scope.launch { sourceMutex.withLock { runCatching { userSource.loadSaved() } } }
        session = MediaSession(this, "LXMusic").apply {
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() = resume()
                override fun onPause() = pause()
                override fun onSkipToNext() = next()
                override fun onSkipToPrevious() = previous()
                override fun onSeekTo(pos: Long) = seekTo(pos.toInt())
            })
            isActive = true
        }
        if (Build.VERSION.SDK_INT >= 26) {
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
                NotificationChannel(CHANNEL, message(R.string.playback_channel), NotificationManager.IMPORTANCE_LOW))
        }
        registerReceiver(noisyReceiver, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY))
        scope.launch { mutableState.map { it.song }.distinctUntilChanged().collect { loadLyrics(it); loadArtwork(it) } }
        scope.launch { combine(state, lyricState) { state, lyrics -> state to lyrics }.collect { (state, lyrics) -> desktopLyrics.render(state, lyrics) } }
        scope.launch {
            val saved = runCatching { queueStore.load() }.getOrNull()
            if (saved != null && queueEpoch == 0L && queue.isEmpty() && mutableState.value.song == null) {
                queue = saved.songs; index = saved.index
                mutableQueue.value = saved
                val song = queue[index]
                mutableState.value = PlayerState(song = song, position = if (preferences.savePlayTime) saved.position else 0,
                    duration = song.duration.coerceIn(0, Int.MAX_VALUE.toLong()).toInt(), mode = mode,
                    playbackRate = settings.playbackRate, volume = settings.volume)
                publish()
                if (preferences.startupAutoPlay) resume()
            }
        }
        scope.launch {
            var ticks = 0
            while (true) {
                delay(200)
                if (mutableState.value.playing) {
                    updatePosition()
                    if (++ticks >= 25) { ticks = 0; saveQueue() }
                } else ticks = 0
            }
        }
    }
    override fun onBind(intent: Intent?): IBinder = binder
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_EXIT -> { pause(); stopForeground(STOP_FOREGROUND_REMOVE); foreground = false; stopSelf() }
            ACTION_TOGGLE -> if (mutableState.value.playing) pause() else resume()
            ACTION_NEXT -> next()
            ACTION_PREVIOUS -> previous()
        }
        return START_NOT_STICKY
    }

    fun play(songs: List<Song>, selected: Int) {
        if (selected !in songs.indices) return
        queueEpoch++
        queue = songs.toList(); index = selected
        openCurrent()
    }
    internal fun enqueue(songs: List<Song>, next: Boolean = false) {
        if (songs.isEmpty()) return
        queueEpoch++
        val additions = songs.toList()
        val insertion = if (next && index >= 0) index + 1 else queue.size
        queue = queue.toMutableList().apply { addAll(insertion.coerceIn(0, size), additions) }
        if (index < 0) { index = 0; selectPausedQueueSong() } else saveQueue()
    }
    internal fun playQueued(position: Int) {
        if (position !in queue.indices) return
        if (position == index) resume() else { index = position; openCurrent() }
    }
    internal fun moveQueued(from: Int, to: Int) {
        if (from !in queue.indices || to !in queue.indices || from == to) return
        queueEpoch++
        queue = queue.toMutableList().apply { add(to, removeAt(from)) }
        index = when {
            index == from -> to
            from < index && to >= index -> index - 1
            from > index && to <= index -> index + 1
            else -> index
        }
        saveQueue()
    }
    internal fun removeQueued(position: Int) {
        if (position !in queue.indices) return
        if (queue.size == 1) { clearQueue(); return }
        queueEpoch++
        val resume = mutableState.value.playing || mutableState.value.preparing && playWhenReady
        val removingCurrent = position == index
        queue = queue.toMutableList().apply { removeAt(position) }
        if (position < index) index-- else if (removingCurrent) index = position.coerceAtMost(queue.lastIndex)
        if (removingCurrent) {
            if (resume) openCurrent() else selectPausedQueueSong()
        } else saveQueue()
    }
    private fun selectPausedQueueSong() {
        resolveJob?.cancel(); releasePlayback(); playWhenReady = false
        val song = queue.getOrNull(index)
        mutableState.value = PlayerState(song = song, duration = song?.duration?.coerceIn(0, Int.MAX_VALUE.toLong())?.toInt() ?: 0,
            mode = mode, playbackRate = settings.playbackRate, volume = settings.volume)
        saveQueue(); publish()
    }
    internal fun clearQueue() {
        queueEpoch++; resolveJob?.cancel(); releasePlayback(); playWhenReady = false; resumeOnFocus = false
        queue = emptyList(); index = -1; mutableQueue.value = null
        mutableState.value = PlayerState(mode = mode, playbackRate = settings.playbackRate, volume = settings.volume)
        val revision = queueStore.nextRevision()
        scope.launch { withContext(NonCancellable) { queueStore.clear(revision) } }
        publish()
        if (foreground) { stopForeground(STOP_FOREGROUND_REMOVE); foreground = false; stopSelf() }
        focusRequest?.let { audio.abandonAudioFocusRequest(it) }
    }
    suspend fun importSource(script: String): JSONObject = sourceMutex.withLock { userSource.import(script) }
    internal val sourceUpdates get() = userSource.updates
    internal suspend fun sourceCatalog(): UserSourceCatalog = sourceMutex.withLock { userSource.catalog() }
    internal val matchingCacheCount get() = matcher.cacheCount
    internal fun clearMatchingCache() = matcher.clearCache()
    internal suspend fun selectSource(id: String?) = sourceMutex.withLock { userSource.select(id) }
    internal suspend fun removeSource(id: String) = sourceMutex.withLock { userSource.remove(id) }
    internal suspend fun allowSourceUpdates(id: String, allowed: Boolean) = sourceMutex.withLock { userSource.allowUpdates(id, allowed) }
    internal suspend fun otherSources(song: Song): List<Song> = matcher.find(song)
    internal fun dismissSourceUpdate() = userSource.dismissUpdate()
    internal fun metadataChanged(song: Song) {
        queueEpoch++
        queue = queue.map { if (it.id == song.id && it.source == song.source) song else it }
        if (mutableState.value.song?.let { it.id == song.id && it.source == song.source } == true) {
            mutableState.value = mutableState.value.copy(song = song)
            loadArtwork(song); loadLyrics(song)
        }
        saveQueue(); publish()
    }
    internal suspend fun clearSongCache(song: Song) = withContext(Dispatchers.IO) {
        if (song.source == "local") return@withContext
        val prefix = AudioStreamCache.key(song, "").removeSuffix(":") + ":"
        AudioStreamCache.get(this@PlaybackService).removeSong(prefix)
        matcher.clearSong(song)
    }
    internal fun refreshLyricPreferences() { desktopLyrics.render(state.value, lyricState.value); publish() }
    internal fun refreshPreferences() {
        if (!preferences.handleAudioFocus) { resumeOnFocus = false; focusRequest?.let { audio.abandonAudioFocusRequest(it) } }
        else if (state.value.playing && !requestFocus()) pause()
        refreshLyricPreferences()
        scope.launch { withContext(Dispatchers.IO) { AudioStreamCache.existing()?.updateLimit(preferences.audioCacheBytes) } }
    }
    private fun loadArtwork(song: Song?) {
        artworkLoadJob?.cancel()
        val key = song?.let { "${it.source}:${it.id}" }
        mutableArtwork.value = PlayerArtwork(key); publish()
        if (song == null) return
        artworkLoadJob = scope.launch {
            try {
                val loader = Artwork(this@PlaybackService)
                var bitmap = try { loader.load(song) } catch (e: CancellationException) { throw e } catch (_: Exception) { null }
                if (bitmap == null && song.source == "local") {
                    val url = sourceMutex.withLock {
                        if (!userSource.supports("local", "pic")) null else userSource.sourceRequest("local", "pic", JSONObject()
                            .put("name", song.title).put("singer", song.artist).put("songmid", song.id).put("filePath", song.uri.toString())).optString("data")
                    }
                    if (!url.isNullOrBlank()) bitmap = loader.loadUrl(url)
                }
                mutableArtwork.value = PlayerArtwork(key, bitmap); publish()
            } catch (e: CancellationException) { throw e }
            catch (_: Exception) { }
        }
    }
    internal fun reloadLyrics(forceOnline: Boolean = false) = loadLyrics(mutableState.value.song, forceOnline)
    private fun loadLyrics(song: Song?, forceOnline: Boolean = false) {
        lyricLoadJob?.cancel()
        val key = song?.let { "${it.source}:${it.id}" }
        mutableLyrics.value = PlayerLyrics(key)
        if (song == null) return
        lyricLoadJob = scope.launch {
            try {
                if (forceOnline) lyrics.clearOnlineCache(song)
                var lines = lyrics.load(song.id, song.source)
                if (lines.isEmpty() && song.source == "local") {
                    val text = try { LocalTags.lyric(this@PlaybackService, song) }
                    catch (e: CancellationException) { throw e } catch (_: Exception) { "" }
                    lines = LrcParser.parse(text)
                    if (lines.isNotEmpty()) lyrics.cache(song, lines)
                }
                if (lines.isEmpty() && song.source == "local") {
                    val info = JSONObject().put("name", song.title).put("singer", song.artist).put("songmid", song.id)
                        .put("filePath", song.uri.toString()).put("interval", song.duration / 1000)
                    lines = sourceMutex.withLock {
                        if (!userSource.supports("local", "lyric")) emptyList() else {
                            val data = userSource.sourceRequest("local", "lyric", info).getJSONObject("data")
                            LyricFormats.merge(LrcParser.parse(data.optString("lxlyric").takeUnless { it.isBlank() || it == "null" } ?: data.optString("lyric")),
                                LrcParser.parse(data.optString("tlyric")), LrcParser.parse(data.optString("rlyric")))
                        }
                    }
                    if (lines.isNotEmpty()) lyrics.cache(song, lines)
                }
                if (lines.isEmpty() && song.source != "local") {
                    lines = OnlineLyrics().forSong(song)
                    lyrics.cache(song, lines)
                }
                if (mutableState.value.song == song) { mutableLyrics.value = PlayerLyrics(key, lines); publish() }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (mutableState.value.song == song) mutableLyrics.value = PlayerLyrics(key, error = message(R.string.playback_lyrics_error, e.localizedMessage.orEmpty())) }
        }
    }
    fun cycleMode() {
        mode = mode.next()
        getSharedPreferences("player", MODE_PRIVATE).edit().putString("mode", mode.name).apply()
        mutableState.value = mutableState.value.copy(mode = mode)
    }
    fun setPlaybackRate(value: Float) {
        require(value.isFinite() && value in PlayerSettings.MIN_RATE..PlayerSettings.MAX_RATE) { message(R.string.playback_rate_range) }
        val current = player
        if (current != null && mutableState.value.playing) {
            try { applyRate(current, value) }
            catch (e: RuntimeException) {
                // Keep the last working rate if a device/decoder rejects time stretching.
                runCatching { applyRate(current, mutableState.value.playbackRate) }
                throw IllegalStateException(message(R.string.playback_rate_unsupported), e)
            }
        }
        // Non-zero PlaybackParams starts a prepared MediaPlayer: defer changes while paused/preparing.
        nativePlayer?.rate(value)
        settings.setPlaybackRate(value)
        mutableState.value = mutableState.value.copy(playbackRate = value)
        updatePosition(); publish()
    }
    fun setVolume(value: Float) {
        require(value.isFinite() && value in 0f..1f) { message(R.string.playback_volume_range) }
        if (!mutableState.value.preparing && mutableState.value.error == null) player?.setVolume(value, value)
        nativePlayer?.volume(value)
        settings.setVolume(value)
        mutableState.value = mutableState.value.copy(volume = value)
    }
    private fun applyRate(current: MediaPlayer, rate: Float) {
        current.playbackParams = PlaybackParams().allowDefaults().setPitch(1f).setSpeed(rate)
            .setAudioFallbackMode(PlaybackParams.AUDIO_FALLBACK_MODE_FAIL)
    }
    private fun startPlayer(current: MediaPlayer) {
        val state = mutableState.value
        current.setVolume(state.volume, state.volume)
        applyRate(current, state.playbackRate)
        current.start()
    }
    fun setSleepTimer(minutes: Int, finishCurrent: Boolean = false) {
        sleepJob?.cancel(); sleepJob = null
        sleepAfterCurrent = finishCurrent && minutes == 0
        if (minutes > 0) sleepJob = scope.launch {
            delay(minutes.toLong() * 60_000)
            if (finishCurrent && (state.value.playing || state.value.preparing && playWhenReady)) sleepAfterCurrent = true else pause()
            sleepJob = null
        }
    }
    suspend fun resolveUrl(song: Song): String {
        require(song.source != "local") { message(R.string.playback_local_download) }
        val info = song.sourceInfo ?: error(message(R.string.playback_source_missing))
        val quality = getSharedPreferences("player", MODE_PRIVATE).getString("quality", "128k") ?: "128k"
        try { return sourceMutex.withLock { userSource.musicUrl(song.source, JSONObject(info), quality) } }
        catch (e: CancellationException) { throw e }
        catch (original: Exception) {
            if (!preferences.bool("player.autoSwitchSource", true) || original.message.orEmpty().contains("429")) throw original
            val supported = sourceMutex.withLock { ExternalLinks.sources.filter { it != song.source && userSource.supports(it, "musicUrl") } }
            if (supported.isEmpty()) throw original
            for (alternative in matcher.find(song).filter { it.source in supported }) {
                try { return sourceMutex.withLock { userSource.musicUrl(alternative.source, JSONObject(alternative.sourceInfo!!), quality) } }
                catch (e: CancellationException) { throw e }
                catch (_: Exception) { }
            }
            throw original
        }
    }

    private fun openCurrent(resumePosition: Int = 0) {
        val song = queue.getOrNull(index) ?: return
        resolveJob?.cancel()
        if (!requestFocus()) {
            mutableState.value = PlayerState(song = song, error = message(R.string.playback_focus_error), mode = mode,
                playbackRate = settings.playbackRate, volume = settings.volume)
            return
        }
        releasePlayback()
        playWhenReady = true
        mutableState.value = PlayerState(song = song, preparing = true, duration = song.duration.coerceIn(0, Int.MAX_VALUE.toLong()).toInt(), mode = mode,
            playbackRate = settings.playbackRate, volume = settings.volume)
        saveQueue(resumePosition)
        val serviceIntent = Intent(this, PlaybackService::class.java)
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(serviceIntent) else startService(serviceIntent)
        startForeground(NOTIFICATION_ID, notification())
        foreground = true
        publish()
        resolveJob = scope.launch {
            try {
                if (song.source == "local" && !preferences.audioOffload) preparePlayer(song, song.uri, resumePosition)
                else {
                    val quality = getSharedPreferences("player", MODE_PRIVATE).getString("quality", "128k") ?: "128k"
                    val key = if (song.source == "local") null else AudioStreamCache.key(song, quality)
                    val cache = if (key == null) null else withContext(Dispatchers.IO) { AudioStreamCache.get(applicationContext).also { it.updateLimit(preferences.audioCacheBytes) } }
                    val cached = if (key != null) withContext(Dispatchers.IO) { cache?.cachedUri(key) } else null
                    val uri = if (song.source == "local") song.uri else cached ?: Uri.parse(resolveUrl(song))
                    if (key != null) withContext(Dispatchers.IO) { cache?.remember(key, uri) }
                    prepareNativePlayer(song, uri, resumePosition, cache, key)
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) {
                mutableState.value = mutableState.value.copy(preparing = false, playing = false, error = message(R.string.playback_error, e.localizedMessage.orEmpty()))
                publish()
            }
        }
    }
    private fun releasePlayback() {
        player?.release(); player = null
        val previous = nativePlayer; nativePlayer = null; previous?.release()
    }
    private fun prepareNativePlayer(song: Song, uri: Uri, position: Int, cache: AudioStreamCache?, key: String?) {
        val current = NativeAudioPlayer(this, cache, preferences.audioOffload, { engine ->
            if (nativePlayer === engine) {
                mutableState.value = mutableState.value.copy(preparing = engine.preparing, playing = engine.isPlaying,
                    duration = engine.duration.takeIf { it > 0 } ?: mutableState.value.duration, position = engine.position)
                if (engine.isPlaying && !engine.recorded) { engine.recorded = true; recordHistory(song) }
                publish()
            }
        }, { engine -> if (nativePlayer === engine) onCompleted() }, { engine, error ->
            if (nativePlayer === engine) {
                mutableState.value = mutableState.value.copy(preparing = false, playing = false, error = message(R.string.playback_error, error)); publish()
                if (key != null) scope.launch { withContext(Dispatchers.IO) { cache?.remove(key) } }
            }
        })
        nativePlayer = current
        try { current.prepare(uri, key, position, state.value.playbackRate, state.value.volume, playWhenReady) }
        catch (e: Exception) { releasePlayback(); throw e }
    }
    private fun preparePlayer(song: Song, uri: Uri, resumePosition: Int) {
        val current = MediaPlayer()
        player = current
        try {
            current.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            current.setDataSource(this, uri)
            current.setOnPreparedListener { mp ->
                if (player !== mp) return@setOnPreparedListener
                val position = resumePosition.coerceIn(0, mp.duration.coerceAtLeast(0))
                if (position > 0) mp.seekTo(position)
                try {
                    if (playWhenReady) startPlayer(mp)
                    mutableState.value = mutableState.value.copy(preparing = false, playing = playWhenReady, duration = mp.duration, position = position)
                    if (playWhenReady) recordHistory(song)
                } catch (e: RuntimeException) {
                    runCatching { mp.pause() }
                    mutableState.value = mutableState.value.copy(preparing = false, playing = false, error = message(R.string.playback_settings_error, e.localizedMessage.orEmpty()))
                }
                publish()
            }
            current.setOnCompletionListener { mp -> if (player === mp) onCompleted() }
            current.setOnErrorListener { mp, what, extra ->
                recoverMediaPlayer(mp, song, uri, if (state.value.preparing) resumePosition else state.value.position, "MediaPlayer error $what/$extra")
                true
            }
            current.prepareAsync()
            publish()
        } catch (e: Exception) {
            recoverMediaPlayer(current, song, uri, resumePosition, "${e.javaClass.simpleName}: ${e.localizedMessage}")
        }
    }
    /** One-way fallback; late callbacks from a released MediaPlayer cannot replace the current engine. */
    internal fun recoverMediaPlayer(current: MediaPlayer, song: Song, uri: Uri, position: Int, reason: String) {
        if (player !== current || state.value.song != song) return
        player = null; runCatching { current.release() }
        DiagnosticLog(this).record("playback", "$reason; retrying with Media3", "WARN")
        mutableState.value = mutableState.value.copy(preparing = true, playing = false, error = null)
        try { prepareNativePlayer(song, uri, position, null, null) }
        catch (e: Exception) {
            mutableState.value = mutableState.value.copy(preparing = false, playing = false, error = message(R.string.playback_open_error, e.localizedMessage.orEmpty()))
            publish()
        }
    }

    fun pause() {
        if (mutableState.value.preparing) { playWhenReady = false; nativePlayer?.pause(); return }
        if (!mutableState.value.playing) return
        playWhenReady = false
        player?.pause()
        nativePlayer?.pause()
        mutableState.value = mutableState.value.copy(playing = false, position = nativePlayer?.position ?: player?.currentPosition ?: 0)
        saveQueue()
        publish()
    }
    fun resume() {
        if (mutableState.value.playing) return
        if (mutableState.value.preparing) { if (requestFocus()) { playWhenReady = true; nativePlayer?.play() }; return }
        nativePlayer?.let { current ->
            if (mutableState.value.error != null) { openCurrent(mutableState.value.position); return }
            if (requestFocus()) { playWhenReady = true; current.play(); publish() }; return
        }
        val mp = player ?: run { if (mutableState.value.song != null) openCurrent(mutableState.value.position); return }
        if (!requestFocus()) return
        try {
            startPlayer(mp); mutableState.value = mutableState.value.copy(playing = true, error = null)
            mutableState.value.song?.let { recordHistory(it) }; publish()
        } catch (e: RuntimeException) {
            runCatching { mp.pause() }
            mutableState.value = mutableState.value.copy(playing = false, error = message(R.string.playback_settings_error, e.localizedMessage.orEmpty())); publish()
        }
    }
    private fun onCompleted() {
        if (sleepAfterCurrent) {
            sleepAfterCurrent = false; playWhenReady = false
            mutableState.value = mutableState.value.copy(playing = false, position = mutableState.value.duration)
            saveQueue(); publish(); return
        }
        val rules = DislikeStore(this).get()
        val target = nextAllowedSongIndex(mode, index, queue, completed = true, rules::matches) { kotlin.random.Random.nextInt(it) }
        if (target == null) {
            mutableState.value = mutableState.value.copy(playing = false, position = mutableState.value.duration)
            saveQueue()
            publish()
        } else {
            if (preferences.autoCleanQueue && mode == PlayMode.ORDER && target != index) {
                val previous = index
                queue = queue.toMutableList().apply { removeAt(previous) }
                index = if (target > previous) target - 1 else target
            } else index = target
            openCurrent()
        }
    }
    fun next() {
        val rules = DislikeStore(this).get()
        val target = nextAllowedSongIndex(mode, index, queue, completed = false, rules::matches) { kotlin.random.Random.nextInt(it) } ?: return
        index = target; openCurrent()
    }
    fun previous() {
        val rules = DislikeStore(this).get()
        val target = previousAllowedSongIndex(index, queue, rules::matches) ?: return
        index = target; openCurrent()
    }
    fun seekTo(position: Int) {
        if (mutableState.value.preparing) return
        try {
            val target = position.coerceIn(0, mutableState.value.duration)
            player?.seekTo(target)
            nativePlayer?.seekTo(target)
            mutableState.value = mutableState.value.copy(position = target)
            saveQueue(); publish()
        } catch (_: IllegalStateException) { }
    }
    fun updatePosition() {
        if (!mutableState.value.playing) return
        try {
            mutableState.value = mutableState.value.copy(position = nativePlayer?.position ?: player?.currentPosition ?: 0)
            if (preferences.bluetoothLyric && bluetoothLine() != lastBluetoothLine) publish()
        } catch (_: IllegalStateException) { }
    }
    private fun saveQueue(position: Int = mutableState.value.position) {
        if (index !in queue.indices) return
        val snapshot = QueueSnapshot(queue.toList(), index, if (preferences.savePlayTime) position.coerceAtLeast(0) else 0)
        mutableQueue.value = snapshot
        val revision = queueStore.nextRevision()
        scope.launch {
            val failure = runCatching { withContext(NonCancellable) { queueStore.save(snapshot, revision) } }.exceptionOrNull()
            if (failure != null) mutableState.value = mutableState.value.copy(error = message(R.string.playback_queue_error, failure.localizedMessage.orEmpty()))
        }
    }
    private fun recordHistory(song: Song) {
        if (!preferences.recordHistory) return
        scope.launch { runCatching { withContext(NonCancellable) { RecentSongs(this@PlaybackService).record(song) } } }
    }
    private fun requestFocus(): Boolean {
        if (!preferences.handleAudioFocus) return true
        val result = if (Build.VERSION.SDK_INT >= 26) {
            val request = focusRequest ?: AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
                .setOnAudioFocusChangeListener(focusListener).build().also { focusRequest = it }
            audio.requestAudioFocus(request)
        } else {
            @Suppress("DEPRECATION")
            audio.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    }
    // notification() always uses MediaStyle with this active MediaSession's token. Media session
    // notifications are exempt from POST_NOTIFICATIONS, including on Android 13 and later:
    // https://developer.android.com/develop/ui/views/notifications/notification-permission#exemptions
    @SuppressLint("NotificationPermission")
    private fun publish() {
        val s = mutableState.value
        if (s.error != lastLoggedError) {
            s.error?.let { DiagnosticLog(this).record("playback", it) }
            lastLoggedError = s.error
        }
        val line = bluetoothLine(); lastBluetoothLine = line
        val title = if (preferences.bluetoothLyric && !line.isNullOrBlank()) {
            if (preferences.bluetoothFullLyric) "$line · ${s.song?.title} · ${s.song?.artist}" else line
        } else s.song?.title
        session.setMetadata(MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE, title)
            .putString(MediaMetadata.METADATA_KEY_ARTIST, s.song?.artist)
            .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, if (preferences.notificationImage) artworkState.value.bitmap else null)
            .putLong(MediaMetadata.METADATA_KEY_DURATION, s.duration.toLong()).build())
        val playbackState = when { s.preparing -> PlaybackState.STATE_BUFFERING; s.playing -> PlaybackState.STATE_PLAYING; else -> PlaybackState.STATE_PAUSED }
        session.setPlaybackState(PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or
            PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or PlaybackState.ACTION_SKIP_TO_PREVIOUS or PlaybackState.ACTION_SEEK_TO)
            .setState(playbackState, s.position.toLong(), if (s.playing) s.playbackRate else 0f).build())
        if (foreground) (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_ID, notification())
    }
    private fun bluetoothLine(): String? {
        val song = state.value.song ?: return null
        val lines = lyricState.value.takeIf { it.key == "${song.source}:${song.id}" }?.lines ?: return null
        val position = LyricTiming.lyricPosition(state.value.position.toLong(), LyricOffsets(this).get(song))
        return LrcParser.lineAt(lines, position)?.let(settings::lyricText)
    }
    private fun notification(): Notification {
        val strings = UiPreferences.context(this, scaleFonts = false)
        fun command(action: String, code: Int): PendingIntent = PendingIntent.getService(this, code,
            Intent(this, PlaybackService::class.java).setAction(action), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val s = mutableState.value
        val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else @Suppress("DEPRECATION") Notification.Builder(this)
        return builder.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(s.song?.title ?: "LX Music")
            .setLargeIcon(if (preferences.notificationImage) artworkState.value.bitmap else null)
            .setContentText(s.song?.artist).setContentIntent(open).setOngoing(s.playing || s.preparing)
            .addAction(android.R.drawable.ic_media_previous, strings.getString(R.string.ui_8c747908bf69), command(ACTION_PREVIOUS, 1))
            .addAction(if (s.playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                strings.getString(if (s.playing) R.string.ui_8d12fc0d4eb2 else R.string.ui_c3396195e91c), command(ACTION_TOGGLE, 2))
            .addAction(android.R.drawable.ic_media_next, strings.getString(R.string.ui_486e42475adb), command(ACTION_NEXT, 3))
            .setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1, 2)).build()
    }
    override fun onDestroy() {
        unregisterReceiver(noisyReceiver)
        scope.cancel()
        desktopLyrics.close()
        userSource.close()
        releasePlayback()
        if (Build.VERSION.SDK_INT >= 26) focusRequest?.let { audio.abandonAudioFocusRequest(it) }
        else @Suppress("DEPRECATION") audio.abandonAudioFocus(focusListener)
        session.release()
        super.onDestroy()
    }
    companion object {
        private const val CHANNEL = "playback"
        private const val NOTIFICATION_ID = 1
        private const val ACTION_TOGGLE = "cn.toside.music.nativeapp.TOGGLE"
        private const val ACTION_NEXT = "cn.toside.music.nativeapp.NEXT"
        private const val ACTION_PREVIOUS = "cn.toside.music.nativeapp.PREVIOUS"
        internal const val ACTION_EXIT = "cn.toside.music.nativeapp.EXIT"
    }
}
