package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.data.DislikeStore
import cn.toside.music.nativeapp.data.Playlists
import cn.toside.music.nativeapp.data.Song

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import kotlinx.coroutines.selects.select
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import java.util.concurrent.atomic.AtomicBoolean
import java.io.IOException
import org.json.JSONObject

internal class SyncConnectionException(message: String, cause: Throwable? = null) : IOException(message, cause)
internal data class SyncSessionState(val connected: Boolean = false, val message: String = "", val features: Set<SyncFeature> = emptySet(),
    val retryable: Boolean = false)

/** Coordinates negotiated list/dislike features. Credentials are obtained separately through SyncAuth. */
internal class SyncSession(
    private val playlists: Playlists,
    private val dislikes: DislikeStore,
    private val localFiles: suspend () -> Map<String, Song>,
    private val chooseConflictMode: suspend (SyncFeature) -> String,
    private val onChanged: () -> Unit = {},
    private val connectionFactory: SyncConnectionFactory = SyncConnectionFactory { address, credentials, handlers, onDisconnected ->
        SyncTransport(address, credentials, handlers, onDisconnected)
    },
) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mutableState = MutableStateFlow(SyncSessionState())
    val state = mutableState.asStateFlow()
    private val started = AtomicBoolean(false)
    private val closed = AtomicBoolean(false)
    private val stateLock = Any()
    @Volatile private var transport: SyncConnection? = null
    private var pumpJob: Job? = null
    @Volatile private var connectJob: Job? = null

    suspend fun connect(address: String, credentials: SyncCredentials) {
        check(started.compareAndSet(false, true) && !closed.get()) { "同步会话已启动" }
        val caller = currentCoroutineContext()[Job]
        connectJob = caller
        mutableState.value = SyncSessionState(message = "正在同步数据…")
        try {
            playlists.pauseLocalMutations {
                dislikes.pauseLocalMutations {
                    val watermark = playlists.syncOutboxWatermark()
                    val dislikeWatermark = dislikes.syncOutboxWatermark()
                    val negotiated = CompletableDeferred<Set<SyncFeature>>()
                    val listFinished = CompletableDeferred<Unit>()
                    val dislikeFinished = CompletableDeferred<Unit>()
                    val finished = CompletableDeferred<Unit>()
                    val disconnected = CompletableDeferred<SyncDisconnect>()
                    val cancelled = AtomicBoolean(false)
                    val list = SyncListProtocol(playlists, localFiles, {
                        chooseConflictMode(SyncFeature.LIST).also { if (it == "cancel") cancelled.set(true) }
                    }, { listFinished.complete(Unit) }, onChanged)
                    val dislike = SyncDislikeProtocol(dislikes, {
                        chooseConflictMode(SyncFeature.DISLIKE).also { if (it == "cancel") cancelled.set(true) }
                    }, { dislikeFinished.complete(Unit) })
                    val featureHandlers = mapOf(SyncFeature.LIST to list.handlers, SyncFeature.DISLIKE to dislike.handlers)
                    val guardedHandlers = featureHandlers.flatMap { (feature, handlers) ->
                        handlers.map { (name, handler) ->
                            val guarded: suspend (JSONArray) -> Any? = { args ->
                                check(negotiated.isCompleted && feature in negotiated.await()) { "同步功能尚未协商或未启用：${feature.label}" }
                                handler(args)
                            }
                            name to guarded
                        }
                    }.toMap()
                    val handlers = guardedHandlers + mapOf<String, suspend (JSONArray) -> Any?>(
                        "getEnabledFeatures" to { args ->
                            val features = SyncFeature.negotiate(args.getJSONObject(1))
                            check(negotiated.complete(features)) { "同步功能重复协商" }
                            SyncFeature.configuration(features)
                        },
                        "finished" to { _ -> finished.complete(Unit); null },
                    )
                    val connection = connectionFactory.create(address, credentials, handlers) { failure ->
                        synchronized(stateLock) {
                            disconnected.complete(failure)
                            if (!closed.get()) mutableState.value = SyncSessionState(message = failure.message, retryable = failure.retryable)
                        }
                        pumpJob?.cancel()
                    }
                    transport = connection
                    connection.connect()
                    withTimeout(120_000) {
                        select<Unit> {
                            disconnected.onAwait { if (it.retryable) throw SyncConnectionException(it.message) else error(it.message) }
                            finished.onAwait { }
                        }
                        check(negotiated.isCompleted) { "同步服务尚未协商同步功能" }
                        val features = negotiated.await()
                        check(!cancelled.get() && (SyncFeature.LIST !in features || listFinished.isCompleted) &&
                            (SyncFeature.DISLIKE !in features || dislikeFinished.isCompleted)) { "数据同步未完成或已取消" }
                    }
                    // Local edits are paused: everything up to this point is represented in the negotiated snapshot.
                    val features = negotiated.await()
                    if (SyncFeature.LIST in features) {
                        playlists.setSyncTracking(true)
                        playlists.acknowledgeSyncThrough(watermark)
                    }
                    if (SyncFeature.DISLIKE in features) {
                        dislikes.setSyncTracking(true)
                        dislikes.acknowledgeSyncThrough(dislikeWatermark)
                    }
                    synchronized(stateLock) {
                        check(!closed.get() && !disconnected.isCompleted) { "同步连接已关闭" }
                        mutableState.value = SyncSessionState(connected = true, features = features)
                    }
                    pumpJob = scope.launch(start = CoroutineStart.UNDISPATCHED) {
                        suspend fun send(method: String, event: JSONObject) {
                            try { connection.call(listOf(method), JSONArray().put(event)) }
                            catch (e: TimeoutCancellationException) { throw SyncConnectionException("同步请求超时", e) }
                        }
                        try { coroutineScope {
                            if (SyncFeature.LIST in features) launch {
                                val pump = SyncOutboxPump(playlists, localFiles) { event ->
                                    send("onListSyncAction", event)
                                }
                                playlists.syncChanges.onStart { emit(Unit) }.collect { pump.drain() }
                            }
                            if (SyncFeature.DISLIKE in features) launch {
                                val pump = SyncDislikeOutboxPump(dislikes) { event ->
                                    send("onDislikeSyncAction", event)
                                }
                                dislikes.syncChanges.onStart { emit(Unit) }.collect { pump.drain() }
                            }
                        } }
                        catch (e: kotlinx.coroutines.CancellationException) { throw e }
                        catch (e: Exception) {
                            synchronized(stateLock) {
                                if (!closed.get() && !disconnected.isCompleted)
                                    mutableState.value = SyncSessionState(message = "同步发送失败：${e.localizedMessage}", retryable = e is IOException)
                            }
                            connection.close()
                        }
                    }
                }
            }
        } catch (e: Exception) {
            transport?.close(); transport = null
            synchronized(stateLock) {
                if (!closed.get()) mutableState.value = SyncSessionState(message = "同步失败：${e.localizedMessage}")
            }
            throw e
        } finally { if (connectJob === caller) connectJob = null }
    }

    override fun close() {
        if (!closed.compareAndSet(false, true)) return
        connectJob?.cancel(); pumpJob?.cancel(); transport?.close(); transport = null; scope.cancel()
        synchronized(stateLock) { mutableState.value = SyncSessionState() }
    }
}
