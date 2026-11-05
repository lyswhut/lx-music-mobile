package cn.toside.music.nativeapp

import org.json.JSONArray
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** Inbound snapshot and incremental handlers for the v4 list feature. */
internal class SyncListProtocol(
    private val playlists: Playlists,
    private val localFiles: suspend () -> Map<String, Song>,
    private val chooseConflictMode: suspend () -> String,
    private val onFinished: () -> Unit = {},
    private val onChanged: () -> Unit = {},
) {
    private val mutex = Mutex()
    @Volatile private var ready = false
    private suspend fun snapshot(): org.json.JSONObject {
        val byPath = localFiles()
        val paths = byPath.entries.filter { it.key.startsWith("/") }.associate { it.value.id to it.key }
        return playlists.syncSnapshot(paths)
    }
    val handlers: Map<String, suspend (JSONArray) -> Any?> = mapOf(
        "list_sync_get_list_data" to { _ -> mutex.withLock { snapshot() } },
        "list_sync_get_md5" to { _ -> mutex.withLock { SyncWire.snapshotHash(snapshot()) } },
        "list_sync_get_sync_mode" to { _ ->
            val mode = chooseConflictMode()
            require(mode in SyncFeature.LIST.modes) { "同步冲突处理方式无效" }
            mode
        },
        "list_sync_set_list_data" to { args -> mutex.withLock { playlists.overwriteSyncSnapshot(args.getJSONObject(0), localFiles()); onChanged() }; null },
        "list_sync_finished" to { _ -> ready = true; onFinished(); null },
        "onListSyncAction" to { args ->
            if (ready) mutex.withLock { playlists.applySyncAction(args.getJSONObject(0), localFiles()); onChanged() }
            null
        },
    )
}
