package cn.toside.music.nativeapp

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

/** Sends committed local operations in order and only removes them after acknowledgement. */
internal class SyncOutboxPump(
    private val playlists: Playlists,
    private val localFiles: suspend () -> Map<String, Song>,
    private val send: suspend (JSONObject) -> Unit,
) {
    private val mutex = Mutex()
    suspend fun drain() = mutex.withLock {
        while (true) {
            val paths = localFiles().entries.filter { it.key.startsWith("/") }.associate { it.value.id to it.key }
            val item = playlists.pendingSyncActions(paths, limit = 1).firstOrNull() ?: break
            send(item.event)
            playlists.acknowledgeSyncAction(item.sequence)
        }
    }
}
