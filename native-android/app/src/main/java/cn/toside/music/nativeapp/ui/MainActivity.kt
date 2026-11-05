package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.AppPreferences
import cn.toside.music.nativeapp.data.DislikeStore
import cn.toside.music.nativeapp.data.Downloads
import cn.toside.music.nativeapp.data.ExternalAudio
import cn.toside.music.nativeapp.data.ImportedList
import cn.toside.music.nativeapp.data.LegacyBackup
import cn.toside.music.nativeapp.data.LocalMusic
import cn.toside.music.nativeapp.data.Playlist
import cn.toside.music.nativeapp.data.Playlists
import cn.toside.music.nativeapp.data.RecentSongs
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.lyrics.LrcParser
import cn.toside.music.nativeapp.lyrics.LyricLine
import cn.toside.music.nativeapp.lyrics.Lyrics
import cn.toside.music.nativeapp.online.Board
import cn.toside.music.nativeapp.online.KugouPlaylists
import cn.toside.music.nativeapp.online.KuwoBoards
import cn.toside.music.nativeapp.online.NeteaseApi
import cn.toside.music.nativeapp.online.OnlineBoards
import cn.toside.music.nativeapp.online.OnlinePlaylist
import cn.toside.music.nativeapp.online.OnlinePlaylists
import cn.toside.music.nativeapp.online.OnlineSearch
import cn.toside.music.nativeapp.online.PlaylistSearch
import cn.toside.music.nativeapp.online.SearchHistory
import cn.toside.music.nativeapp.online.SearchSuggestions
import cn.toside.music.nativeapp.player.LyricAlignment
import cn.toside.music.nativeapp.player.LyricAppearance
import cn.toside.music.nativeapp.player.LyricOffsets
import cn.toside.music.nativeapp.player.LyricTiming
import cn.toside.music.nativeapp.player.PlaybackService
import cn.toside.music.nativeapp.player.PlayerSettings
import cn.toside.music.nativeapp.player.PlayerState
import cn.toside.music.nativeapp.source.UserSourceEntry
import cn.toside.music.nativeapp.source.UserSourceLibrary
import cn.toside.music.nativeapp.sync.BackgroundSyncSettings
import cn.toside.music.nativeapp.sync.BackgroundSyncState
import cn.toside.music.nativeapp.sync.SyncCredentialStore
import cn.toside.music.nativeapp.sync.SyncFeature
import cn.toside.music.nativeapp.sync.SyncService
import cn.toside.music.nativeapp.utils.DiagnosticLog
import cn.toside.music.nativeapp.utils.ExternalLinks
import cn.toside.music.nativeapp.utils.LxLink
import cn.toside.music.nativeapp.utils.NativeHttp
import cn.toside.music.nativeapp.utils.PermissionPolicy
import cn.toside.music.nativeapp.utils.SongShare
import cn.toside.music.nativeapp.utils.readBounded

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Bitmap
import android.graphics.Typeface
import android.content.res.ColorStateList
import android.content.res.Configuration
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.app.Activity
import android.app.AlertDialog
import android.app.Dialog
import android.net.Uri
import android.text.Editable
import android.text.TextWatcher
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.SeekBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

class MainActivity : Activity() {
    override fun attachBaseContext(newBase: Context) { super.attachBaseContext(UiPreferences.context(newBase)) }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var service: PlaybackService? = null
    private var bound = false
    private var incomingHandled = false
    private var startupPlayerPending = false
    private var stateJob: Job? = null
    private var loadJob: Job? = null
    private var suggestionJob: Job? = null
    private var syncService: SyncService? = null
    private var syncBound = false
    private var syncObserverJob: Job? = null
    private var playlistChangesJob: Job? = null
    private var syncSettingsDialog: AlertDialog? = null
    private var showingSyncStatus = false
    private var syncConflictDialog: AlertDialog? = null
    private var syncConflictId: Long? = null
    private var allSongs = emptyList<Song>()
    private var visibleSongs = emptyList<Song>()
    private lateinit var playlists: Playlists
    private lateinit var lyrics: Lyrics
    private lateinit var playerSettings: PlayerSettings
    private lateinit var lyricOffsets: LyricOffsets
    private var lyricDelayMs = 0
    private var lyricAppearance = LyricAppearance(21, LyricAlignment.LEFT)
    private var playbackSettingsDialog: AlertDialog? = null
    private var sourceUpdateJob: Job? = null
    private var sourceUpdateDialog: AlertDialog? = null
    private var pendingSourceExportId: String? = null
    private var pactDialog: AlertDialog? = null
    private lateinit var preferences: AppPreferences
    private lateinit var palette: UiPalette
    private lateinit var miniBar: LinearLayout
    private var artworkKey: String? = null
    private var artworkBitmap: Bitmap? = null
    private var artworkJob: Job? = null
    private lateinit var miniCoverImage: ImageView
    private var lyricKey: String? = null
    private var pendingLyricSongId: Long? = null
    private var pendingLyricSource: String = "local"
    private var lyricLines = emptyList<LyricLine>()
    private var lyricJob: Job? = null
    private var activePlaylist: Playlist? = null
    private var onlineMode = false
    private var boardMode = false
    private var onlinePlaylistMode = false
    private var selectedOnlinePlaylist: OnlinePlaylist? = null
    private var onlinePlaylistPage = 0
    private var selectedBoard: Board? = null
    private var boardPage = 0
    private var pendingDownload: Song? = null
    private var waitingForDownloadSettings = false
    private var waitingForServiceDownload: Song? = null
    private sealed interface AudioAction {
        data object OpenLibrary : AudioAction
        data object Resume : AudioAction
        data class Play(val songs: List<Song>, val position: Int) : AudioAction
        data class RecoverPlay(val id: Long, val source: String, val playlistId: Long?) : AudioAction
        data class ImportBackup(val uri: Uri) : AudioAction
        data class ExportBackup(val uri: Uri) : AudioAction
    }
    private var pendingAudioAction: AudioAction? = null
    private var waitingForAudioSettings = false
    private var waitingForServicePlayback: AudioAction? = null
    private var searchSource = "kg"
    private var searchPage = 0
    private var searchedText = ""
    private var changingSeek = false
    private lateinit var list: ListView
    private lateinit var status: TextView
    private lateinit var title: TextView
    private lateinit var time: TextView
    private lateinit var toggle: TextView
    private lateinit var iconFont: Typeface
    private lateinit var seek: SeekBar
    private lateinit var search: EditText
    private lateinit var heading: TextView
    private lateinit var listActionButton: TextView
    private lateinit var pageTitle: TextView
    private lateinit var lyric: TextView
    private lateinit var loadMore: TextView
    private var playerDialog: Dialog? = null
    private var detailTitle: TextView? = null
    private var detailTime: TextView? = null
    private var detailSeek: SeekBar? = null
    private var detailToggle: TextView? = null
    private var detailMode: TextView? = null
    private var detailLyrics: LinearLayout? = null
    private var detailScroll: ScrollView? = null
    private var detailCover: FrameLayout? = null
    private var detailCoverImage: ImageView? = null
    private var detailPageToggle: TextView? = null
    private var detailShowingLyrics = false
    private var detailSeeking = false
    private var detailRenderedLines: List<LyricLine>? = null
    private var detailActiveLine = -1
    private data class PageSnapshot(val songs: List<Song>, val playlist: Playlist?, val board: Board?, val onlinePlaylist: OnlinePlaylist?,
        val online: Boolean, val boards: Boolean, val onlineLists: Boolean, val source: String, val query: String, val searchVisible: Boolean,
        val searchPage: Int, val boardPage: Int, val playlistPage: Int, val more: Boolean, val loading: Boolean, val first: Int, val top: Int)
    private var pendingScroll: Pair<Int, Int>? = null
    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            service = (binder as PlaybackService.LocalBinder).service
            stateJob = scope.launch { service?.state?.collectLatest { renderPlayer(it) } }
            lyricJob = scope.launch { service?.lyricState?.collectLatest { value ->
                if (value.key == lyricKey) {
                    lyricLines = value.lines
                    service?.state?.value?.let { updateLyric(it.position); renderDetails(it) }
                    if (value.error != null) lyric.text = value.error
                }
            } }
            artworkJob = scope.launch { service?.artworkState?.collectLatest { value ->
                val song = service?.state?.value?.song
                if (value.key == song?.let { "${it.source}:${it.id}" }) { artworkBitmap = value.bitmap; updateArtwork() }
            } }
            sourceUpdateJob = scope.launch { service?.sourceUpdates?.collectLatest { update ->
                sourceUpdateDialog?.dismiss(); sourceUpdateDialog = null
                if (update != null) {
                    val builder = AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_7894327145b0, java.lang.String.valueOf(update.name))).setMessage(update.log)
                        .setNegativeButton(getString(R.string.ui_3fd47edce45b)) { _, _ -> service?.dismissSourceUpdate() }
                        .setOnCancelListener { service?.dismissSourceUpdate() }
                    update.url?.let { url -> builder.setPositiveButton(getString(R.string.ui_d74a71e7af34)) { _, _ ->
                        service?.dismissSourceUpdate(); runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
                    } }
                    sourceUpdateDialog = builder.show()
                }
            } }
            waitingForServicePlayback?.let { action -> waitingForServicePlayback = null; performAudioAction(action) }
            waitingForServiceDownload?.let { song -> waitingForServiceDownload = null; downloadSong(song) }
            if (intent.getBooleanExtra("open-player", false)) { intent.removeExtra("open-player"); showPlayerDetails() }
            handleIncomingIntent()
        }
        override fun onServiceDisconnected(name: ComponentName?) { service = null; stateJob?.cancel(); lyricJob?.cancel(); artworkJob?.cancel(); sourceUpdateJob?.cancel() }
    }
    private val syncConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            syncService = (binder as SyncService.LocalBinder).service
            syncObserverJob = scope.launch { syncService?.state?.collectLatest { renderSyncState(it) } }
        }
        override fun onServiceDisconnected(name: ComponentName?) { syncService = null; syncObserverJob?.cancel() }
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        val activeTheme = NativeThemes(this).active()
        setTheme(if (activeTheme.dark) R.style.NativeDark else R.style.NativeLight)
        super.onCreate(savedInstanceState)
        palette = UiPalette(this, activeTheme)
        playlists = Playlists(applicationContext)
        lyrics = Lyrics(applicationContext)
        playerSettings = PlayerSettings(applicationContext)
        lyricOffsets = LyricOffsets(applicationContext)
        lyricAppearance = playerSettings.appearance(resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE)
        preferences = AppPreferences(applicationContext)
        startupPlayerPending = savedInstanceState == null && preferences.startupPlayer
        iconFont = Typeface.createFromAsset(assets, "fonts/icomoon.ttf")
        pendingLyricSongId = savedInstanceState?.let { if (it.containsKey("lyricSongId")) it.getLong("lyricSongId") else null }
        pendingLyricSource = savedInstanceState?.getString("lyricSource") ?: "local"
        savedInstanceState?.getBundle("pendingDownload")?.let { pendingDownload = songFromBundle(it) }
        savedInstanceState?.getBundle("waitingForServiceDownload")?.let { waitingForServiceDownload = songFromBundle(it) }
        waitingForDownloadSettings = savedInstanceState?.getBoolean("waitingForDownloadSettings", false) ?: false
        pendingAudioAction = savedInstanceState?.getBundle("pendingAudioAction")?.let(::audioActionFromBundle)
        pendingSourceExportId = savedInstanceState?.getString("source-export-id")
        incomingHandled = savedInstanceState?.getBoolean("incoming-handled", false) ?: false
        waitingForAudioSettings = savedInstanceState?.getBoolean("waitingForAudioSettings", false) ?: false
        buildUi()
        if (preferences.bool("common.isAgreePact")) {
            if (!restorePage(savedInstanceState)) { if (hasAudioPermission()) loadSongs() else showLocalPermissionPrompt() }
        } else pactDialog = showPact(this, scope) {
            if (hasAudioPermission()) loadSongs() else showLocalPermissionPrompt()
            startAppServices()
        }
    }
    override fun onStart() {
        super.onStart()
        if (preferences.bool("common.isAgreePact")) startAppServices()
    }
    private fun startAppServices() {
        if (bound) return
        bound = bindService(Intent(this, PlaybackService::class.java), connection, Context.BIND_AUTO_CREATE)
        syncBound = bindService(Intent(this, SyncService::class.java), syncConnection, Context.BIND_AUTO_CREATE)
        playlistChangesJob = scope.launch { playlists.changes.onStart { emit(Unit) }.collect { refreshSynchronizedPlaylist() } }
        try { SyncService.resumeIfEnabled(this) }
        catch (e: RuntimeException) { toast(getString(R.string.ui_671ad117f5de, java.lang.String.valueOf(e.localizedMessage))) }
        checkNativeUpdatesOnStartup(this, scope)
    }
    override fun onStop() {
        playbackSettingsDialog?.dismiss()
        stateJob?.cancel()
        lyricJob?.cancel()
        artworkJob?.cancel()
        sourceUpdateJob?.cancel(); sourceUpdateDialog?.dismiss(); sourceUpdateDialog = null
        suggestionJob?.cancel()
        if (bound) { unbindService(connection); bound = false; service = null }
        syncObserverJob?.cancel(); playlistChangesJob?.cancel()
        syncConflictDialog?.dismiss(); syncConflictDialog = null; syncConflictId = null
        if (syncBound) { unbindService(syncConnection); syncBound = false; syncService = null }
        super.onStop()
    }
    override fun onResume() {
        super.onResume()
        service?.refreshLyricPreferences()
        if (waitingForAudioSettings) {
            waitingForAudioSettings = false
            val action = pendingAudioAction; pendingAudioAction = null
            if (hasAudioPermission() && action != null) performAudioAction(action)
            else if (action != null) onAudioAccessDenied(action)
        }
        if (waitingForDownloadSettings) {
            waitingForDownloadSettings = false
            val song = pendingDownload; pendingDownload = null
            val permission = PermissionPolicy.downloadWrite(Build.VERSION.SDK_INT)
            if (song != null && (permission == null || checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED)) downloadSong(song)
            else if (song != null) toast(getString(R.string.ui_cbe111f9db69))
        }
    }
    override fun onDestroy() { pactDialog?.dismiss(); playerDialog?.dismiss(); playbackSettingsDialog?.dismiss(); syncSettingsDialog?.dismiss(); syncConflictDialog?.dismiss(); scope.cancel(); super.onDestroy() }
    override fun onSaveInstanceState(outState: Bundle) {
        val page = pageSnapshot()
        outState.putInt("home-mode", when { page.boards -> 2; page.onlineLists -> 3; page.online -> 1; else -> 0 })
        outState.putString("home-source", page.source); outState.putString("home-query", page.query.take(2000)); outState.putBoolean("home-search-visible", page.searchVisible)
        outState.putInt("home-first", page.first); outState.putInt("home-top", page.top)
        page.playlist?.let { outState.putLong("home-playlist", it.id) }
        page.board?.let { outState.putStringArray("home-board", arrayOf(it.id, it.name, it.source)) }
        page.onlinePlaylist?.let { outState.putStringArray("home-online-list", arrayOf(it.id, it.digest, it.name, it.author, it.source)) }
        outState.putBoolean("incoming-handled", incomingHandled)
        pendingLyricSongId?.let { outState.putLong("lyricSongId", it) }
        outState.putString("lyricSource", pendingLyricSource)
        pendingDownload?.let { outState.putBundle("pendingDownload", songToBundle(it)) }
        waitingForServiceDownload?.let { outState.putBundle("waitingForServiceDownload", songToBundle(it)) }
        pendingAudioAction?.let { outState.putBundle("pendingAudioAction", audioActionToBundle(it)) }
        outState.putBoolean("waitingForAudioSettings", waitingForAudioSettings)
        outState.putBoolean("waitingForDownloadSettings", waitingForDownloadSettings)
        pendingSourceExportId?.let { outState.putString("source-export-id", it) }
        super.onSaveInstanceState(outState)
    }
    @Deprecated("Retained page data contains no Activity, Context or Views")
    override fun onRetainNonConfigurationInstance(): Any = pageSnapshot()
    private fun pageSnapshot() = PageSnapshot(allSongs, activePlaylist, selectedBoard, selectedOnlinePlaylist, onlineMode, boardMode, onlinePlaylistMode,
        searchSource, search.text.toString(), search.visibility == View.VISIBLE, searchPage, boardPage, onlinePlaylistPage,
        loadMore.visibility == View.VISIBLE || loadJob?.isActive == true && allSongs.isNotEmpty(), loadJob?.isActive == true, list.firstVisiblePosition, list.getChildAt(0)?.top ?: 0)
    private fun restorePage(saved: Bundle?): Boolean {
        val retained = lastNonConfigurationInstance as? PageSnapshot
        if (retained != null) {
            allSongs = retained.songs; activePlaylist = retained.playlist; selectedBoard = retained.board; selectedOnlinePlaylist = retained.onlinePlaylist
            onlineMode = retained.online; boardMode = retained.boards; onlinePlaylistMode = retained.onlineLists; searchSource = retained.source
            searchPage = retained.searchPage; searchedText = retained.query; boardPage = retained.boardPage; onlinePlaylistPage = retained.playlistPage
            search.setText(retained.query); search.visibility = if (retained.searchVisible) View.VISIBLE else View.GONE
            updateListAction()
            pageTitle.text = getString(when { boardMode -> R.string.ui_1ee95aa94712; onlinePlaylistMode -> R.string.ui_473e57b72072; onlineMode -> R.string.ui_44ce7ae909bb; else -> R.string.ui_27c95ec6b766 })
            heading.text = when { boardMode -> "›   ${selectedBoard?.name.orEmpty()}"; onlinePlaylistMode -> "›   ${selectedOnlinePlaylist?.name.orEmpty()}"
                onlineMode -> getString(R.string.ui_e07216a6d505, sourceLabel()); activePlaylist != null -> "›   ${activePlaylist!!.name}"; else -> getString(R.string.ui_33eeaa47c231) }
            if (preferences.saveScroll) pendingScroll = retained.first to retained.top
            filterSongs(); loadMore.visibility = if (retained.more) View.VISIBLE else View.GONE
            if (allSongs.isEmpty() || retained.loading) reloadRestoredPage()
            return true
        }
        if (saved == null || !saved.containsKey("home-mode")) return false
        searchSource = saved.getString("home-source")?.takeIf { it in ExternalLinks.sources } ?: "kg"
        val query = saved.getString("home-query").orEmpty()
        if (preferences.saveScroll) pendingScroll = saved.getInt("home-first") to saved.getInt("home-top")
        when (saved.getInt("home-mode")) {
            1 -> { openSearchPage(false); search.setText(query); if (query.isNotBlank()) searchOnline() }
            2 -> saved.getStringArray("home-board")?.takeIf { it.size == 3 }?.let { loadBoard(Board(it[0], it[1], it[2])) } ?: return false
            3 -> saved.getStringArray("home-online-list")?.takeIf { it.size == 5 }?.let { loadOnlinePlaylist(OnlinePlaylist(it[0], it[1], it[2], it[3], it[4])) } ?: return false
            else -> {
                if (!saved.containsKey("home-playlist")) return false
                scope.launch {
                    val playlist = playlists.list().firstOrNull { it.id == saved.getLong("home-playlist") }
                    if (playlist != null) { loadPlaylist(playlist); search.setText(query); search.visibility = if (saved.getBoolean("home-search-visible")) View.VISIBLE else View.GONE }
                    else openLocalPage(false)
                }
            }
        }
        return true
    }
    private fun reloadRestoredPage() {
        when { boardMode -> selectedBoard?.let { loadBoard(it) }; onlinePlaylistMode -> selectedOnlinePlaylist?.let { loadOnlinePlaylist(it) }
            onlineMode -> if (search.text.isNotBlank()) searchOnline() else { status.text = getString(R.string.ui_bd997b86cde1) }
            activePlaylist != null -> { val query = search.text.toString(); loadPlaylist(activePlaylist!!); search.setText(query) }
            hasAudioPermission() -> loadSongs(); else -> showLocalPermissionPrompt() }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent); setIntent(intent); incomingHandled = false
        if (intent.getBooleanExtra("open-player", false) && service != null) { intent.removeExtra("open-player"); showPlayerDetails() }
        handleIncomingIntent()
    }
    private fun handleIncomingIntent() {
        if (incomingHandled || service == null || !preferences.bool("common.isAgreePact")) return
        incomingHandled = true
        val incoming = intent
        val uri = incoming.data ?: if (incoming.action == Intent.ACTION_SEND) {
            @Suppress("DEPRECATION")
            incoming.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
        } else null
        val text = incoming.getStringExtra(Intent.EXTRA_TEXT)
        if (uri == null && text.isNullOrBlank()) return
        scope.launch {
            try {
                val link = uri ?: text?.trim()?.takeIf { it.startsWith("lxmusic://") }?.let(Uri::parse)
                if (link?.scheme == "lxmusic") { runLxLink(ExternalLinks.parse(link)); return@launch }
                if (uri == null) { showPlaylistLink(text.orEmpty()); return@launch }
                require(uri.scheme in setOf("file", "content")) { getString(R.string.ui_936ed13655b8) }
                val name = ExternalAudio.name(this@MainActivity, uri)
                val extension = name.substringAfterLast('.', "").lowercase()
                if (extension == "js") {
                    AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_93c862a05840)).setMessage(name).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
                        .setPositiveButton(getString(R.string.ui_576d81bb0631)) { _, _ -> importSourceUri(uri) }.show()
                } else if (extension in setOf("json", "lxmc") || incoming.type == "application/json" || incoming.type == "application/octet-stream" && extension !in setOf("mp3", "flac", "wav", "ogg", "m4a", "aac", "opus")) {
                    onActivityResult(REQUEST_BACKUP, RESULT_OK, Intent().setData(uri))
                } else {
                    require(incoming.type.orEmpty().startsWith("audio/") || extension in setOf("mp3", "flac", "wav", "ogg", "m4a", "aac", "opus")) { getString(R.string.ui_f327410a7cc1) }
                    val song = ExternalAudio.import(this@MainActivity, uri)
                    performAudioAction(AudioAction.Play(listOf(song), 0))
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_11d9e3c1753d, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun importSourceUri(uri: Uri) {
        scope.launch {
            try {
                val script = withContext(Dispatchers.IO) { contentResolver.openInputStream(uri)?.use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) } ?: error(getString(R.string.ui_5903b3b5a9ca)) }
                (service ?: error(getString(R.string.ui_7ca47a28e695))).importSource(script); toast(getString(R.string.ui_18710cc58894))
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_0874f11320ab, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private suspend fun runLxLink(link: LxLink) {
        val player = service ?: return
        when (link.type) {
            "player" -> when (link.action) {
                "play" -> toggleResumeFromLink()
                "pause" -> player.pause()
                "skipNext" -> player.next()
                "skipPrev" -> player.previous()
                "togglePlay" -> togglePlayback()
                "collect", "uncollect" -> player.state.value.song?.let { song ->
                    val id = playlists.loveList()
                    if (link.action == "collect") playlists.add(id, song) else playlists.remove(id, song)
                }
                "dislike" -> player.state.value.song?.let { DislikeStore(this).add(it.title, it.artist); player.next() }
                else -> error(getString(R.string.ui_908fd41b724a))
            }
            "songlist" -> {
                require(link.action == "play") { getString(R.string.ui_93f8317b3c21) }
                val source = link.data?.optString("source") ?: link.paths.getOrNull(0).orEmpty()
                val id = link.data?.optString("id")?.takeIf { it.isNotBlank() } ?: link.data?.optString("url")?.takeIf { it.isNotBlank() } ?: link.paths.getOrNull(1).orEmpty()
                val index = link.data?.optInt("index", 1) ?: link.paths.getOrNull(2)?.toIntOrNull() ?: 1
                val list = ExternalLinks.playlist(source, id, applicationContext)
                toast(getString(R.string.ui_477a0fc0b291))
                val songs = ExternalLinks.allSongs(list, applicationContext)
                require(songs.isNotEmpty()) { getString(R.string.ui_ed2156c5f636) }; player.play(songs, (index - 1).coerceIn(0, songs.lastIndex))
            }
            "music" -> {
                if (link.action == "play") {
                    val data = link.data ?: error(getString(R.string.ui_0fea25b96961))
                    require(data.optString("source") in ExternalLinks.sources && data.optString("name").isNotBlank()) { getString(R.string.ui_4f751ba03fed) }
                    val song = LegacyBackup.convert(data, emptyMap()) ?: error(getString(R.string.ui_4f751ba03fed))
                    val next = player.queueState.value?.let { it.index + 1 } ?: 0
                    player.enqueue(listOf(song), true)
                    player.playQueued(next)
                } else if (link.action == "searchPlay") {
                    val name = link.data?.optString("name")?.take(200) ?: link.paths.firstOrNull()?.take(200).orEmpty()
                    require(name.isNotBlank()) { getString(R.string.ui_5bfaaf2346e1) }
                    val singer = link.data?.optString("singer").orEmpty()
                    val split = if (link.data == null && name.contains('-')) name.split('-', limit = 2).map(String::trim) else listOf(name, singer)
                    val duration = link.data?.optString("interval")?.split(':')?.mapNotNull(String::toLongOrNull)?.fold(0L) { total, part -> total * 60 + part }?.times(1000) ?: 0
                    val target = Song(0, Uri.EMPTY, split[0], split.getOrElse(1) { "" }, duration,
                        sourceInfo = org.json.JSONObject().put("albumName", link.data?.optString("albumName").orEmpty()).toString())
                    val song = player.otherSources(target).firstOrNull() ?: error(getString(R.string.ui_6c9ad7b94469))
                    if (link.data?.optBoolean("playLater") == true) player.enqueue(listOf(song)) else {
                        val next = player.queueState.value?.let { it.index + 1 } ?: 0
                        player.enqueue(listOf(song), true); player.playQueued(next)
                    }
                } else error(getString(R.string.ui_bf5201384405))
            }
        }
    }
    private fun toggleResumeFromLink() {
        if (PermissionPolicy.requiresLibraryAccess(this, service?.state?.value?.song) && !hasAudioPermission()) requestAudioAccess(AudioAction.Resume) else service?.resume()
    }
    private fun showPlaylistLink(initial: String = "") {
        val input = EditText(this).apply { hint = getString(R.string.ui_fd2c0650c75b); setText(initial); maxLines = 4 }
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_ac7aa03a458f)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_acfc4e74a650)) { _, _ ->
            val value = input.text.toString().trim()
            val guessed = ExternalLinks.sourceFromUrl(value)
            fun open(source: String) { scope.launch {
                try { loadOnlinePlaylist(ExternalLinks.playlist(source, value, applicationContext)) }
                catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_03c68e4bc44d, java.lang.String.valueOf(e.localizedMessage))) }
            } }
            if (guessed != null) open(guessed) else AlertDialog.Builder(this).setTitle(getString(R.string.ui_72477c9eeff6))
                .setItems(arrayOf(getString(R.string.ui_2a6eaaa1f30c), getString(R.string.ui_6f5fe8042a63), getString(R.string.ui_3ef42060a2e5), getString(R.string.ui_a62864e8c353), getString(R.string.ui_017e2d45158b))) { _, index -> open(ExternalLinks.sources[index]) }.show()
        }.show()
    }
    private fun refreshOnlinePlaylist(playlist: Playlist) {
        val source = playlist.source ?: return; val id = playlist.sourceListId ?: return
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_f5d5d510fdfe)).setMessage(getString(R.string.ui_ca37ac5cc4f6))
            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_aee887434131)) { _, _ -> scope.launch {
                try {
                    toast(getString(R.string.ui_129963b15e11))
                    val songs = ExternalLinks.allSongs(OnlinePlaylist(id, if (source == "kw") "8" else "", playlist.name, "", source), applicationContext)
                    playlists.replaceSongs(playlist.id, songs); toast(getString(R.string.ui_07c05b19b201, java.lang.String.valueOf(songs.size)))
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_e7f735120024, java.lang.String.valueOf(e.localizedMessage))) }
            } }.show()
    }
    private fun buildUi() {
        val primary = palette.primary
        val foreground = palette.foreground
        val root = HomeNavigationLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(palette.surface); fitsSystemWindows = true
            eligible = { y -> preferences.bool("common.homePageScroll", true) &&
                (!::miniBar.isInitialized || y < miniBar.top) &&
                (!::search.isInitialized || search.visibility != View.VISIBLE || y < search.top || y > search.bottom) }
            navigate = { direction ->
                val current = when { boardMode -> 2; onlinePlaylistMode -> 3; onlineMode -> 1; else -> 0 }
                when ((current + direction).coerceIn(0, 3).takeIf { it != current }) {
                    0 -> openLocalPage(false)
                    1 -> openSearchPage()
                    2 -> loadBoard(selectedBoard ?: OnlineBoards().boards.first())
                    3 -> selectedOnlinePlaylist?.let { loadOnlinePlaylist(it) } ?: showOnlinePlaylists()
                }
            }
        }
        val header = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL; orientation = LinearLayout.HORIZONTAL }
        val menu = TextView(this).apply {
            text = 59680.toChar().toString(); typeface = iconFont; textSize = 18f; gravity = Gravity.CENTER; setTextColor(foreground); contentDescription = getString(R.string.ui_e35a36e26d52)
            setOnClickListener { showNavigation() }
        }
        pageTitle = TextView(this).apply { text = getString(R.string.ui_27c95ec6b766); textSize = 18f; setTextColor(foreground); gravity = Gravity.CENTER_VERTICAL }
        if (!preferences.menuOnRight) header.addView(menu, LinearLayout.LayoutParams(dp(48), dp(42)))
        header.addView(pageTitle, LinearLayout.LayoutParams(0, dp(42), 1f))
        if (preferences.menuOnRight) header.addView(menu, LinearLayout.LayoutParams(dp(48), dp(42)))
        root.addView(header)
        val listHeader = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL; orientation = LinearLayout.HORIZONTAL }
        heading = TextView(this).apply {
            text = getString(R.string.ui_33eeaa47c231); textSize = 14f; setTextColor(foreground); gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(15), 0, 0, 0); setOnClickListener {
                if (boardMode) showBoards() else if (onlinePlaylistMode) showOnlinePlaylists() else if (onlineMode) showSearchSources() else showPlaylists()
            }
            setOnLongClickListener {
                if ((boardMode || onlinePlaylistMode) && allSongs.isNotEmpty()) { saveCurrentOnlineList(); true } else false
            }
        }
        listHeader.addView(heading, LinearLayout.LayoutParams(0, dp(40), 1f))
        listActionButton = TextView(this).apply {
            text = 59660.toChar().toString(); typeface = iconFont; textSize = 18f; gravity = Gravity.CENTER; setTextColor(foreground); contentDescription = getString(R.string.ui_073a0d57165c)
            setOnClickListener {
                if (boardMode || onlinePlaylistMode) showOnlineListActions()
                else search.visibility = if (search.visibility == View.VISIBLE) View.GONE else View.VISIBLE
            }
            setOnLongClickListener { showBatchSongs(); true }
        }
        listHeader.addView(listActionButton, LinearLayout.LayoutParams(dp(48), dp(40)))
        root.addView(listHeader)
        root.addView(View(this).apply { setBackgroundColor(palette.divider) }, LinearLayout.LayoutParams(-1, dp(1)))
        search = AutoCompleteTextView(this).apply {
            threshold = 1
            setOnItemClickListener { _, _, _, _ -> if (onlineMode && !boardMode && !onlinePlaylistMode) searchOnline() }
            setOnLongClickListener { if (onlineMode) { showSearchTools(); true } else false }
            hint = getString(R.string.ui_7ad45199f05a); textSize = 14f; setSingleLine(true); visibility = View.GONE; imeOptions = EditorInfo.IME_ACTION_SEARCH
            setPadding(dp(16), 0, dp(16), 0)
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_SEARCH && onlineMode) { searchOnline(); true } else false
            }
        }
        root.addView(search, LinearLayout.LayoutParams(-1, dp(44)))
        status = TextView(this).apply {
            text = getString(R.string.ui_2e14553ec90c); textSize = 12f; setTextColor(palette.muted); setPadding(dp(16), dp(6), dp(16), dp(6))
            setOnClickListener { if (!onlineMode && activePlaylist == null && !hasAudioPermission()) requestAudioAccess(AudioAction.OpenLibrary) }
        }
        root.addView(status)
        list = ListView(this).apply { divider = null; isVerticalScrollBarEnabled = false }
        root.addView(list, LinearLayout.LayoutParams(-1, 0, 1f))
        loadMore = TextView(this).apply {
            text = getString(R.string.ui_af90a08fec8e); textSize = 13f; gravity = Gravity.CENTER; setTextColor(primary); visibility = View.GONE
            setOnClickListener {
                if (boardMode) selectedBoard?.let { loadBoard(it, append = true) }
                else if (onlinePlaylistMode) selectedOnlinePlaylist?.let { loadOnlinePlaylist(it, append = true) }
                else searchOnline(append = true)
            }
        }
        root.addView(loadMore, LinearLayout.LayoutParams(-1, dp(38)))
        val playerBar = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL; orientation = LinearLayout.HORIZONTAL; setPadding(dp(5), dp(5), dp(5), dp(5))
            setBackgroundColor(palette.surface); elevation = dp(10).toFloat()
        }
        miniBar = playerBar
        val cover = FrameLayout(this).apply {
            background = GradientDrawable().apply { setColor(palette.placeholder); cornerRadius = dp(3).toFloat() }
            contentDescription = getString(R.string.ui_f518674b61f6); setOnClickListener { showPlayerDetails() }
        }
        cover.addView(TextView(this).apply { text = "LX"; textSize = 17f; gravity = Gravity.CENTER; setTextColor(primary) }, FrameLayout.LayoutParams(-1, -1))
        miniCoverImage = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; visibility = View.GONE }
        cover.addView(miniCoverImage, FrameLayout.LayoutParams(-1, -1))
        playerBar.addView(cover, LinearLayout.LayoutParams(dp(46), dp(46)))
        val info = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(8), 0, 0, 0) }
        title = TextView(this).apply { text = getString(R.string.ui_2389f5b06bce); textSize = 14f; setTextColor(foreground); maxLines = 1 }
        info.addView(title)
        lyric = TextView(this).apply { text = ""; textSize = 11f; setTextColor(primary); maxLines = 1 }
        info.addView(lyric)
        time = TextView(this).apply { text = "00:00 / 00:00"; textSize = 11f; setTextColor(palette.muted) }
        info.addView(time)
        info.setOnClickListener { showPlayerDetails() }
        playerBar.addView(info, LinearLayout.LayoutParams(0, dp(46), 1f))
        toggle = TextView(this).apply {
            text = 59653.toChar().toString(); typeface = iconFont; textSize = 24f; gravity = Gravity.CENTER; setTextColor(foreground); contentDescription = getString(R.string.ui_c3396195e91c)
            setOnClickListener {
            togglePlayback()
        } }
        playerBar.addView(toggle, LinearLayout.LayoutParams(dp(46), dp(46)))
        playerBar.addView(TextView(this).apply {
            text = 59654.toChar().toString(); typeface = iconFont; textSize = 24f; gravity = Gravity.CENTER; setTextColor(foreground)
            contentDescription = getString(R.string.ui_486e42475adb); setOnClickListener { service?.next() }
        }, LinearLayout.LayoutParams(dp(46), dp(46)))
        root.addView(playerBar)
        seek = SeekBar(this).apply {
            progressTintList = ColorStateList.valueOf(primary); thumbTintList = ColorStateList.valueOf(primary)
            contentDescription = getString(R.string.ui_fc16e2a0fca6)
        }
        root.addView(seek, LinearLayout.LayoutParams(-1, dp(18)))
        palette.background(root); palette.textStyle(root)
        setContentView(root)
        ScreenInsets.install(window, root)
        search.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (!onlineMode) filterSongs() else updateSuggestions(s?.toString().orEmpty())
            }
            override fun afterTextChanged(s: Editable?) = Unit
        })
        list.setOnItemClickListener { _, _, position, _ ->
            val song = visibleSongs.getOrNull(position) ?: return@setOnItemClickListener
            if (PermissionPolicy.requiresLibraryAccess(this, song) && !hasAudioPermission()) requestAudioAccess(AudioAction.Play(visibleSongs.toList(), position))
            else performAudioAction(AudioAction.Play(visibleSongs.toList(), position))
        }
        list.setOnItemLongClickListener { _, _, position, _ ->
            val song = visibleSongs.getOrNull(position) ?: return@setOnItemLongClickListener false
            showSongActions(song)
            true
        }
        seek.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar?, progress: Int, fromUser: Boolean) = Unit
            override fun onStartTrackingTouch(bar: SeekBar?) { changingSeek = true }
            override fun onStopTrackingTouch(bar: SeekBar?) { changingSeek = false; service?.seekTo(bar?.progress ?: 0) }
        })
    }
    private fun showNavigation() {
        val labels = mutableListOf(getString(R.string.ui_a9531e47b75d), getString(R.string.ui_c2dd14825672), getString(R.string.ui_87a2113eb66f), getString(R.string.ui_1ee95aa94712), getString(R.string.ui_259597bf6ca7), getString(R.string.ui_3158c8d56b7b), getString(R.string.ui_a5cd0a9169e8), getString(R.string.ui_3facd3e00be5), getString(R.string.ui_599818eb56df), getString(R.string.ui_727036c7fc2a), getString(R.string.ui_2a3ec620e12c), getString(R.string.ui_8c38525734c0), getString(R.string.ui_486b54a7b0af), getString(R.string.ui_6e763b71e69c), getString(R.string.ui_f01b6815d826), getString(R.string.ui_cad84b75d661), getString(R.string.ui_426744e26e7e), getString(R.string.ui_ac7aa03a458f), getString(R.string.ui_18a9d61deeb3), getString(R.string.ui_788db1cfec2a), getString(R.string.ui_4fd38bc4f6d4), getString(R.string.ui_bb1d19b85634))
        if (preferences.showBack) labels.add(getString(R.string.ui_f75a93326a3c))
        if (preferences.showExit) labels.add(getString(R.string.ui_b0d269c8707c))
        val navigation = AlertDialog.Builder(this).setTitle("LX Music").setItems(labels.toTypedArray()) { _, which ->
            if (labels[which] == getString(R.string.ui_f75a93326a3c)) { moveTaskToBack(true); return@setItems }
            if (labels[which] == getString(R.string.ui_b0d269c8707c)) {
                AlertDialog.Builder(this).setTitle(getString(R.string.ui_0c5f909e92d2)).setMessage(getString(R.string.ui_2474ed447b00))
                    .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_498e1d59b4d7)) { _, _ ->
                        service?.pause()
                        startService(Intent(this, PlaybackService::class.java).setAction(PlaybackService.ACTION_EXIT))
                        startService(Intent(this, SyncService::class.java).setAction(SyncService.ACTION_EXIT))
                        finishAndRemoveTask()
                    }.show()
                return@setItems
            }
            if (which == 0) openLocalPage(true)
            else if (which == 1) showPlaylists()
            else if (which == 2) openSearchPage()
            else if (which == 3) showBoards()
            else if (which == 4) showOnlinePlaylists()
            else if (which == 5) {
                @Suppress("DEPRECATION")
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*" }, REQUEST_SOURCE)
            } else if (which == 6) {
                @Suppress("DEPRECATION")
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*" }, REQUEST_BACKUP)
            } else if (which == 7) {
                @Suppress("DEPRECATION")
                startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE); type = "application/octet-stream"; putExtra(Intent.EXTRA_TITLE, "lx_list.lxmc")
                }, REQUEST_EXPORT)
            } else if (which == 8) showPlaybackQuality() else if (which == 9) showSyncSettings()
            else if (which == 10) showDislikeRules() else if (which == 11) showPlaybackSettings()
            else if (which == 12) showDesktopLyricSettings(this) { service?.refreshLyricPreferences() }
            else if (which == 13) showSources() else if (which == 14) showPlaybackQueue()
            else if (which == 15) showSearchTools() else if (which == 16) showHistory() else if (which == 17) showPlaylistLink()
            else if (which == 18) showGeneralSettings(this, scope, service) { service?.refreshPreferences(); filterSongs(); service?.state?.value?.let(::renderPlayer) }
            else if (which == 19) showThemeSettings(this)
            else if (which == 20) showAbout(this, scope)
            else if (which == 21) showDiagnostics(this, scope) {
                @Suppress("DEPRECATION")
                startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE); type = "text/plain"; putExtra(Intent.EXTRA_TITLE, "lx-native-diagnostics.txt")
                }, REQUEST_LOG_EXPORT)
            }
        }.show()
        navigation.window?.apply {
            setGravity((if (preferences.menuOnRight) Gravity.END else Gravity.START) or Gravity.CENTER_VERTICAL)
            setLayout((resources.displayMetrics.widthPixels * 0.86f).toInt().coerceAtMost(dp(480)), -2)
        }
    }
    private fun openLocalPage(requestPermission: Boolean) {
        onlineMode = false; boardMode = false; onlinePlaylistMode = false; updateListAction(); pageTitle.text = getString(R.string.ui_27c95ec6b766); loadMore.visibility = View.GONE
        activePlaylist = null; heading.text = getString(R.string.ui_33eeaa47c231); search.text.clear(); search.visibility = View.GONE
        if (hasAudioPermission()) loadSongs() else if (requestPermission) requestAudioAccess(AudioAction.OpenLibrary) else showLocalPermissionPrompt()
    }
    private fun openSearchPage(showTools: Boolean = true) {
        onlineMode = true; boardMode = false; onlinePlaylistMode = false; updateListAction(); pageTitle.text = getString(R.string.ui_44ce7ae909bb); activePlaylist = null; heading.text = getString(R.string.ui_e07216a6d505, sourceLabel()); loadMore.visibility = View.GONE
        loadJob?.cancel(); allSongs = emptyList(); visibleSongs = emptyList(); search.text.clear(); search.visibility = View.VISIBLE
        status.text = getString(R.string.ui_bd997b86cde1); list.adapter = null; search.requestFocus()
        if (showTools && preferences.hotSearch) showSearchTools()
    }
    private fun showDislikeRules() {
        val store = DislikeStore(applicationContext)
        val input = EditText(this).apply {
            setText(store.get().text); hint = getString(R.string.ui_14b8d12a0ed6)
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 6; maxLines = 12; gravity = Gravity.TOP
        }
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_2a3ec620e12c)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
            .setPositiveButton(getString(R.string.ui_a3030bf8f16d)) { _, _ -> updateDislikeRules { store.save(input.text.toString()) } }
            .setNeutralButton(getString(R.string.ui_1ef3de06b32e)) { _, _ -> updateDislikeRules { store.clear() } }.show()
    }
    private fun updateDislikeRules(change: suspend () -> Unit) {
        scope.launch {
            try { change(); toast(getString(R.string.ui_e2e7a21aa13b)) }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_749d84b5fa76, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun showDislikeChoices(song: Song) {
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_9b3d69ae09ce))
            .setItems(arrayOf(getString(R.string.ui_a5c2cb376cf6), getString(R.string.ui_3ab737d3e7d1), getString(R.string.ui_024a5e862936))) { _, which ->
                val name = if (which == 2) "" else song.title
                val artist = if (which == 1) "" else song.artist
                if (name.isBlank() && artist.isBlank()) { toast(getString(R.string.ui_b7f9c185ce8e)); return@setItems }
                updateDislikeRules { DislikeStore(applicationContext).add(name, artist) }
            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
    }
    private fun showSyncSettings() {
        val current = syncService?.state?.value
        val background = BackgroundSyncSettings(applicationContext)
        if (current?.active == true || background.enabled) {
            showingSyncStatus = true
            syncSettingsDialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_727036c7fc2a))
                .setMessage(current?.message?.takeIf { it.isNotBlank() }?.let(::syncMessage) ?: getString(R.string.ui_9daac0f16f9a))
                .setNegativeButton(getString(R.string.ui_572cf45ba436), null).setPositiveButton(getString(R.string.ui_a33f3804768e)) { _, _ ->
                    SyncService.disconnect(this); toast(getString(R.string.ui_49d0208f4a94))
                }.show().also { it.setOnDismissListener { showingSyncStatus = false } }
            return
        }
        val store = SyncCredentialStore(applicationContext)
        val address = EditText(this).apply { hint = getString(R.string.ui_9f9e4c872ae8); setSingleLine(true); setText(store.lastAddress()) }
        val code = EditText(this).apply { hint = getString(R.string.ui_0464d293b4f4); setSingleLine(true); inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD }
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(8), dp(20), 0); addView(address); addView(code) }
        layout.addView(android.widget.Button(this).apply {
            text = getString(R.string.sync_history)
            setOnClickListener {
                val hosts = store.history()
                if (hosts.isEmpty()) { toast(getString(R.string.sync_history_empty)); return@setOnClickListener }
                val chooser = AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.sync_history))
                    .setItems(hosts.map { "${it.name}\n${it.address}".trim() }.toTypedArray()) { _, index -> address.setText(hosts[index].address) }
                    .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
                chooser.listView.setOnItemLongClickListener { _, _, index, _ ->
                    AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.sync_history_remove)).setMessage(hosts[index].address)
                        .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(android.R.string.ok)) { _, _ ->
                            scope.launch {
                                try { withContext(Dispatchers.IO) { store.remove(hosts[index].address) }; chooser.dismiss() }
                                catch (e: CancellationException) { throw e }
                                catch (e: Exception) { toast(e.localizedMessage.orEmpty()) }
                            }
                        }.show()
                    true
                }
            }
        })
        syncSettingsDialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_727036c7fc2a)).setView(layout)
            .setMessage(listOf(syncMessage(background.message), getString(R.string.ui_f40e986f62c5))
                .filter { it.isNotBlank() }.joinToString("\n\n"))
            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_a5574109f020)) { _, _ ->
                val host = address.text.toString().trim().trimEnd('/')
                val authCode = code.text.toString()
                if (host.isBlank()) toast(getString(R.string.ui_686944dc637e)) else connectSync(host, authCode)
            }.show()
    }
    private fun connectSync(address: String, authCode: String) {
        try {
            SyncService.connect(this, address, authCode)
            val history = getSharedPreferences("permission-history", MODE_PRIVATE)
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED &&
                !history.getBoolean("sync-notification-requested", false)) {
                history.edit().putBoolean("sync-notification-requested", true).apply()
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_SYNC_NOTIFICATION)
            }
        } catch (e: RuntimeException) { toast(getString(R.string.ui_79110e8d2e06, java.lang.String.valueOf(e.localizedMessage))) }
    }
    private fun renderSyncState(value: BackgroundSyncState) {
        if (showingSyncStatus) syncSettingsDialog?.setMessage(syncMessage(value.message))
        val request = value.conflict
        if (request == null) { syncConflictDialog?.dismiss(); syncConflictDialog = null; syncConflictId = null; return }
        if (syncConflictId == request.id) return
        syncConflictDialog?.dismiss()
        syncConflictId = request.id
        val feature = request.feature
        val featureLabel = feature.localized(this)
        val labels = listOf(getString(R.string.ui_9bc599d27f67, java.lang.String.valueOf(featureLabel), java.lang.String.valueOf(featureLabel)), getString(R.string.ui_d46592bdaed4, java.lang.String.valueOf(featureLabel), java.lang.String.valueOf(featureLabel)),
            getString(R.string.ui_039142dac5c0, java.lang.String.valueOf(featureLabel), java.lang.String.valueOf(featureLabel)), getString(R.string.ui_3e4d21031b6b, java.lang.String.valueOf(featureLabel), java.lang.String.valueOf(featureLabel))) +
            (if (feature == SyncFeature.LIST) listOf(getString(R.string.ui_318ed0b4705c), getString(R.string.ui_155471e97da7)) else emptyList()) + getString(R.string.ui_5034ddc8102c)
        syncConflictDialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_5265436b89fb, java.lang.String.valueOf(featureLabel), java.lang.String.valueOf(if (request.serverName.isBlank()) "" else " · ${request.serverName}")))
            .setItems(labels.toTypedArray()) { _, which -> syncService?.choose(request.id, feature.modes[which]) }
            .setOnCancelListener { syncService?.choose(request.id, "cancel") }.show()
    }
    private fun refreshSynchronizedPlaylist() {
        scope.launch {
            val current = activePlaylist ?: return@launch
            if (onlineMode) return@launch
            val updated = playlists.list().firstOrNull { it.id == current.id }
            if (updated == null) {
                activePlaylist = null; allSongs = emptyList(); visibleSongs = emptyList(); list.adapter = null
                heading.text = getString(R.string.ui_3cda5816cb6e); status.text = getString(R.string.ui_e48ff968de78)
            } else {
                activePlaylist = updated; heading.text = "›   ${updated.name}"
                allSongs = playlists.songs(updated.id); filterSongs()
            }
        }
    }
    private fun showPlaybackQuality() {
        val values = arrayOf("128k", "320k", "flac", "flac24bit")
        val preferences = getSharedPreferences("player", MODE_PRIVATE)
        val selected = values.indexOf(preferences.getString("quality", "128k")).coerceAtLeast(0)
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_599818eb56df))
            .setSingleChoiceItems(values, selected) { dialog, which ->
                preferences.edit().putString("quality", values[which]).apply()
                dialog.dismiss()
            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
    }
    private fun showPlaybackSettings() {
        if (playbackSettingsDialog?.isShowing == true) return
        val player = service ?: run { toast(getString(R.string.ui_c9bccc27768b)); return }
        val landscape = resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        playbackSettingsDialog = PlayerSettingsDialog(this, playerSettings, lyricOffsets, landscape, player.state.value.song,
            player::setPlaybackRate, player::setVolume, {
                lyricAppearance = playerSettings.appearance(landscape)
                detailRenderedLines = null
                updateLyric(player.state.value.position)
                renderDetails(player.state.value)
                player.refreshLyricPreferences()
            }, { song ->
                if (lyricKey == "${song.source}:${song.id}") {
                    lyricDelayMs = lyricOffsets.get(song); player.refreshLyricPreferences()
                    updateLyric(player.state.value.position); renderDetails(player.state.value)
                }
            }).show().also { dialog -> dialog.setOnDismissListener { playbackSettingsDialog = null } }
    }
    private fun showSources() {
        val player = service ?: return
        scope.launch {
            try {
                val catalog = player.sourceCatalog()
                val labels = listOf(getString(R.string.ui_3158c8d56b7b), getString(R.string.ui_350260df62b8), getString(R.string.ui_98e96c39ccf6)) + catalog.entries.map {
                    "${if (it.id == catalog.selected) "✓ " else ""}${it.name} ${it.version}"
                }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_6e763b71e69c)).setItems(labels.toTypedArray()) { _, index ->
                    if (index == 0) {
                        @Suppress("DEPRECATION")
                        startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*" }, REQUEST_SOURCE)
                    } else if (index == 1) {
                        val input = EditText(this@MainActivity).apply { hint = getString(R.string.ui_8052c1f1c0ab); inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI; setSingleLine(true) }
                        AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_350260df62b8)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
                            .setPositiveButton(getString(R.string.ui_576d81bb0631)) { _, _ -> scope.launch {
                                try {
                                    val url = Uri.parse(input.text.toString().trim())
                                    require(url.scheme in setOf("https", "http") && !url.host.isNullOrBlank()) { getString(R.string.ui_6a7c1a0a3a3e) }
                                    val script = NativeHttp.text(url.toString(), maxBytes = 2 * 1024 * 1024)
                                    player.importSource(script); toast(getString(R.string.ui_18710cc58894))
                                } catch (e: CancellationException) { throw e }
                                catch (e: Exception) { toast(getString(R.string.ui_03f6f90cdb7a, java.lang.String.valueOf(e.localizedMessage))) }
                            } }.show()
                    } else if (index == 2) scope.launch {
                        try { player.selectSource(null); toast(getString(R.string.ui_7f1c18aeb640)) }
                        catch (e: CancellationException) { throw e }
                        catch (e: Exception) { toast(getString(R.string.ui_903f7809008b, java.lang.String.valueOf(e.localizedMessage))) }
                    } else showSourceActions(catalog.entries[index - 3])
                }.setNegativeButton(getString(R.string.ui_3fd47edce45b), null).show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_b0f9363c052f, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun showPlaybackQueue() {
        val player = service ?: return
        val snapshot = player.queueState.value
        if (snapshot == null || snapshot.songs.isEmpty()) { toast(getString(R.string.ui_09679f956e0e)); return }
        val list = ListView(this)
        list.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, snapshot.songs.mapIndexed { index, song ->
            "${if (index == snapshot.index) "▶ " else ""}${index + 1}. ${song.title} · ${song.artist}"
        })
        val dialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_827be73ec6db, java.lang.String.valueOf(snapshot.songs.size))).setView(list)
            .setNegativeButton(getString(R.string.ui_3fd47edce45b), null).setNeutralButton(getString(R.string.ui_d18e02739127)) { _, _ -> player.clearQueue() }.create()
        fun current(): Boolean {
            if (player.queueState.value?.songs == snapshot.songs) return true
            dialog.dismiss(); showPlaybackQueue(); return false
        }
        list.setOnItemClickListener { _, _, position, _ -> if (current()) { player.playQueued(position); dialog.dismiss() } }
        list.setOnItemLongClickListener { _, _, position, _ ->
            val song = snapshot.songs[position]
            AlertDialog.Builder(this).setTitle(song.title).setItems(arrayOf(getString(R.string.ui_c3396195e91c), getString(R.string.ui_f853a70b1204), getString(R.string.ui_e75e8b4e5c97), getString(R.string.ui_6135d4159e89))) { _, which ->
                if (!current()) return@setItems
                when (which) {
                    0 -> player.playQueued(position)
                    1 -> player.moveQueued(position, (position - 1).coerceAtLeast(0))
                    2 -> player.moveQueued(position, (position + 1).coerceAtMost(snapshot.songs.lastIndex))
                    3 -> player.removeQueued(position)
                }
                dialog.dismiss(); if (which != 0) showPlaybackQueue()
            }.show(); true
        }
        dialog.show(); list.setSelection(snapshot.index)
    }
    private fun showSourceActions(entry: UserSourceEntry) {
        val actions = arrayOf(getString(R.string.ui_f4f0ead1116b), getString(R.string.ui_0e6252224f58), getString(R.string.ui_0fd5cd79a1b5), getString(R.string.ui_ba9a8defba4e, java.lang.String.valueOf(if (entry.allowUpdateAlert) getString(R.string.ui_3fd47edce45b) else getString(R.string.ui_8da97ddda990))), getString(R.string.ui_2f9daa828907))
        AlertDialog.Builder(this).setTitle(entry.name).setItems(actions) { _, index ->
            when (index) {
                0 -> scope.launch {
                    try { service?.selectSource(entry.id); toast(getString(R.string.ui_032d025aff70)) }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { toast(getString(R.string.ui_ced3fddd61e0, java.lang.String.valueOf(e.localizedMessage))) }
                }
                1 -> {
                    val builder = AlertDialog.Builder(this).setTitle(entry.name)
                        .setMessage(listOf(entry.description, getString(R.string.ui_88f46c701fba, java.lang.String.valueOf(entry.version)), getString(R.string.ui_962844a38d3e, java.lang.String.valueOf(entry.author))).joinToString("\n"))
                        .setNegativeButton(getString(R.string.ui_3fd47edce45b), null)
                    if (entry.homepage.startsWith("https://") || entry.homepage.startsWith("http://")) builder.setPositiveButton(getString(R.string.ui_3e0d676d2d85)) { _, _ ->
                        runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(entry.homepage))) }
                    }
                    builder.show()
                }
                2 -> {
                    pendingSourceExportId = entry.id
                    @Suppress("DEPRECATION")
                    startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE); type = "application/javascript"
                        putExtra(Intent.EXTRA_TITLE, entry.name.replace(Regex("[\\\\/:*?\"<>|]"), "_").take(80) + ".js")
                    }, REQUEST_SOURCE_EXPORT)
                }
                3 -> scope.launch {
                    try { service?.allowSourceUpdates(entry.id, !entry.allowUpdateAlert); toast(getString(R.string.ui_5c73d0fff5e2)) }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { toast(getString(R.string.ui_749d84b5fa76, java.lang.String.valueOf(e.localizedMessage))) }
                }
                4 -> AlertDialog.Builder(this).setMessage(getString(R.string.ui_852174674832, java.lang.String.valueOf(entry.name))).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
                    .setPositiveButton(getString(R.string.ui_2f9daa828907)) { _, _ -> scope.launch {
                        try { service?.removeSource(entry.id); toast(getString(R.string.ui_a1bfd178ab34)) }
                        catch (e: CancellationException) { throw e }
                        catch (e: Exception) { toast(getString(R.string.ui_57deb333c04b, java.lang.String.valueOf(e.localizedMessage))) }
                    } }.show()
            }
        }.show()
    }
    private fun updateListAction() {
        val menu = boardMode || onlinePlaylistMode
        listActionButton.text = (if (menu) 59667 else 59660).toChar().toString()
        listActionButton.contentDescription = if (menu) getString(R.string.ui_7b1b6d54c192) else getString(R.string.ui_073a0d57165c)
    }
    private fun showOnlineListActions() {
        val choose = if (boardMode) getString(R.string.ui_5dd238551428) else getString(R.string.ui_0650128981bd)
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_68f0bc744846)).setItems(arrayOf(choose, getString(R.string.ui_7f7653be272b))) { _, which ->
            if (which == 0) { if (boardMode) showBoards() else showOnlinePlaylists() }
            else if (allSongs.isNotEmpty()) saveCurrentOnlineList() else toast(getString(R.string.ui_24f59c4dbea0))
        }.show()
    }
    private fun showOnlinePlaylists() {
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_48a4cd426376)).setItems(arrayOf(getString(R.string.ui_2a6eaaa1f30c), getString(R.string.ui_a62864e8c353), getString(R.string.ui_017e2d45158b), getString(R.string.ui_3ef42060a2e5), getString(R.string.ui_6f5fe8042a63), getString(R.string.ui_d6319126b753), getString(R.string.ui_b0e14cdb6fad), getString(R.string.ui_367e0be118ac), getString(R.string.ui_3cfe8d81c220), getString(R.string.ui_13873c4c8594), getString(R.string.ui_02afd374b929))) { _, which ->
            when (which) {
                5 -> showPlaylistSearch()
                6 -> showNeteaseCategories()
                7 -> showKugouCategories()
                8 -> showKuwoCategories()
                9 -> showOtherCategories("tx")
                10 -> showOtherCategories("mg")
                else -> fetchOnlinePlaylists(arrayOf("kw", "wy", "mg", "tx", "kg")[which])
            }
        }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
    }
    private fun showOtherCategories(source: String) {
        loadJob?.cancel(); status.text = getString(R.string.ui_abb4e1c88b47)
        loadJob = scope.launch {
            try {
                val api = OnlinePlaylists()
                val groups = if (source == "tx") api.qqCategories() else api.miguCategories()
                if (groups.isEmpty()) { status.text = getString(R.string.ui_b42ea22b8aec); return@launch }
                AlertDialog.Builder(this@MainActivity).setTitle(if (source == "tx") getString(R.string.ui_13873c4c8594) else getString(R.string.ui_02afd374b929))
                    .setItems(groups.map { it.name }.toTypedArray()) { _, group ->
                        val tags = groups[group].tags
                        AlertDialog.Builder(this@MainActivity).setTitle(groups[group].name)
                            .setItems(tags.map { it.name }.toTypedArray()) { _, index ->
                                fetchOnlinePlaylists(source, category = tags[index].id, categoryLabel = tags[index].name)
                            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_7e6b573e77bd, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun showKuwoCategories() {
        loadJob?.cancel(); status.text = getString(R.string.ui_abb4e1c88b47)
        loadJob = scope.launch {
            try {
                val categories = OnlinePlaylists().kuwoCategories()
                if (categories.isEmpty()) { status.text = getString(R.string.ui_b42ea22b8aec); return@launch }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_3cfe8d81c220))
                    .setItems(categories.map { it.name }.toTypedArray()) { _, group ->
                        val tags = categories[group].tags
                        AlertDialog.Builder(this@MainActivity).setTitle(categories[group].name)
                            .setItems(tags.map { it.name }.toTypedArray()) { _, index ->
                                fetchOnlinePlaylists("kw", category = tags[index].id, categoryLabel = tags[index].name)
                            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_7e6b573e77bd, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun showKugouCategories() {
        loadJob?.cancel(); status.text = getString(R.string.ui_abb4e1c88b47)
        loadJob = scope.launch {
            try {
                val categories = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { KugouPlaylists().categories() }
                if (categories.isEmpty()) { status.text = getString(R.string.ui_b42ea22b8aec); return@launch }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_367e0be118ac))
                    .setItems(categories.map { it.name }.toTypedArray()) { _, group ->
                        val tags = categories[group].tags
                        AlertDialog.Builder(this@MainActivity).setTitle(categories[group].name)
                            .setItems(tags.map { it.name }.toTypedArray()) { _, index ->
                                fetchOnlinePlaylists("kg", category = tags[index].id, categoryLabel = tags[index].name)
                            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_7e6b573e77bd, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun showNeteaseCategories() {
        loadJob?.cancel(); status.text = getString(R.string.ui_abb4e1c88b47)
        loadJob = scope.launch {
            try {
                val categories = NeteaseApi().categories()
                if (categories.isEmpty()) { status.text = getString(R.string.ui_b42ea22b8aec); return@launch }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_b0e14cdb6fad))
                    .setItems(categories.map { it.name }.toTypedArray()) { _, group ->
                        val tags = categories[group].tags
                        AlertDialog.Builder(this@MainActivity).setTitle(categories[group].name)
                            .setItems(tags.toTypedArray()) { _, index -> fetchOnlinePlaylists("wy", category = tags[index]) }
                            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_7e6b573e77bd, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun showPlaylistSearch() {
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_d8f2ca6f12b4))
            .setItems(arrayOf(getString(R.string.ui_6f5fe8042a63), getString(R.string.ui_2a6eaaa1f30c), getString(R.string.ui_3ef42060a2e5), getString(R.string.ui_a62864e8c353), getString(R.string.ui_017e2d45158b))) { _, which ->
                val source = arrayOf("kg", "kw", "tx", "wy", "mg")[which]
                val input = EditText(this).apply { setSingleLine(true); hint = getString(R.string.ui_7c5a4bea69d3) }
                AlertDialog.Builder(this).setTitle(getString(R.string.ui_d6319126b753)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
                    .setPositiveButton(getString(R.string.ui_44ce7ae909bb)) { _, _ ->
                        val query = input.text.toString().trim()
                        if (query.isEmpty()) toast(getString(R.string.ui_ed43b8a78d98)) else searchPlaylists(source, query)
                    }.show()
            }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
    }
    private fun searchPlaylists(source: String, query: String, page: Int = 1) {
        loadJob?.cancel()
        status.text = getString(R.string.ui_3d3ec32220b1)
        loadJob = scope.launch {
            try {
                val items = PlaylistSearch().search(source, query, page)
                if (items.isEmpty()) {
                    status.text = getString(R.string.ui_fd45345182bb, java.lang.String.valueOf(if (page > 1) getString(R.string.ui_38844b135cf7) else ""))
                    if (page > 1) searchPlaylists(source, query, page - 1)
                    return@launch
                }
                val labels = items.map { if (it.author.isBlank()) it.name else "${it.name} · ${it.author}" } + getString(R.string.ui_ea36ef28dfcd)
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_ca3e84f738ad, java.lang.String.valueOf(query), java.lang.String.valueOf(page)))
                    .setItems(labels.toTypedArray()) { _, which ->
                        if (which == items.size) searchPlaylists(source, query, page + 1) else loadOnlinePlaylist(items[which])
                    }.setNegativeButton(if (page > 1) getString(R.string.ui_c9b9ae7a6144) else getString(R.string.ui_2cd0f3be8738)) { _, _ ->
                        if (page > 1) searchPlaylists(source, query, page - 1)
                    }.show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_be54d7d43555, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun fetchOnlinePlaylists(source: String, page: Int = 1, category: String = "全部", categoryLabel: String = category) {
        loadJob?.cancel()
        status.text = getString(R.string.ui_d88b9c569e32)
        loadJob = scope.launch {
            try {
                val items = OnlinePlaylists().recommended(page = page, source = source, category = category)
                if (items.isEmpty()) {
                    status.text = getString(R.string.ui_8c440faad4bb)
                    if (page > 1) fetchOnlinePlaylists(source, page - 1, category, categoryLabel)
                    return@launch
                }
                val labels = items.map { if (it.author.isBlank()) it.name else "${it.name} · ${it.author}" } + getString(R.string.ui_ea36ef28dfcd)
                val title = when (source) { "kw" -> getString(R.string.ui_7a8b9a2e85c6); "wy" -> getString(R.string.ui_c67c5ff0011d); "mg" -> getString(R.string.ui_c63d7e27139b); "kg" -> getString(R.string.ui_df93dcc2ee4a); else -> getString(R.string.ui_13d9fbc47bef) }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_d1d187349a65, java.lang.String.valueOf(title), java.lang.String.valueOf(if (category == "全部") "" else " · $categoryLabel"), java.lang.String.valueOf(page)))
                    .setItems(labels.toTypedArray()) { _, which ->
                        if (which == items.size) fetchOnlinePlaylists(source, page + 1, category, categoryLabel) else loadOnlinePlaylist(items[which])
                    }.setNegativeButton(if (page > 1) getString(R.string.ui_c9b9ae7a6144) else getString(R.string.ui_2cd0f3be8738)) { _, _ ->
                        if (page > 1) fetchOnlinePlaylists(source, page - 1, category, categoryLabel)
                    }.show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_31206f5478ba, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun saveCurrentOnlineList() {
        val sourceName = if (boardMode) selectedBoard?.name else selectedOnlinePlaylist?.name
        val input = EditText(this).apply { setSingleLine(true); setText(sourceName ?: getString(R.string.ui_006d2287b3ea)) }
        val songs = allSongs.toList()
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_7f7653be272b)).setView(input)
            .setMessage(getString(R.string.ui_ce626c5abcb8, java.lang.String.valueOf(songs.size)))
            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_a3030bf8f16d)) { _, _ ->
                val name = input.text.toString().trim()
                if (name.isEmpty()) { toast(getString(R.string.ui_ff45f8f5d491)); return@setPositiveButton }
                scope.launch {
                    try {
                        val original = selectedOnlinePlaylist.takeIf { onlinePlaylistMode }
                        if (original != null) playlists.importOnline(original.copy(name = name), songs)
                        else playlists.importLists(listOf(ImportedList(name, songs)))
                        toast(getString(R.string.ui_1d8c2c9c0aba, java.lang.String.valueOf(songs.size)))
                    }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { toast(getString(R.string.ui_749d84b5fa76, java.lang.String.valueOf(e.localizedMessage))) }
                }
            }.show()
    }
    private fun loadOnlinePlaylist(playlist: OnlinePlaylist, append: Boolean = false) {
        val more = append && onlinePlaylistMode && selectedOnlinePlaylist == playlist && onlinePlaylistPage > 0
        val page = if (more) onlinePlaylistPage + 1 else 1
        onlineMode = true; boardMode = false; onlinePlaylistMode = true; updateListAction(); pageTitle.text = getString(R.string.ui_473e57b72072); activePlaylist = null
        selectedOnlinePlaylist = playlist; heading.text = "›   ${playlist.name}"; search.visibility = View.GONE
        if (!more) { allSongs = emptyList(); visibleSongs = emptyList(); list.adapter = null; onlinePlaylistPage = 0 }
        loadJob?.cancel(); loadMore.visibility = View.GONE; status.text = getString(R.string.ui_aed6f82d382c)
        loadJob = scope.launch {
            try {
                val items = OnlinePlaylists(applicationContext).songs(playlist, page)
                if (onlinePlaylistMode && selectedOnlinePlaylist == playlist) {
                    allSongs = if (more) (allSongs + items).distinctBy { it.source to it.id } else items
                    onlinePlaylistPage = page; filterSongs(); loadMore.visibility = if (items.size >= if (playlist.source == "mg") 30 else 100) View.VISIBLE else View.GONE
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (onlinePlaylistMode) { status.text = getString(R.string.ui_31206f5478ba, java.lang.String.valueOf(e.localizedMessage)); if (more) loadMore.visibility = View.VISIBLE } }
        }
    }
    private fun showBoards() {
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_122bd549791d)).setItems(arrayOf(getString(R.string.ui_6f5fe8042a63), getString(R.string.ui_3ef42060a2e5), getString(R.string.ui_a62864e8c353), getString(R.string.ui_2a6eaaa1f30c), getString(R.string.ui_017e2d45158b))) { _, platform ->
            val provider = OnlineBoards()
            val boards = when (platform) { 0 -> provider.boards; 1 -> provider.qqBoards; 2 -> provider.wyBoards; 3 -> KuwoBoards().boards; else -> provider.miguBoards }
            AlertDialog.Builder(this).setTitle(when (platform) { 0 -> getString(R.string.ui_018c1fe1fe88); 1 -> getString(R.string.ui_f96c99ccd4dc); 2 -> getString(R.string.ui_4f971250a44d); 3 -> getString(R.string.ui_4a4e5155b457); else -> getString(R.string.ui_f9e46d37aa9f) })
                .setItems(boards.map { it.name }.toTypedArray()) { _, which -> loadBoard(boards[which]) }
                .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
        }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
    }
    private fun loadBoard(board: Board, append: Boolean = false) {
        val more = append && boardMode && selectedBoard == board && boardPage > 0
        val page = if (more) boardPage + 1 else 1
        onlineMode = true; boardMode = true; onlinePlaylistMode = false; updateListAction(); pageTitle.text = getString(R.string.ui_1ee95aa94712); activePlaylist = null
        selectedBoard = board; heading.text = "›   ${board.name}"; search.visibility = View.GONE
        if (!more) { allSongs = emptyList(); visibleSongs = emptyList(); list.adapter = null; boardPage = 0 }
        loadJob?.cancel(); loadMore.visibility = View.GONE; status.text = getString(R.string.ui_4760ac1e18cc)
        loadJob = scope.launch {
            try {
                val items = OnlineBoards().songs(board, page)
                if (boardMode && selectedBoard == board) {
                    allSongs = if (more) (allSongs + items).distinctBy { it.source to it.id } else items
                    boardPage = page; filterSongs(); loadMore.visibility = if (board.source !in setOf("tx", "mg") && items.size >= 100) View.VISIBLE else View.GONE
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (boardMode) { status.text = getString(R.string.ui_22a7c1cdbc29, java.lang.String.valueOf(e.localizedMessage)); if (more) loadMore.visibility = View.VISIBLE } }
        }
    }
    private fun sourceLabel(): String = when (searchSource) { "kw" -> getString(R.string.ui_2a6eaaa1f30c); "tx" -> getString(R.string.ui_3ef42060a2e5); "wy" -> getString(R.string.ui_a62864e8c353); "mg" -> getString(R.string.ui_017e2d45158b); else -> getString(R.string.ui_6f5fe8042a63) }
    private fun showSearchSources() {
        val ids = arrayOf("kg", "kw", "tx", "wy", "mg")
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_9b980a0136e4)).setItems(arrayOf(getString(R.string.ui_6f5fe8042a63), getString(R.string.ui_2a6eaaa1f30c), getString(R.string.ui_3ef42060a2e5), getString(R.string.ui_a62864e8c353), getString(R.string.ui_017e2d45158b))) { _, index ->
            searchSource = ids[index]; heading.text = getString(R.string.ui_e07216a6d505, java.lang.String.valueOf(sourceLabel())); loadMore.visibility = View.GONE
            loadJob?.cancel(); allSongs = emptyList(); list.adapter = null
            if (search.text.isNotBlank()) searchOnline() else status.text = getString(R.string.ui_bd997b86cde1)
        }.show()
    }
    private fun showPlayerDetails() {
        val state = service?.state?.value ?: return
        if (playerDialog?.isShowing == true) return
        val primary = palette.primary
        val dialog = Dialog(this)
        playerDialog = dialog
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setBackgroundColor(palette.surface); fitsSystemWindows = true
        }
        val header = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        header.addView(TextView(this).apply {
            text = "‹"; textSize = 32f; gravity = Gravity.CENTER; setTextColor(palette.foreground); contentDescription = getString(R.string.ui_572cf45ba436)
            setOnClickListener { dialog.dismiss() }
        }, LinearLayout.LayoutParams(dp(48), dp(48)))
        detailTitle = TextView(this).apply { textSize = 17f; setTextColor(palette.foreground); maxLines = 1; gravity = Gravity.CENTER_VERTICAL }
        header.addView(detailTitle, LinearLayout.LayoutParams(0, dp(48), 1f))
        detailPageToggle = TextView(this).apply {
            text = getString(R.string.ui_9dbfa9b42bb3); textSize = 14f; gravity = Gravity.CENTER; setTextColor(primary)
            setOnClickListener { toggleDetailPage() }
        }
        header.addView(detailPageToggle, LinearLayout.LayoutParams(dp(56), dp(48)))
        header.addView(TextView(this).apply {
            text = getString(R.string.ui_df3d58c7d84b); textSize = 14f; gravity = Gravity.CENTER; setTextColor(primary); contentDescription = getString(R.string.ui_8c38525734c0)
            setOnClickListener { showPlaybackSettings() }
        }, LinearLayout.LayoutParams(dp(56), dp(48)))
        content.addView(header)
        val scroll = ScrollView(this).apply { isVerticalScrollBarEnabled = false; isFillViewport = true }
        val lyricContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(80), dp(24), dp(80))
        }
        detailLyrics = lyricContainer; detailScroll = scroll
        scroll.addView(lyricContainer, FrameLayout.LayoutParams(-1, -2))
        val page = FrameLayout(this)
        detailCover = FrameLayout(this).apply { setOnClickListener { toggleDetailPage() } }
        val coverSize = (resources.displayMetrics.widthPixels * 0.78f).toInt().coerceAtMost(dp(340))
        val album = FrameLayout(this).apply {
            background = GradientDrawable().apply { setColor(palette.placeholder); cornerRadius = dp(3).toFloat() }
        }
        album.addView(TextView(this).apply { text = "LX"; textSize = 58f; gravity = Gravity.CENTER; setTextColor(primary) }, FrameLayout.LayoutParams(-1, -1))
        detailCoverImage = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; visibility = View.GONE }
        album.addView(detailCoverImage, FrameLayout.LayoutParams(-1, -1))
        detailCover?.addView(album, FrameLayout.LayoutParams(coverSize, coverSize, Gravity.CENTER))
        page.addView(detailCover, FrameLayout.LayoutParams(-1, -1)); page.addView(scroll, FrameLayout.LayoutParams(-1, -1))
        detailShowingLyrics = false; scroll.visibility = View.GONE
        content.addView(page, LinearLayout.LayoutParams(-1, 0, 1f))
        detailTime = TextView(this).apply { textSize = 12f; gravity = Gravity.CENTER; setTextColor(palette.muted) }
        content.addView(detailTime)
        detailSeek = SeekBar(this).apply {
            progressTintList = ColorStateList.valueOf(primary); thumbTintList = ColorStateList.valueOf(primary)
            contentDescription = getString(R.string.ui_fc16e2a0fca6)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar?, progress: Int, fromUser: Boolean) = Unit
                override fun onStartTrackingTouch(bar: SeekBar?) { detailSeeking = true }
                override fun onStopTrackingTouch(bar: SeekBar?) { detailSeeking = false; service?.seekTo(bar?.progress ?: 0) }
            })
        }
        content.addView(detailSeek, LinearLayout.LayoutParams(-1, dp(40)).apply { setMargins(dp(20), 0, dp(20), 0) })
        val controls = LinearLayout(this).apply { gravity = Gravity.CENTER; orientation = LinearLayout.HORIZONTAL }
        fun button(code: Int, label: String, click: () -> Unit) = TextView(this).apply {
            text = code.toChar().toString(); typeface = iconFont; textSize = 28f; gravity = Gravity.CENTER
            setTextColor(primary); contentDescription = label; setOnClickListener { click() }
        }
        controls.addView(button(59668, getString(R.string.ui_8c747908bf69)) { service?.previous() }, LinearLayout.LayoutParams(dp(72), dp(64)))
        detailToggle = button(59653, getString(R.string.ui_c3396195e91c)) { togglePlayback() }
        controls.addView(detailToggle, LinearLayout.LayoutParams(dp(72), dp(64)))
        controls.addView(button(59654, getString(R.string.ui_486e42475adb)) { service?.next() }, LinearLayout.LayoutParams(dp(72), dp(64)))
        content.addView(controls)
        val options = LinearLayout(this).apply { gravity = Gravity.CENTER; orientation = LinearLayout.HORIZONTAL }
        detailMode = TextView(this).apply {
            textSize = 14f; gravity = Gravity.CENTER; setTextColor(palette.muted)
            setOnClickListener { service?.cycleMode() }
        }
        options.addView(detailMode, LinearLayout.LayoutParams(dp(120), dp(48)))
        options.addView(TextView(this).apply {
            text = getString(R.string.ui_7afda7dc6745); textSize = 14f; gravity = Gravity.CENTER; setTextColor(palette.muted)
            setOnClickListener { showSleepTimer() }
        }, LinearLayout.LayoutParams(dp(120), dp(48)))
        options.addView(TextView(this).apply {
            text = getString(R.string.ui_f01b6815d826); textSize = 14f; gravity = Gravity.CENTER; setTextColor(palette.muted)
            setOnClickListener { showPlaybackQueue() }
        }, LinearLayout.LayoutParams(dp(100), dp(48)))
        content.addView(options)
        palette.background(content); palette.textStyle(content)
        dialog.setContentView(content)
        dialog.window?.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(palette.surface))
        dialog.setOnDismissListener {
            playerDialog = null; detailTitle = null; detailTime = null; detailSeek = null; detailToggle = null; detailMode = null
            detailLyrics = null; detailScroll = null; detailCover = null; detailCoverImage = null; detailPageToggle = null
            detailRenderedLines = null; detailActiveLine = -1; detailSeeking = false
        }
        dialog.show()
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        dialog.window?.let { ScreenInsets.install(it, content) }
        updateArtwork()
        renderDetails(state)
    }
    private fun toggleDetailPage() {
        detailShowingLyrics = !detailShowingLyrics
        detailCover?.visibility = if (detailShowingLyrics) View.GONE else View.VISIBLE
        detailScroll?.visibility = if (detailShowingLyrics) View.VISIBLE else View.GONE
        detailPageToggle?.text = if (detailShowingLyrics) getString(R.string.ui_ccbb5ee62b1a) else getString(R.string.ui_9dbfa9b42bb3)
        detailActiveLine = -1
        service?.state?.value?.let { renderDetails(it) }
    }
    private fun updateArtwork() {
        miniCoverImage.setImageBitmap(artworkBitmap)
        miniCoverImage.visibility = if (artworkBitmap == null) View.GONE else View.VISIBLE
        detailCoverImage?.setImageBitmap(artworkBitmap)
        detailCoverImage?.visibility = if (artworkBitmap == null) View.GONE else View.VISIBLE
    }
    private fun showSleepTimer() {
        val minutes = intArrayOf(0, 15, 30, 60, 90, 120)
        val finish = CheckBox(this).apply { text = getString(R.string.ui_13f910fe7cce) }
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_7afda7dc6745))
            .setView(finish)
            .setItems(arrayOf(getString(R.string.ui_0446dbd36ecc), getString(R.string.ui_015feae6f8e4), getString(R.string.ui_a01a28d147ac), getString(R.string.ui_bf6201684e5b), getString(R.string.ui_928ff220b57b), getString(R.string.ui_0b41f8fb1d48), getString(R.string.ui_c6414cdd4464))) { _, which ->
                if (which == 6) { service?.setSleepTimer(0, true); toast(getString(R.string.ui_c6414cdd4464)) }
                else {
                    service?.setSleepTimer(minutes[which], which > 0 && finish.isChecked)
                    toast(if (which == 0) getString(R.string.ui_db424926e343) else getString(R.string.ui_dd38be1cc98a, java.lang.String.valueOf(minutes[which])))
                }
            }.show()
    }
    private fun renderDetails(state: PlayerState) {
        if (playerDialog?.isShowing != true) return
        detailTitle?.text = state.song?.let { "${it.title}  ·  ${it.artist}" } ?: getString(R.string.ui_f518674b61f6)
        detailTime?.text = "${formatTime(state.position)} / ${formatTime(state.duration)}"
        detailSeek?.apply { max = state.duration.coerceAtLeast(0); if (!detailSeeking) progress = state.position }
        detailToggle?.apply {
            text = (if (state.playing) 59661 else 59653).toChar().toString()
            contentDescription = if (state.playing) getString(R.string.ui_8d12fc0d4eb2) else getString(R.string.ui_c3396195e91c)
            isEnabled = state.song != null && !state.preparing
        }
        detailMode?.text = state.mode.localized(this)
        val container = detailLyrics ?: return
        if (detailRenderedLines !== lyricLines) {
            detailRenderedLines = lyricLines; detailActiveLine = -1; container.removeAllViews()
            if (lyricLines.isEmpty()) {
                container.addView(TextView(this).apply { text = getString(R.string.ui_0245e1b77ac5); textSize = 16f; gravity = Gravity.CENTER; setTextColor(palette.faint) })
            } else lyricLines.forEach { line ->
                container.addView(TextView(this).apply {
                    text = LyricRendering.text(line, playerSettings).ifBlank { "♪" }; textSize = lyricAppearance.fontSizeSp.toFloat()
                    gravity = when (lyricAppearance.alignment) { LyricAlignment.LEFT -> Gravity.LEFT; LyricAlignment.CENTER -> Gravity.CENTER_HORIZONTAL; LyricAlignment.RIGHT -> Gravity.RIGHT }
                    setTextColor(palette.muted)
                    setPadding(0, dp(13), 0, dp(13)); setOnClickListener {
                        service?.let { it.seekTo(LyricTiming.seekPosition(line.timeMs, lyricDelayMs, it.state.value.duration)) }
                    }
                }, LinearLayout.LayoutParams(-1, -2))
            }
        }
        val active = LrcParser.indexAt(lyricLines, LyricTiming.lyricPosition(state.position.toLong(), lyricDelayMs))
        if (active != detailActiveLine) {
            (container.getChildAt(detailActiveLine) as? TextView)?.let { view ->
                view.setTextColor(palette.muted)
                lyricLines.getOrNull(detailActiveLine)?.let { view.text = LyricRendering.text(it, playerSettings) }
            }
            (container.getChildAt(active) as? TextView)?.apply {
                setTextColor(palette.primary)
                detailScroll?.post { detailScroll?.smoothScrollTo(0, (top - (detailScroll?.height ?: 0) / 2).coerceAtLeast(0)) }
            }
            detailActiveLine = active
        }
        lyricLines.getOrNull(active)?.let { line ->
            (container.getChildAt(active) as? TextView)?.text = LyricRendering.styled(line, playerSettings, true,
                LyricTiming.lyricPosition(state.position.toLong(), lyricDelayMs), palette.muted, palette.primary)
        }
    }
    private fun hasAudioPermission(): Boolean = checkSelfPermission(audioPermission()) == PackageManager.PERMISSION_GRANTED
    private fun audioPermission(): String = PermissionPolicy.audio(Build.VERSION.SDK_INT)
    private fun showLocalPermissionPrompt() {
        loadJob?.cancel(); allSongs = emptyList(); visibleSongs = emptyList(); list.adapter = null
        status.text = getString(R.string.ui_799c8f89223c)
        status.setTextColor(palette.primary)
        status.contentDescription = getString(R.string.ui_ccdab23ef0b3)
    }
    private fun requestAudioAccess(action: AudioAction) {
        if (hasAudioPermission()) { performAudioAction(action); return }
        pendingAudioAction = action
        val permission = audioPermission()
        val preferences = getSharedPreferences("permission-history", MODE_PRIVATE)
        if (preferences.getBoolean("audio-requested", false) && !shouldShowRequestPermissionRationale(permission)) {
            AlertDialog.Builder(this).setTitle(getString(R.string.ui_172fc36a4a5c))
                .setMessage(getString(R.string.ui_9d0bbc51b8d2))
                .setNegativeButton(getString(R.string.ui_2cd0f3be8738)) { _, _ -> pendingAudioAction = null }
                .setOnCancelListener { pendingAudioAction = null }
                .setPositiveButton(getString(R.string.ui_37aa6ad6a36d)) { _, _ ->
                    waitingForAudioSettings = true
                    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
                }.show()
            return
        }
        preferences.edit().putBoolean("audio-requested", true).apply()
        requestPermissions(arrayOf(permission), REQUEST_AUDIO)
    }
    private fun onAudioAccessDenied(action: AudioAction) {
        when (action) {
            AudioAction.OpenLibrary -> if (!onlineMode && activePlaylist == null) {
                showLocalPermissionPrompt(); status.text = getString(R.string.ui_75f6a07d7c9d)
            }
            is AudioAction.ImportBackup -> previewBackup(action.uri)
            is AudioAction.ExportBackup -> toast(getString(R.string.ui_7b9143ea8eb8))
            else -> toast(getString(R.string.ui_bb0ff4f9b826))
        }
    }
    private fun performAudioAction(action: AudioAction) {
        when (action) {
            AudioAction.OpenLibrary -> if (!onlineMode && activePlaylist == null) loadSongs()
            AudioAction.Resume -> service?.resume() ?: run { waitingForServicePlayback = action }
            is AudioAction.Play -> {
                if (action.position !in action.songs.indices) return
                service?.play(action.songs, action.position) ?: run { waitingForServicePlayback = action }
            }
            is AudioAction.RecoverPlay -> scope.launch {
                try {
                    val songs = if (action.playlistId == null) LocalMusic(applicationContext).load() else playlists.songs(action.playlistId)
                    val index = songs.indexOfFirst { it.id == action.id && it.source == action.source }
                    if (index < 0) toast(getString(R.string.ui_a65a40087086)) else performAudioAction(AudioAction.Play(songs, index))
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_7aea1779d123, java.lang.String.valueOf(e.localizedMessage))) }
            }
            is AudioAction.ImportBackup -> previewBackup(action.uri)
            is AudioAction.ExportBackup -> exportBackup(action.uri)
        }
    }
    private fun audioActionToBundle(action: AudioAction): Bundle = Bundle().apply {
        when (action) {
            AudioAction.OpenLibrary -> putString("type", "library")
            AudioAction.Resume -> putString("type", "resume")
            is AudioAction.Play -> {
                val song = action.songs.getOrNull(action.position) ?: return@apply
                putString("type", "play"); putLong("id", song.id); putString("source", song.source)
                activePlaylist?.let { putLong("playlist", it.id) }
            }
            is AudioAction.RecoverPlay -> {
                putString("type", "play"); putLong("id", action.id); putString("source", action.source)
                action.playlistId?.let { putLong("playlist", it) }
            }
            is AudioAction.ImportBackup -> { putString("type", "import"); putString("uri", action.uri.toString()) }
            is AudioAction.ExportBackup -> { putString("type", "export"); putString("uri", action.uri.toString()) }
        }
    }
    private fun audioActionFromBundle(bundle: Bundle): AudioAction? = when (bundle.getString("type")) {
        "library" -> AudioAction.OpenLibrary
        "resume" -> AudioAction.Resume
        "play" -> AudioAction.RecoverPlay(bundle.getLong("id"), bundle.getString("source") ?: "local", if (bundle.containsKey("playlist")) bundle.getLong("playlist") else null)
        "import" -> bundle.getString("uri")?.let { AudioAction.ImportBackup(Uri.parse(it)) }
        "export" -> bundle.getString("uri")?.let { AudioAction.ExportBackup(Uri.parse(it)) }
        else -> null
    }
    private fun songToBundle(song: Song): Bundle = Bundle().apply {
        putLong("id", song.id); putString("uri", song.uri.toString()); putString("title", song.title)
        putString("artist", song.artist); putLong("duration", song.duration); putString("source", song.source); putString("sourceInfo", song.sourceInfo)
    }
    private fun songFromBundle(bundle: Bundle): Song = Song(bundle.getLong("id"), Uri.parse(bundle.getString("uri") ?: ""),
        bundle.getString("title") ?: "", bundle.getString("artist") ?: "", bundle.getLong("duration"),
        bundle.getString("source") ?: "local", bundle.getString("sourceInfo"))
    private fun togglePlayback() {
        val player = service ?: return
        if (player.state.value.playing) { player.pause(); return }
        if (PermissionPolicy.requiresLibraryAccess(this, player.state.value.song) && !hasAudioPermission()) requestAudioAccess(AudioAction.Resume)
        else player.resume()
    }
    @Deprecated("Deprecated in Android")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_AUDIO) {
            val action = pendingAudioAction; pendingAudioAction = null
            if (action != null) {
                if (hasAudioPermission()) performAudioAction(action) else onAudioAccessDenied(action)
            }
        } else if (requestCode == REQUEST_DOWNLOAD) {
            val song = pendingDownload; pendingDownload = null
            if (song != null && grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) downloadSong(song)
            else toast(getString(R.string.ui_cbe111f9db69))
        }
    }
    private fun loadSongs() {
        loadJob?.cancel()
        loadJob = scope.launch {
            try {
                allSongs = LocalMusic(applicationContext).load()
                filterSongs()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_7ee7cd3a2806, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun loadPlaylist(playlist: Playlist) {
        onlineMode = false; boardMode = false; onlinePlaylistMode = false; updateListAction(); pageTitle.text = getString(R.string.ui_27c95ec6b766)
        loadMore.visibility = View.GONE
        activePlaylist = playlist
        heading.text = "›   ${playlist.name}"
        search.text.clear()
        loadJob?.cancel()
        loadJob = scope.launch {
            try { allSongs = playlists.songs(playlist.id); filterSongs() }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage)) }
        }
    }
    private fun showPlaylists() {
        scope.launch {
            try {
                val items = playlists.list()
                val names = listOf(getString(R.string.ui_9e638dd9d71b)) + items.map { it.name }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_c2dd14825672))
                    .setItems(names.toTypedArray()) { _, which ->
                        if (which == 0) createPlaylist()
                        else if (!preferences.clickPlaylistPlay) showPlaylistActions(items[which - 1])
                        else {
                            val selected = items[which - 1]; loadPlaylist(selected)
                            scope.launch {
                                try {
                                    val songs = playlists.songs(selected.id)
                                    if (songs.isNotEmpty()) {
                                        val play = AudioAction.Play(songs, 0)
                                        if (songs.any { PermissionPolicy.requiresLibraryAccess(this@MainActivity, it) } && !hasAudioPermission()) requestAudioAccess(play) else performAudioAction(play)
                                    }
                                } catch (e: CancellationException) { throw e }
                                catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
                            }
                        }
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun createPlaylist() {
        val input = EditText(this).apply { hint = getString(R.string.ui_9d3981ee6aa3); setSingleLine(true) }
        AlertDialog.Builder(this).setTitle(getString(R.string.ui_13eeeadb23fb)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
            .setPositiveButton(getString(R.string.ui_cde2cd071d25)) { _, _ ->
                val name = input.text.toString().trim()
                if (name.isEmpty()) { toast(getString(R.string.ui_ff45f8f5d491)); return@setPositiveButton }
                scope.launch {
                    try { val id = playlists.create(name); loadPlaylist(Playlist(id, name)) }
                    catch (e: Exception) { toast(getString(R.string.ui_a5164865c034, java.lang.String.valueOf(e.localizedMessage))) }
                }
            }.show()
    }
    private fun showPlaylistActions(playlist: Playlist) {
        val builtin = playlist.syncId in setOf("default", "love")
        val actions = mutableListOf(getString(R.string.ui_02a61399982d), getString(R.string.ui_b6cd52c6fe92), getString(R.string.ui_4abdef1f2424), getString(R.string.ui_4e0ca928260e))
        if (playlist.source in ExternalLinks.sources && !playlist.sourceListId.isNullOrBlank()) actions.add(getString(R.string.ui_31448436755a))
        if (!builtin) actions.addAll(listOf(getString(R.string.ui_0d0cbac2eee5), getString(R.string.ui_46a150506a48), getString(R.string.ui_77037dd314bf), getString(R.string.ui_0a1d79c26e3b)))
        fun runEdit(edit: suspend () -> Unit) { scope.launch {
            try { edit(); if (activePlaylist?.id == playlist.id) loadPlaylist(playlists.list().firstOrNull { it.id == playlist.id } ?: return@launch) }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_e31d650c716b, java.lang.String.valueOf(e.localizedMessage))) }
        } }
        AlertDialog.Builder(this).setTitle(playlist.name).setItems(actions.toTypedArray()) { _, which ->
            when (actions[which]) {
                getString(R.string.ui_31448436755a) -> refreshOnlinePlaylist(playlist)
                getString(R.string.ui_02a61399982d) -> loadPlaylist(playlist)
                getString(R.string.ui_b6cd52c6fe92) -> runEdit { service?.enqueue(playlists.songs(playlist.id)); toast(getString(R.string.ui_51a4e2f9dea0)) }
                getString(R.string.ui_4abdef1f2424) -> AlertDialog.Builder(this).setTitle(getString(R.string.ui_4abdef1f2424)).setItems(arrayOf(getString(R.string.ui_7ec5153cfab4), getString(R.string.ui_cfb624b8a25b), getString(R.string.ui_04a95e0654d3), getString(R.string.ui_9e9d4588c7f0))) { _, order ->
                    runEdit { playlists.sortSongs(playlist.id, arrayOf("title", "artist", "duration", "reverse")[order]) }
                }.show()
                getString(R.string.ui_0d0cbac2eee5) -> {
                    val input = EditText(this).apply { setSingleLine(true); setText(playlist.name) }
                    AlertDialog.Builder(this).setTitle(getString(R.string.ui_b4262f363f77)).setView(input).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null)
                        .setPositiveButton(getString(R.string.ui_a3030bf8f16d)) { _, _ -> runEdit { playlists.rename(playlist.id, input.text.toString()) } }.show()
                }
                getString(R.string.ui_46a150506a48), getString(R.string.ui_77037dd314bf) -> runEdit {
                    val users = playlists.list().filterNot { it.syncId in setOf("default", "love") }
                    val position = users.indexOfFirst { it.id == playlist.id } + if (actions[which] == getString(R.string.ui_46a150506a48)) -1 else 1
                    playlists.movePlaylist(playlist.id, position)
                }
                getString(R.string.ui_4e0ca928260e), getString(R.string.ui_0a1d79c26e3b) -> {
                    val deleting = actions[which] == getString(R.string.ui_0a1d79c26e3b)
                    AlertDialog.Builder(this).setMessage(getString(R.string.ui_88ff633c9cdd, java.lang.String.valueOf(if (deleting) getString(R.string.ui_2f9daa828907) else getString(R.string.ui_1ef3de06b32e)), java.lang.String.valueOf(playlist.name)))
                        .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_fac2a67ad878)) { _, _ -> runEdit {
                            if (deleting) {
                                playlists.delete(playlist.id)
                                if (activePlaylist?.id == playlist.id) { activePlaylist = null; allSongs = emptyList(); filterSongs(); heading.text = getString(R.string.ui_3cda5816cb6e) }
                            } else playlists.clear(playlist.id)
                        } }.show()
                }
            }
        }.show()
    }
    private fun showBatchSongs() {
        val snapshot = visibleSongs.toList(); val sourceList = activePlaylist
        if (snapshot.isEmpty()) { toast(getString(R.string.ui_24f59c4dbea0)); return }
        val checked = BooleanArray(snapshot.size)
        val dialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_92503cecb0e4))
            .setMultiChoiceItems(snapshot.map { "${it.title} · ${it.artist}" }.toTypedArray(), checked) { _, index, value -> checked[index] = value }
            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setNeutralButton(getString(R.string.ui_3a5040b68abf), null).setPositiveButton(getString(R.string.ui_acfc4e74a650)) { _, _ ->
                val songs = snapshot.filterIndexed { index, _ -> checked[index] }
                if (songs.isEmpty()) { toast(getString(R.string.ui_7c75b6ccc72a)); return@setPositiveButton }
                val actions = mutableListOf(getString(R.string.ui_2cd77e843e22), getString(R.string.ui_f655b3c8a2b6), getString(R.string.ui_cc143006b20d))
                if (sourceList != null) actions.addAll(listOf(getString(R.string.ui_2b96f6a6a976), getString(R.string.ui_c7d9494f6392)))
                AlertDialog.Builder(this).setTitle(getString(R.string.ui_e44c6ed9b6a6, java.lang.String.valueOf(songs.size))).setItems(actions.toTypedArray()) { _, action ->
                    when (actions[action]) {
                        getString(R.string.ui_2cd77e843e22) -> {
                            val play = AudioAction.Play(songs, 0)
                            if (songs.any { PermissionPolicy.requiresLibraryAccess(this@MainActivity, it) } && !hasAudioPermission()) requestAudioAccess(play) else performAudioAction(play)
                        }
                        getString(R.string.ui_f655b3c8a2b6) -> service?.enqueue(songs)
                        getString(R.string.ui_c7d9494f6392) -> AlertDialog.Builder(this).setMessage(getString(R.string.ui_74f577267660, java.lang.String.valueOf(songs.size)))
                            .setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_6135d4159e89)) { _, _ -> scope.launch {
                                try { playlists.batchSongs(songs, sourceList?.id, null, true); toast(getString(R.string.ui_4f0536be4304)) }
                                catch (e: CancellationException) { throw e }
                                catch (e: Exception) { toast(getString(R.string.ui_1dd0b9466445, java.lang.String.valueOf(e.localizedMessage))) }
                            } }.show()
                        else -> scope.launch {
                            try {
                                val targets = playlists.list().filterNot { it.id == sourceList?.id }
                                AlertDialog.Builder(this@MainActivity).setTitle(actions[action]).setItems(targets.map { it.name }.toTypedArray()) { _, index -> scope.launch {
                                    try {
                                        playlists.batchSongs(songs, sourceList?.id, targets[index].id, actions[action] == getString(R.string.ui_2b96f6a6a976))
                                        toast(getString(R.string.ui_158871d8b201))
                                    } catch (e: CancellationException) { throw e }
                                    catch (e: Exception) { toast(getString(R.string.ui_e31d650c716b, java.lang.String.valueOf(e.localizedMessage))) }
                                } }.show()
                            } catch (e: CancellationException) { throw e }
                            catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
                        }
                    }
                }.show()
            }.create()
        dialog.show()
        dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener {
            AlertDialog.Builder(this).setItems(arrayOf(getString(R.string.ui_3a5040b68abf), getString(R.string.ui_f4d4bae588c4), getString(R.string.song_range))) { _, choice ->
                if (choice < 2) checked.indices.forEach { checked[it] = choice == 0; dialog.listView.setItemChecked(it, checked[it]) }
                else {
                    val input = EditText(this).apply { hint = getString(R.string.song_range_hint); setSingleLine(true) }
                    val range = AlertDialog.Builder(this).setTitle(getString(R.string.song_range)).setView(input).setNegativeButton(android.R.string.cancel, null).setPositiveButton(android.R.string.ok, null).create()
                    range.setOnShowListener { range.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                        val match = Regex("\\s*(\\d+)\\s*[-–]\\s*(\\d+)\\s*").matchEntire(input.text.toString())
                        val start = match?.groupValues?.get(1)?.toIntOrNull(); val end = match?.groupValues?.get(2)?.toIntOrNull()
                        if (start == null || end == null || start !in 1..snapshot.size || end !in start..snapshot.size) input.error = getString(R.string.song_position_invalid)
                        else { for (index in start - 1 until end) { checked[index] = true; dialog.listView.setItemChecked(index, true) }; range.dismiss() }
                    } }; range.show()
                }
            }.show()
        }
    }
    private fun showSongActions(song: Song) {
        val selected = activePlaylist
        val actions = mutableListOf(getString(R.string.ui_cc143006b20d), getString(R.string.ui_792336bc0bbf), getString(R.string.ui_9b3d69ae09ce), getString(R.string.ui_9c2f512b6594), getString(R.string.ui_94ca0a7bf933), getString(R.string.ui_f655b3c8a2b6), getString(R.string.ui_804151aa3e97), getString(R.string.ui_732807e9a807))
        actions.addAll(listOf(getString(R.string.song_copy_name), getString(R.string.song_source_details)))
        if (song.source == "local") actions.add(getString(R.string.metadata_edit)) else actions.add(getString(R.string.song_clear_cache))
        if (selected != null) actions.add(getString(R.string.song_position))
        if (song.source != "local") actions.addAll(listOf(getString(R.string.ui_9be60bb7ddeb), getString(R.string.ui_07f73642e525)))
        if (selected != null) actions.addAll(listOf(getString(R.string.ui_44c2c89152c7), getString(R.string.ui_2b96f6a6a976), getString(R.string.ui_de23dedafe75), getString(R.string.ui_d092b4040c1f)))
        AlertDialog.Builder(this).setTitle(song.title).setItems(actions.toTypedArray()) { _, which ->
            when (actions[which]) {
            getString(R.string.metadata_edit) -> startActivityForResult(MetadataActivity.intentFor(this, song), REQUEST_METADATA)
            getString(R.string.song_copy_name) -> { (getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager).setPrimaryClip(android.content.ClipData.newPlainText(song.title, "${song.title} - ${song.artist}")) }
            getString(R.string.song_source_details) -> {
                val text = TextView(this).apply { text = "${song.title}\n${song.artist}\n${song.source}\n${song.uri}\n" + (song.sourceInfo?.let { runCatching { org.json.JSONObject(it).toString(2) }.getOrDefault(it) } ?: ""); setTextIsSelectable(true); setPadding(24, 12, 24, 12) }
                AlertDialog.Builder(this).setTitle(getString(R.string.song_source_details)).setView(ScrollView(this).apply { addView(text) }).setPositiveButton(android.R.string.ok, null)
                    .apply { SongShare.providerPage(song)?.let { uri -> setNeutralButton(getString(R.string.song_open_provider)) { _, _ -> runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) } } } }.show()
            }
            getString(R.string.song_clear_cache) -> scope.launch {
                try { (service ?: error(getString(R.string.ui_7ca47a28e695))).clearSongCache(song); toast(getString(R.string.song_cache_cleared)) }
                catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(e.localizedMessage.orEmpty()) }
            }
            getString(R.string.song_position) -> if (selected != null) {
                val input = EditText(this).apply { inputType = InputType.TYPE_CLASS_NUMBER; hint = getString(R.string.song_position_hint) }
                val position = AlertDialog.Builder(this).setTitle(getString(R.string.song_position)).setView(input).setNegativeButton(android.R.string.cancel, null).setPositiveButton(android.R.string.ok, null).create()
                position.setOnShowListener { position.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                    val value = input.text.toString().toIntOrNull()
                    if (value == null || value < 1) input.error = getString(R.string.song_position_invalid)
                    else scope.launch {
                        try { playlists.moveSongPosition(selected.id, song, value - 1); position.dismiss() }
                        catch (e: CancellationException) { throw e }
                        catch (e: Exception) { input.error = e.localizedMessage }
                    }
                } }; position.show()
            }
            getString(R.string.ui_804151aa3e97) -> runCatching { SongShare.share(this, song) }.onFailure { toast(getString(R.string.ui_72b5f22035d2, java.lang.String.valueOf(it.localizedMessage))) }
            getString(R.string.ui_732807e9a807) -> scope.launch {
                try {
                    toast(getString(R.string.ui_d2678cc07f14))
                    val songs = service?.otherSources(song).orEmpty()
                    if (songs.isEmpty()) toast(getString(R.string.ui_6c9ad7b94469)) else AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_cb355d5c3da2))
                        .setItems(songs.map { "${it.source.uppercase()} · ${it.title} · ${it.artist}" }.toTypedArray()) { _, index ->
                            AlertDialog.Builder(this@MainActivity).setTitle(songs[index].title).setItems(arrayOf(getString(R.string.ui_c3396195e91c), getString(R.string.ui_cc143006b20d), getString(R.string.ui_94ca0a7bf933))) { _, action ->
                                when (action) { 0 -> performAudioAction(AudioAction.Play(listOf(songs[index]), 0)); 1 -> choosePlaylistForSong(songs[index]); else -> service?.enqueue(listOf(songs[index]), true) }
                            }.show()
                        }.show()
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_f6baa7a2ba08, java.lang.String.valueOf(e.localizedMessage))) }
            }
            getString(R.string.ui_07f73642e525) -> showComments(this, scope, song)
            getString(R.string.ui_9b3d69ae09ce) -> showDislikeChoices(song)
            getString(R.string.ui_94ca0a7bf933), getString(R.string.ui_f655b3c8a2b6) -> {
                service?.enqueue(listOf(song), actions[which] == getString(R.string.ui_94ca0a7bf933)); toast(getString(R.string.ui_51a4e2f9dea0))
            }
            getString(R.string.ui_2b96f6a6a976) -> if (selected != null) scope.launch {
                try {
                val targets = playlists.list().filterNot { it.id == selected.id }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_2b96f6a6a976)).setItems(targets.map { it.name }.toTypedArray()) { _, target -> scope.launch {
                    try { playlists.moveSong(selected.id, targets[target].id, song) }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { toast(getString(R.string.ui_9706d4890951, java.lang.String.valueOf(e.localizedMessage))) }
                } }.show()
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
            }
            getString(R.string.ui_de23dedafe75), getString(R.string.ui_d092b4040c1f) -> if (selected != null) scope.launch {
                try {
                    val songs = playlists.songs(selected.id)
                    val position = songs.indexOfFirst { it.id == song.id && it.source == song.source } + if (actions[which] == getString(R.string.ui_de23dedafe75)) -1 else 1
                    playlists.moveSongPosition(selected.id, song, position)
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_3d085075c12b, java.lang.String.valueOf(e.localizedMessage))) }
            }
            getString(R.string.ui_9c2f512b6594) -> {
                if (service?.state?.value?.song?.let { it.id == song.id && it.source == song.source } == true) service?.reloadLyrics(true)
                else scope.launch { lyrics.clearOnlineCache(song) }
                toast(getString(R.string.ui_698d047aee02))
            }
            getString(R.string.ui_792336bc0bbf) -> {
                pendingLyricSongId = song.id
                pendingLyricSource = song.source
                @Suppress("DEPRECATION")
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE); type = "*/*"
                }, REQUEST_LYRIC)
            }
            getString(R.string.ui_9be60bb7ddeb) -> requestDownload(song)
            getString(R.string.ui_44c2c89152c7) -> if (selected != null) {
                scope.launch {
                    try { playlists.remove(selected.id, song); if (activePlaylist?.id == selected.id) loadPlaylist(selected) }
                    catch (e: Exception) { toast(getString(R.string.ui_1dd0b9466445, java.lang.String.valueOf(e.localizedMessage))) }
                }
            }
            else -> choosePlaylistForSong(song)
            }
        }.show()
    }
    private fun requestDownload(song: Song) {
        val permission = PermissionPolicy.downloadWrite(Build.VERSION.SDK_INT)
        if (permission == null || checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
            downloadSong(song); return
        }
        pendingDownload = song
        val preferences = getSharedPreferences("permission-history", MODE_PRIVATE)
        if (preferences.getBoolean("download-requested", false) && !shouldShowRequestPermissionRationale(permission)) {
            AlertDialog.Builder(this).setTitle(getString(R.string.ui_ee8644062426))
                .setMessage(getString(R.string.ui_5657f8f32261))
                .setNegativeButton(getString(R.string.ui_2cd0f3be8738)) { _, _ -> pendingDownload = null }
                .setOnCancelListener { pendingDownload = null }
                .setPositiveButton(getString(R.string.ui_37aa6ad6a36d)) { _, _ ->
                    waitingForDownloadSettings = true
                    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
                }.show()
            return
        }
        preferences.edit().putBoolean("download-requested", true).apply()
        requestPermissions(arrayOf(permission), REQUEST_DOWNLOAD)
    }
    private fun downloadSong(song: Song) {
        val player = service ?: run { waitingForServiceDownload = song; return }
        scope.launch {
            try {
                val uri = Uri.parse(player.resolveUrl(song))
                Downloads(applicationContext).enqueue(song, uri)
                toast(getString(R.string.ui_6b7ce36f8aa9))
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_42fb22bc6277, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    @Deprecated("Deprecated in Android")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_METADATA) {
            if (resultCode == RESULT_OK && data != null) {
                val song = Song(data.getLongExtra("id", -1), Uri.parse(data.getStringExtra("uri")), data.getStringExtra("title").orEmpty(), data.getStringExtra("artist").orEmpty(), data.getLongExtra("duration", 0), "local", data.getStringExtra("info"))
                service?.metadataChanged(song)
                allSongs = allSongs.map { if (it.id == song.id && it.source == "local") song else it }; filterSongs()
            }
            return
        }
        if (requestCode == REQUEST_LOG_EXPORT) {
            val uri = data?.data
            if (resultCode == RESULT_OK && uri != null) scope.launch {
                try {
                    val text = DiagnosticLog(applicationContext).read()
                    withContext(Dispatchers.IO) {
                        contentResolver.openOutputStream(uri, "wt")?.use { it.write(text.toByteArray(Charsets.UTF_8)) } ?: error(getString(R.string.ui_bc86fe4ef5a1))
                    }
                    toast(getString(R.string.ui_7f05d4a5267c))
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_94477acc433d, java.lang.String.valueOf(e.localizedMessage))) }
            }
            return
        }
        if (requestCode == REQUEST_SOURCE_EXPORT) {
            val id = pendingSourceExportId; pendingSourceExportId = null
            val uri = data?.data
            if (resultCode == RESULT_OK && id != null && uri != null) scope.launch {
                try {
                    withContext(Dispatchers.IO) {
                        val entry = UserSourceLibrary(applicationContext).read().entries.firstOrNull { it.id == id } ?: error(getString(R.string.ui_d002a3c70b6f))
                        contentResolver.openOutputStream(uri, "wt")?.use { it.write(entry.script.toByteArray(Charsets.UTF_8)) } ?: error(getString(R.string.ui_bc86fe4ef5a1))
                    }
                    toast(getString(R.string.ui_f09d848b26d5))
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_94477acc433d, java.lang.String.valueOf(e.localizedMessage))) }
            }
            return
        }
        if (requestCode == REQUEST_EXPORT) {
            val uri = data?.data ?: return
            if (resultCode != RESULT_OK) return
            scope.launch {
                try {
                    val hasLocal = playlists.list().any { list -> playlists.songs(list.id).any { PermissionPolicy.requiresLibraryAccess(this@MainActivity, it) } }
                    if (hasLocal && !hasAudioPermission()) requestAudioAccess(AudioAction.ExportBackup(uri)) else exportBackup(uri)
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
            }
            return
        }
        if (requestCode == REQUEST_BACKUP) {
            val uri = data?.data ?: return
            if (resultCode != RESULT_OK) return
            scope.launch {
                try {
                    val bytes = kotlinx.coroutines.withContext(Dispatchers.IO) {
                        contentResolver.openInputStream(uri)?.use { it.readBounded(32 * 1024 * 1024) } ?: error(getString(R.string.ui_96d30301c75b))
                    }
                    val privatePaths = ExternalAudio.existing(applicationContext).keys
                    val hasLocal = withContext(Dispatchers.Default) { LegacyBackup.containsLocalSongs(bytes, privatePaths) }
                    if (hasLocal && !hasAudioPermission()) requestAudioAccess(AudioAction.ImportBackup(uri)) else previewBackup(uri, bytes)
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_e67137044b3b, java.lang.String.valueOf(e.localizedMessage))) }
            }
            return
        }
        if (requestCode == REQUEST_SOURCE) {
            val uri = data?.data ?: return
            if (resultCode != RESULT_OK) return
            scope.launch {
                try {
                    val script = kotlinx.coroutines.withContext(Dispatchers.IO) {
                        contentResolver.openInputStream(uri)?.use { it.readBounded(2 * 1024 * 1024).toString(Charsets.UTF_8) }
                            ?: error(getString(R.string.ui_2dcda639f980))
                    }
                    val player = service ?: error(getString(R.string.ui_7ca47a28e695))
                    player.importSource(script)
                    toast(getString(R.string.ui_18710cc58894))
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) { toast(getString(R.string.ui_0874f11320ab, java.lang.String.valueOf(e.localizedMessage))) }
            }
            return
        }
        if (requestCode != REQUEST_LYRIC) return
        val id = pendingLyricSongId
        val source = pendingLyricSource
        pendingLyricSongId = null
        val uri = data?.data
        if (resultCode != RESULT_OK || id == null || uri == null) return
        scope.launch {
            try {
                lyrics.import(id, source, uri)
                if (lyricKey == "$source:$id") service?.reloadLyrics()
                toast(getString(R.string.ui_2b06ad3fc97c))
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_e57c5262074b, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun exportBackup(uri: Uri) {
        scope.launch {
            try {
                val saved = playlists.list().map { it to playlists.songs(it.id) }
                val local = ExternalAudio.existing(applicationContext) + if (hasAudioPermission()) LocalMusic(applicationContext).byLegacyPath() else emptyMap()
                val paths = local.entries.filter { it.key.startsWith("/") }.associate { it.value.id to it.key }
                val missing = saved.sumOf { pair -> pair.second.count { it.source == "local" && it.id !in paths } }
                val snapshot = playlists.syncSnapshot(paths, forBackup = true)
                val bytes = withContext(Dispatchers.Default) { LegacyBackup.encodeSnapshot(snapshot) }
                withContext(Dispatchers.IO) { contentResolver.openOutputStream(uri, "w")?.use { it.write(bytes) } ?: error(getString(R.string.ui_ce34bb9dcbed)) }
                toast(if (missing == 0) getString(R.string.ui_d8d9cfef9027) else getString(R.string.ui_1aa0f000b1e1, java.lang.String.valueOf(missing)))
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_735faa049036, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun previewBackup(uri: Uri, existingBytes: ByteArray? = null) {
        scope.launch {
            try {
                val bytes = existingBytes ?: withContext(Dispatchers.IO) {
                    contentResolver.openInputStream(uri)?.use { it.readBounded(32 * 1024 * 1024) } ?: error(getString(R.string.ui_96d30301c75b))
                }
                val paths = ExternalAudio.existing(applicationContext) + if (hasAudioPermission()) LocalMusic(applicationContext).byLegacyPath() else emptyMap()
                val backup = withContext(Dispatchers.Default) { LegacyBackup.parse(bytes, paths) }
                val count = backup.lists.sumOf { it.songs.size }
                val message = getString(R.string.ui_9587a26d9a2c, java.lang.String.valueOf(backup.lists.size), java.lang.String.valueOf(count)) +
                    if (backup.skipped > 0) getString(R.string.ui_fbefd6976ef5, java.lang.String.valueOf(backup.skipped)) else ""
                val builder = AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_63802f7b0c9b))
                    .setMessage(message).setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).setPositiveButton(getString(R.string.ui_d75d8ce65fed)) { _, _ ->
                        scope.launch {
                            try { val saved = playlists.importLists(backup.lists); toast(getString(R.string.ui_f301e960381c, java.lang.String.valueOf(saved))) }
                            catch (e: CancellationException) { throw e }
                            catch (e: Exception) { toast(getString(R.string.ui_dd5c3f8f623f, java.lang.String.valueOf(e.localizedMessage))) }
                        }
                    }
                if (backup.skipped == 0) builder.setNeutralButton(getString(R.string.ui_d02f0ac55e15)) { _, _ -> scope.launch {
                    try { toast(getString(R.string.ui_8f3a82ea5eda, java.lang.String.valueOf(playlists.restoreBackup(backup.lists)))) }
                    catch (e: CancellationException) { throw e }
                    catch (e: Exception) { toast(getString(R.string.ui_edc6992a1230, java.lang.String.valueOf(e.localizedMessage))) }
                } }
                builder.show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_e67137044b3b, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun choosePlaylistForSong(song: Song) {
        scope.launch {
            try {
                val items = playlists.list()
                if (items.isEmpty()) { toast(getString(R.string.ui_bf12c5906f59)); return@launch }
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_cc143006b20d))
                    .setItems(items.map { it.name }.toTypedArray()) { _, which ->
                        scope.launch {
                            try { toast(if (playlists.add(items[which].id, song)) getString(R.string.ui_889839915c3f) else getString(R.string.ui_54a28a424697)) }
                            catch (e: Exception) { toast(getString(R.string.ui_3350538a51ed, java.lang.String.valueOf(e.localizedMessage))) }
                        }
                    }.setNegativeButton(getString(R.string.ui_2cd0f3be8738), null).show()
            } catch (e: Exception) { toast(getString(R.string.ui_ef6e30183259, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun toast(message: String) { Toast.makeText(this, message, Toast.LENGTH_SHORT).show() }
    private fun updateSuggestions(query: String) {
        suggestionJob?.cancel()
        if (!onlineMode || boardMode || onlinePlaylistMode || query.isBlank()) return
        val source = searchSource
        suggestionJob = scope.launch {
            delay(350)
            val history = if (preferences.searchHistory) SearchHistory(this@MainActivity).list().filter { it.contains(query, true) } else emptyList()
            val remote = try { SearchSuggestions().suggestions(source, query) }
            catch (e: CancellationException) { throw e }
            catch (_: Exception) { emptyList() }
            if (onlineMode && !boardMode && !onlinePlaylistMode && search.text.toString() == query && searchSource == source) {
                val box = search as AutoCompleteTextView
                box.setAdapter(ArrayAdapter(this@MainActivity, android.R.layout.simple_dropdown_item_1line, (history + remote).distinct().take(15)))
                if (box.hasFocus() && box.isShown && window.decorView.hasWindowFocus()) box.showDropDown()
            }
        }
    }
    private fun searchTerm(term: String) {
        onlineMode = true; boardMode = false; onlinePlaylistMode = false; activePlaylist = null; updateListAction()
        pageTitle.text = getString(R.string.ui_44ce7ae909bb); heading.text = getString(R.string.ui_e07216a6d505, java.lang.String.valueOf(sourceLabel()))
        search.visibility = View.VISIBLE; search.setText(term); searchOnline()
    }
    private fun showSearchTools() {
        val history = SearchHistory(this)
        val terms = history.list()
        val labels = listOf(getString(R.string.ui_dcd3c46d127f, java.lang.String.valueOf(sourceLabel())), getString(R.string.ui_02c0ab8fbd15)) + terms
        val view = ListView(this).apply { adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_list_item_1, labels) }
        val dialog = AlertDialog.Builder(this).setTitle(getString(R.string.ui_6d0b959193ab)).setView(view).setNegativeButton(getString(R.string.ui_3fd47edce45b), null).create()
        view.setOnItemClickListener { _, _, index, _ ->
            when (index) {
                0 -> {
                    dialog.dismiss()
                    scope.launch {
                        try {
                            toast(getString(R.string.ui_fa0ead846beb))
                            val hot = SearchSuggestions().hot(searchSource)
                            if (hot.isEmpty()) toast(getString(R.string.ui_50933f24c7aa)) else AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_2a61478eeecf, java.lang.String.valueOf(sourceLabel())))
                                .setItems(hot.toTypedArray()) { _, position -> searchTerm(hot[position]) }.setNegativeButton(getString(R.string.ui_3fd47edce45b), null).show()
                        } catch (e: CancellationException) { throw e }
                        catch (e: Exception) { toast(getString(R.string.ui_bf00a3daba4a, java.lang.String.valueOf(e.localizedMessage))) }
                    }
                }
                1 -> { history.clear(); dialog.dismiss(); showSearchTools() }
                else -> { dialog.dismiss(); searchTerm(terms[index - 2]) }
            }
        }
        view.setOnItemLongClickListener { _, _, index, _ ->
            if (index < 2) false else { history.remove(terms[index - 2]); dialog.dismiss(); showSearchTools(); true }
        }
        dialog.show()
    }
    private fun showHistory() {
        scope.launch {
            try {
                val history = RecentSongs(this@MainActivity)
                val songs = history.list()
                AlertDialog.Builder(this@MainActivity).setTitle(getString(R.string.ui_4f03b04808e7, java.lang.String.valueOf(songs.size)))
                    .setItems(songs.map { "${it.title} · ${it.artist}" }.toTypedArray()) { _, index ->
                        val action = AudioAction.Play(songs, index)
                        if (PermissionPolicy.requiresLibraryAccess(this@MainActivity, songs[index]) && !hasAudioPermission()) requestAudioAccess(action) else performAudioAction(action)
                    }.setNegativeButton(getString(R.string.ui_3fd47edce45b), null).setNeutralButton(getString(R.string.ui_1ef3de06b32e)) { _, _ -> scope.launch { history.clear() } }.show()
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { toast(getString(R.string.ui_82abac1a7ffd, java.lang.String.valueOf(e.localizedMessage))) }
        }
    }
    private fun searchOnline(append: Boolean = false) {
        val query = search.text.toString().trim()
        if (query.isEmpty()) { toast(getString(R.string.ui_c975aa812f44)); return }
        SearchHistory(this).add(query)
        suggestionJob?.cancel(); (search as? AutoCompleteTextView)?.dismissDropDown()
        val more = append && query == searchedText && searchPage > 0
        val page = if (more) searchPage + 1 else 1
        val source = searchSource
        loadJob?.cancel()
        status.text = getString(R.string.ui_c37059a3d9df)
        loadMore.visibility = View.GONE
        loadJob = scope.launch {
            try {
                val result = OnlineSearch().search(query, page = page, source = source)
                if (onlineMode && source == searchSource) {
                    allSongs = if (more) (allSongs + result).distinctBy { it.source to it.id } else result
                    searchedText = query; searchPage = page
                    filterSongs()
                    loadMore.visibility = if (result.size >= if (source in setOf("mg", "wy")) 20 else 30) View.VISIBLE else View.GONE
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) {
                if (onlineMode) { status.text = getString(R.string.ui_3ce71e5b6037, java.lang.String.valueOf(e.localizedMessage)); if (more) loadMore.visibility = View.VISIBLE }
            }
        }
    }
    private fun filterSongs() {
        val query = search.text.toString().trim()
        visibleSongs = if (onlineMode) allSongs else allSongs.filter { it.title.contains(query, true) || it.artist.contains(query, true) }
        status.setTextColor(palette.muted); status.contentDescription = null
        status.text = if (!onlineMode && activePlaylist == null && !hasAudioPermission()) {
            status.setTextColor(palette.primary); status.contentDescription = getString(R.string.ui_ccdab23ef0b3)
            getString(R.string.ui_799c8f89223c)
        } else if (allSongs.isEmpty()) getString(R.string.ui_88034b35be15) else getString(R.string.ui_119b62e66b9d, java.lang.String.valueOf(visibleSongs.size))
        val restore = pendingScroll
        val firstVisible = if (preferences.saveScroll) (restore?.first ?: list.firstVisiblePosition).coerceAtMost((visibleSongs.size - 1).coerceAtLeast(0)) else 0
        val top = restore?.second ?: (list.getChildAt(0)?.top ?: 0)
        list.adapter = object : ArrayAdapter<Song>(this, android.R.layout.simple_list_item_1, visibleSongs) {
            override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                val song = getItem(position)!!
                val row = LinearLayout(context).apply { gravity = Gravity.CENTER_VERTICAL; orientation = LinearLayout.HORIZONTAL }
                row.addView(TextView(context).apply {
                    text = "${position + 1}"; textSize = 13f; setTextColor(palette.faint); gravity = Gravity.CENTER
                }, LinearLayout.LayoutParams(dp(38), dp(54)))
                val info = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
                info.addView(TextView(context).apply { text = song.title; textSize = 14f; setTextColor(palette.foreground); maxLines = 1 })
                info.addView(TextView(context).apply {
                    val source = if (preferences.showSource) "${UiPreferences.sourceName(context, song.source)}  " else ""
                    val album = if (preferences.showAlbum) song.sourceInfo?.let { runCatching { org.json.JSONObject(it).optString("albumName") }.getOrNull() } else null
                    text = source + song.artist + if (album.isNullOrBlank()) "" else " · $album"
                    textSize = 11f; setTextColor(palette.muted); maxLines = 1
                })
                row.addView(info, LinearLayout.LayoutParams(0, -2, 1f))
                row.addView(TextView(context).apply {
                    text = formatTime(song.duration.coerceIn(0, Int.MAX_VALUE.toLong()).toInt()); textSize = 12f; setTextColor(palette.faint)
                    visibility = if (preferences.showDuration) View.VISIBLE else View.GONE
                })
                row.addView(TextView(context).apply {
                    text = 59667.toChar().toString(); typeface = iconFont; textSize = 12f; gravity = Gravity.CENTER; setTextColor(palette.faint)
                    contentDescription = getString(R.string.ui_507e04d42f14); setOnClickListener { showSongActions(song) }
                }, LinearLayout.LayoutParams(dp(46), dp(54)))
                palette.textStyle(row)
                return row
            }
        }
        if (firstVisible < visibleSongs.size) {
            list.setSelectionFromTop(firstVisible, top)
            if (restore != null) list.post { if (list.firstVisiblePosition == firstVisible) pendingScroll = null }
        }
    }
    private fun renderPlayer(state: PlayerState) {
        val song = state.song
        val nextLyricKey = song?.let { "${it.source}:${it.id}" }
        if (nextLyricKey != artworkKey) {
            artworkKey = nextLyricKey; artworkBitmap = service?.artworkState?.value?.takeIf { it.key == nextLyricKey }?.bitmap; updateArtwork()
        }
        if (nextLyricKey != lyricKey) {
            lyricKey = nextLyricKey; lyricDelayMs = song?.let(lyricOffsets::get) ?: 0
            lyricLines = service?.lyricState?.value?.takeIf { it.key == nextLyricKey }?.lines ?: emptyList()
        }
        updateLyric(state.position)
        title.text = state.error ?: state.song?.let { "${it.title} · ${it.artist}" } ?: getString(R.string.ui_2389f5b06bce)
        toggle.text = (if (state.playing) 59661 else 59653).toChar().toString()
        toggle.contentDescription = when { state.preparing -> getString(R.string.ui_d04fcbda737f); state.playing -> getString(R.string.ui_8d12fc0d4eb2); else -> getString(R.string.ui_c3396195e91c) }
        toggle.isEnabled = state.song != null && !state.preparing
        seek.max = state.duration.coerceAtLeast(0)
        seek.isEnabled = preferences.allowSeek && song != null
        detailSeek?.isEnabled = preferences.allowSeek && song != null
        miniBar.visibility = if (preferences.autoHidePlayer && song == null) View.GONE else View.VISIBLE
        seek.visibility = miniBar.visibility
        if (!changingSeek) seek.progress = state.position
        time.text = "${formatTime(state.position)} / ${formatTime(state.duration)}"
        renderDetails(state)
        if (startupPlayerPending && song != null) { startupPlayerPending = false; showPlayerDetails() }
    }
    private fun updateLyric(position: Int) {
        lyric.maxLines = if (playerSettings.showTranslation || playerSettings.showRomanization) 3 else 1
        lyric.text = lyricLines.getOrNull(LrcParser.indexAt(lyricLines, LyricTiming.lyricPosition(position.toLong(), lyricDelayMs)))
            ?.let { LyricRendering.text(it, playerSettings) } ?: if (lyricLines.isEmpty()) "" else "♪"
    }
    private fun formatTime(milliseconds: Int): String {
        val seconds = milliseconds.coerceAtLeast(0) / 1000
        return "%02d:%02d".format(seconds / 60, seconds % 60)
    }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    companion object { private const val REQUEST_AUDIO = 1; private const val REQUEST_LYRIC = 3; private const val REQUEST_SOURCE = 4; private const val REQUEST_BACKUP = 5; private const val REQUEST_DOWNLOAD = 6; private const val REQUEST_EXPORT = 7; private const val REQUEST_SYNC_NOTIFICATION = 8; private const val REQUEST_SOURCE_EXPORT = 9; private const val REQUEST_LOG_EXPORT = 10; private const val REQUEST_METADATA = 11 }
}

