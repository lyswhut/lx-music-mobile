package cn.toside.music.nativeapp

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

internal class SyncDislikeOutboxPump(private val store: DislikeStore, private val send: suspend (JSONObject) -> Unit) {
    private val mutex = Mutex()
    suspend fun drain() = mutex.withLock {
        while (true) {
            val pending = store.pendingSyncAction() ?: break
            send(pending.event)
            store.acknowledgeSyncAction(pending.sequence)
        }
    }
}
