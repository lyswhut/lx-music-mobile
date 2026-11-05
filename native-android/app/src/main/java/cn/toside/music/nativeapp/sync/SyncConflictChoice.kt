package cn.toside.music.nativeapp.sync

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.atomic.AtomicLong

internal data class SyncConflictRequest(val id: Long, val serverName: String, val feature: SyncFeature)

/** The service owns the decision, so dismissing/recreating an Activity cannot select or cancel it. */
internal class SyncConflictChoice {
    private data class Pending(val request: SyncConflictRequest, val answer: CompletableDeferred<String>)
    private val mutex = Mutex()
    private val lock = Any()
    private var pending: Pending? = null
    private val cached = mutableMapOf<SyncFeature, String>()
    private val mutableRequest = MutableStateFlow<SyncConflictRequest?>(null)
    val request = mutableRequest.asStateFlow()

    suspend fun choose(serverName: String, feature: SyncFeature): String = mutex.withLock {
        synchronized(lock) { cached.remove(feature) }?.let { return@withLock it }
        val previous = synchronized(lock) { pending }
        if (previous != null) {
            val answer = previous.answer.await()
            synchronized(lock) { if (pending === previous) { pending = null; mutableRequest.value = null } }
            if (previous.request.feature == feature) return@withLock answer
            synchronized(lock) { cached[previous.request.feature] = answer }
        }
        val next = Pending(SyncConflictRequest(ids.incrementAndGet(), serverName, feature), CompletableDeferred())
        synchronized(lock) { pending = next; mutableRequest.value = next.request }
        // Cancellation of one connection deliberately leaves an unanswered decision for the next attempt.
        val answer = next.answer.await()
        synchronized(lock) { if (pending === next) { pending = null; mutableRequest.value = null } }
        answer
    }
    fun submit(id: Long, mode: String): Boolean = synchronized(lock) {
        val current = pending ?: return false
        if (current.request.id != id || mode !in current.request.feature.modes) return false
        current.answer.complete(mode).also { if (it) mutableRequest.value = null }
    }
    suspend fun awaitBeforeRetry(): String? = synchronized(lock) { pending }?.answer?.await()
    fun clear() = synchronized(lock) {
        pending?.answer?.cancel(); pending = null; cached.clear(); mutableRequest.value = null
    }
    companion object { private val ids = AtomicLong() }
}
