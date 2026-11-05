package cn.toside.music.nativeapp

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/** Rules and their outgoing actions are committed together, including across store instances. */
internal class DislikeStore(context: Context, name: String = "dislike-rules") {
    private class Signals {
        val lock = Any()
        val localMutationGate = Mutex()
        val changes = MutableSharedFlow<Unit>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    }
    private val preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)
    private val signals = stores.getOrPut("${context.packageName}:$name") { Signals() }
    val syncChanges = signals.changes.asSharedFlow()

    // Retain the original preference name/key so existing native rules need no data conversion.
    fun get(): DislikeRules = DislikeRules.parse(preferences.getString("rules", "") ?: "")

    suspend fun save(text: String): DislikeRules = mutate {
        val rules = DislikeRules.parse(text)
        rules to JSONObject().put("action", "dislike_data_overwrite").put("data", rules.text)
    }
    suspend fun add(name: String, artist: String): DislikeRules = mutate { current ->
        val namePart = name.replace('@', '#'); val artistPart = artist.replace('@', '#')
        DislikeRules.parse(current.text + "\n$namePart@$artistPart") to JSONObject().put("action", "dislike_music_add")
            .put("data", JSONArray().put(JSONObject().put("name", namePart).put("singer", artistPart)))
    }
    suspend fun clear(): DislikeRules = mutate {
        DislikeRules.parse("") to JSONObject().put("action", "dislike_music_clear")
    }

    private suspend fun mutate(change: (DislikeRules) -> Pair<DislikeRules, JSONObject>): DislikeRules = withContext(Dispatchers.IO) {
        signals.localMutationGate.withLock {
            val result = synchronized(signals.lock) {
                val current = get()
                val (updated, event) = change(current)
                if (current.text != updated.text) {
                    val editor = preferences.edit().putString("rules", updated.text)
                    if (preferences.getBoolean("sync-tracking", false)) {
                        val sequence = Math.addExact(preferences.getLong("sync-sequence", 0), 1L)
                        val outbox = outbox().put(JSONObject().put("sequence", sequence).put("event", event))
                        editor.putLong("sync-sequence", sequence).putString("sync-outbox", outbox.toString())
                    }
                    check(editor.commit()) { "无法保存不喜欢列表" }
                }
                updated
            }
            signals.changes.tryEmit(Unit)
            result
        }
    }

    suspend fun <T> pauseLocalMutations(block: suspend () -> T): T = signals.localMutationGate.withLock { block() }

    suspend fun setSyncTracking(enabled: Boolean) = withContext(Dispatchers.IO) {
        synchronized(signals.lock) {
            check(preferences.edit().putBoolean("sync-tracking", enabled).commit()) { "无法保存同步设置" }
        }
    }
    suspend fun syncOutboxWatermark(): Long = withContext(Dispatchers.IO) {
        synchronized(signals.lock) { preferences.getLong("sync-sequence", 0) }
    }
    suspend fun pendingSyncAction(): PendingSyncAction? = withContext(Dispatchers.IO) {
        synchronized(signals.lock) {
            val first = outbox().optJSONObject(0)
            first?.let { PendingSyncAction(it.getLong("sequence"), it.getJSONObject("event")) }
        }
    }
    suspend fun acknowledgeSyncAction(sequence: Long) = removeAcknowledged { it == sequence }
    suspend fun acknowledgeSyncThrough(sequence: Long) = removeAcknowledged { it <= sequence }

    private suspend fun removeAcknowledged(matches: (Long) -> Boolean) = withContext(Dispatchers.IO) {
        synchronized(signals.lock) {
            val current = outbox()
            val retained = JSONArray()
            for (index in 0 until current.length()) {
                val item = current.getJSONObject(index)
                if (!matches(item.getLong("sequence"))) retained.put(item)
            }
            check(preferences.edit().putString("sync-outbox", retained.toString()).commit()) { "无法保存同步发送进度" }
        }
    }
    private fun outbox(): JSONArray = JSONArray(preferences.getString("sync-outbox", "[]") ?: "[]")

    suspend fun overwriteRemote(text: String) = writeRemote { DislikeRules.parse(text) }
    suspend fun applyRemoteAction(event: JSONObject) = writeRemote { current ->
        when (event.getString("action")) {
            "dislike_data_overwrite" -> DislikeRules.parse(event.get("data") as? String ?: error("不喜欢列表数据无效"))
            "dislike_music_clear" -> DislikeRules.parse("")
            "dislike_music_add" -> {
                val entries = event.getJSONArray("data")
                val added = (0 until entries.length()).map { index ->
                    val item = entries.getJSONObject(index)
                    fun field(key: String): String = if (item.isNull(key)) "" else
                        (item.get(key) as? String ?: error("不喜欢规则字段无效")).replace('@', '#')
                    "${field("name")}@${field("singer")}"
                }
                DislikeRules.parse((listOf(current.text) + added).joinToString("\n"))
            }
            else -> error("不支持的不喜欢列表同步操作")
        }
    }
    private suspend fun writeRemote(change: (DislikeRules) -> DislikeRules) = withContext(Dispatchers.IO) {
        synchronized(signals.lock) {
            // Inbound changes bypass the local mutation gate and never enter the outgoing queue.
            val updated = change(get())
            check(preferences.edit().putString("rules", updated.text).commit()) { "无法保存不喜欢列表" }
        }
    }
    companion object { private val stores = ConcurrentHashMap<String, Signals>() }
}
