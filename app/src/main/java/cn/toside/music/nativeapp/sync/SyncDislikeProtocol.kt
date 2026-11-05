package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.data.DislikeStore

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray

/** LX v4's independent dislike v1 feature, matching the RN client's handler names and payloads. */
internal class SyncDislikeProtocol(
    private val store: DislikeStore,
    private val chooseConflictMode: suspend () -> String,
    private val onFinished: () -> Unit = {},
) {
    private val mutex = Mutex()
    @Volatile private var ready = false
    val handlers: Map<String, suspend (JSONArray) -> Any?> = mapOf(
        "dislike_sync_get_md5" to { _ -> mutex.withLock { SyncWire.textHash(store.get().text.trim()) } },
        "dislike_sync_get_list_data" to { _ -> mutex.withLock { store.get().text } },
        "dislike_sync_get_sync_mode" to { _ ->
            chooseConflictMode().also { require(it in SyncFeature.DISLIKE.modes) { "不喜欢列表同步冲突处理方式无效" } }
        },
        "dislike_sync_set_list_data" to { args ->
            mutex.withLock { store.overwriteRemote(args.get(0) as? String ?: error("不喜欢列表数据无效")) }; null
        },
        "dislike_sync_finished" to { _ -> ready = true; onFinished(); null },
        "onDislikeSyncAction" to { args ->
            if (ready) mutex.withLock { store.applyRemoteAction(args.getJSONObject(0)) }
            null
        },
    )
}
