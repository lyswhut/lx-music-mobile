package cn.toside.music.nativeapp

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.IOException

internal data class BackgroundSyncState(val active: Boolean = false, val connected: Boolean = false,
    val message: String = "", val features: Set<SyncFeature> = emptySet(), val conflict: SyncConflictRequest? = null)

/** Owns authentication, reconnection and pending decisions without retaining an Activity. */
internal class BackgroundSync(
    private val scope: CoroutineScope,
    private val playlists: Playlists,
    private val dislikes: DislikeStore,
    private val settings: BackgroundSyncSettings,
    private val localFiles: suspend () -> Map<String, Song>,
    private val authenticate: suspend (String, String?) -> SyncCredentials,
    private val saveCredentials: suspend (String, SyncCredentials) -> Unit,
    private val connectionFactory: SyncConnectionFactory = SyncConnectionFactory { address, credentials, handlers, disconnected ->
        SyncTransport(address, credentials, handlers, disconnected)
    },
    private val retryDelay: suspend (Int) -> Unit = { attempt -> delay((2_000L + attempt * 3_000L).coerceAtMost(30_000L)) },
) : AutoCloseable {
    private val mutableState = MutableStateFlow(BackgroundSyncState(message = settings.message))
    val state = mutableState.asStateFlow()
    private val choices = SyncConflictChoice()
    private var job: Job? = null
    @Volatile private var session: SyncSession? = null
    private var address = ""

    init {
        scope.launch {
            choices.request.collect { request ->
                mutableState.update { old -> old.copy(conflict = request,
                    message = if (request != null) "请返回应用选择${request.feature.label}同步方式" else old.message) }
            }
        }
    }
    fun start(address: String, code: String? = null) {
        if (job?.isActive == true && this.address == address && code.isNullOrBlank()) return
        val previous = job
        previous?.cancel(); session?.close(); choices.clear()
        this.address = address
        mutableState.value = BackgroundSyncState(active = true, message = "正在连接同步服务…")
        job = scope.launch(Dispatchers.IO) {
            previous?.join()
            var authCode = code?.takeIf { it.isNotBlank() }
            var retry = 0
            while (isActive) {
                var current: SyncSession? = null
                try {
                    settings.enable(address)
                    val credentials = authenticate(address, authCode)
                    saveCredentials(address, credentials)
                    authCode = null // The entered code is never persisted or reused after successful authentication.
                    current = SyncSession(playlists, dislikes, localFiles, { choices.choose(credentials.serverName, it) },
                        connectionFactory = connectionFactory)
                    session = current
                    current.connect(address, credentials)
                    currentCoroutineContext().ensureActive()
                    val features = current.state.value.features
                    mutableState.value = BackgroundSyncState(active = true, connected = true, features = features,
                        message = "正在后台同步${features.joinToString("、") { it.label }}")
                    retry = 0
                    val failure = current.state.first { !it.connected && it.message.isNotBlank() && !it.message.startsWith("正在") }
                    if (failure.retryable) throw SyncConnectionException(failure.message)
                    error(failure.message)
                } catch (e: TimeoutCancellationException) {
                    currentCoroutineContext().ensureActive()
                    mutableState.update { it.copy(connected = false, message = "同步连接超时，正在重试…") }
                } catch (e: CancellationException) { throw e }
                catch (e: IOException) {
                    currentCoroutineContext().ensureActive()
                    mutableState.update { it.copy(connected = false, message = "同步连接中断，正在重试…") }
                } catch (e: Exception) {
                    currentCoroutineContext().ensureActive()
                    finish("同步已停止：${e.localizedMessage}", disable = true)
                    return@launch
                } finally {
                    current?.close()
                    if (session === current) session = null
                }
                // A reconnect must not discard an unanswered conflict or choose a destructive default in the background.
                if (choices.awaitBeforeRetry() == "cancel") {
                    finish("同步已取消", disable = true)
                    return@launch
                }
                retryDelay(++retry)
            }
        }
    }
    fun choose(id: Long, mode: String): Boolean = choices.submit(id, mode)
    fun stop(message: String = "同步已断开", disable: Boolean = true) {
        job?.cancel(); session?.close(); session = null; choices.clear()
        finish(message, disable)
    }
    private fun finish(message: String, disable: Boolean) {
        choices.clear()
        settings.finish(message, disable)
        mutableState.value = BackgroundSyncState(message = message)
    }
    override fun close() { job?.cancel(); session?.close(); choices.clear() }
}
