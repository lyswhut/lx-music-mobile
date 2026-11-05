package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.online.OnlinePlaylist
import cn.toside.music.nativeapp.sync.SyncListReducer

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

data class Playlist(val id: Long, val name: String, val syncId: String = "", val source: String? = null, val sourceListId: String? = null)
internal data class PendingSyncAction(val sequence: Long, val event: JSONObject)
private data class SyncSong(val song: Song, val raw: String)
private data class LocalSongRow(val song: Song, val raw: String?)
private data class SyncList(val id: String, val name: String, val metadata: JSONObject?, val songs: List<SyncSong>)

/** Persistent playlists are separate from the platform media library. */
class Playlists(context: Context, name: String = "playlists.db") : SQLiteOpenHelper(context, name, null, 5) {
    private val preferences = AppPreferences(context)
    private class Signals {
        val outgoing = MutableSharedFlow<Unit>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
        val changes = MutableSharedFlow<Unit>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
        val localMutationGate = Mutex()
    }
    private val signals = stores.getOrPut(context.getDatabasePath(name).absolutePath) { Signals() }
    internal val syncChanges = signals.outgoing.asSharedFlow()
    internal val changes = signals.changes.asSharedFlow()
    private val localMutationGate get() = signals.localMutationGate
    private fun notifyLocalChanged() { signals.outgoing.tryEmit(Unit); signals.changes.tryEmit(Unit) }
    companion object { private val stores = ConcurrentHashMap<String, Signals>() }
    internal suspend fun <T> pauseLocalMutations(block: suspend () -> T): T = localMutationGate.withLock { block() }
    override fun onConfigure(db: SQLiteDatabase) { db.setForeignKeyConstraintsEnabled(true) }
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, " +
            "sync_id TEXT NOT NULL UNIQUE, position INTEGER NOT NULL, source TEXT, source_list_id TEXT, location_update_time INTEGER, sync_meta TEXT)")
        createSongsTable(db)
        createSyncTables(db)
    }
    private fun createSyncTables(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE sync_outbox (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL)")
        db.execSQL("CREATE TABLE sync_config (id INTEGER PRIMARY KEY CHECK (id = 1), tracking INTEGER NOT NULL)")
        db.execSQL("INSERT INTO sync_config(id, tracking) VALUES (1, 0)")
    }
    private fun createSongsTable(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE songs (playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE, " +
            "media_id INTEGER NOT NULL, uri TEXT NOT NULL, title TEXT NOT NULL, artist TEXT NOT NULL, " +
            "duration INTEGER NOT NULL, position INTEGER NOT NULL, source TEXT NOT NULL, source_info TEXT, sync_raw TEXT, " +
            "PRIMARY KEY (playlist_id, source, media_id))")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            db.execSQL("ALTER TABLE songs RENAME TO old_songs")
            createSongsTable(db)
            db.execSQL("INSERT INTO songs (playlist_id, media_id, uri, title, artist, duration, position, source) " +
                "SELECT playlist_id, media_id, uri, title, artist, duration, position, 'local' FROM old_songs")
            db.execSQL("DROP TABLE old_songs")
        }
        if (oldVersion < 3) {
            db.execSQL("ALTER TABLE playlists ADD COLUMN sync_id TEXT")
            db.execSQL("ALTER TABLE playlists ADD COLUMN position INTEGER NOT NULL DEFAULT 0")
            db.execSQL("ALTER TABLE playlists ADD COLUMN source TEXT")
            db.execSQL("ALTER TABLE playlists ADD COLUMN source_list_id TEXT")
            db.execSQL("ALTER TABLE playlists ADD COLUMN location_update_time INTEGER")
            db.execSQL("UPDATE playlists SET sync_id = 'native_' || lower(hex(randomblob(16))), position = id")
            db.execSQL("CREATE UNIQUE INDEX playlists_sync_id ON playlists(sync_id)")
        }
        if (oldVersion < 4) {
            db.execSQL("ALTER TABLE playlists ADD COLUMN sync_meta TEXT")
            if (oldVersion >= 2) db.execSQL("ALTER TABLE songs ADD COLUMN sync_raw TEXT")
        }
        if (oldVersion < 5) createSyncTables(db)
    }

    suspend fun list(): List<Playlist> = withContext(Dispatchers.IO) {
        readableDatabase.rawQuery("SELECT id, name, sync_id, source, source_list_id FROM playlists ORDER BY position, id", null).use { c ->
            buildList { while (c.moveToNext()) add(Playlist(c.getLong(0), c.getString(1), c.getString(2), if (c.isNull(3)) null else c.getString(3), if (c.isNull(4)) null else c.getString(4))) }
        }
    }
    suspend fun create(name: String): Long = withContext(Dispatchers.IO) {
        require(name.isNotBlank())
        localMutationGate.withLock {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val id = insertPlaylist(db, name.trim())
            recordCreated(db, id, name.trim())
            db.setTransactionSuccessful()
            id
        } finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    suspend fun delete(id: Long): Int = withContext(Dispatchers.IO) {
        localMutationGate.withLock {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val syncId = findSyncId(db, id)
            require(syncId !in setOf("default", "love")) { "内置歌单不能删除" }
            val count = db.delete("playlists", "id = ?", arrayOf(id.toString()))
            if (count > 0 && syncId != null) enqueue(db, JSONObject().put("action", "list_remove").put("data", JSONArray().put(syncId)))
            db.setTransactionSuccessful(); count
        } finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    suspend fun songs(id: Long): List<Song> = withContext(Dispatchers.IO) {
        readableDatabase.rawQuery("SELECT media_id, uri, title, artist, duration, source, source_info FROM songs WHERE playlist_id = ? ORDER BY position, media_id",
            arrayOf(id.toString())).use { c ->
            buildList { while (c.moveToNext()) add(Song(c.getLong(0), Uri.parse(c.getString(1)), c.getString(2), c.getString(3), c.getLong(4), c.getString(5), c.getString(6))) }
        }
    }
    /** Snapshot is read in one transaction so a concurrent edit cannot produce a mixed list. */
    internal suspend fun syncSnapshot(localPaths: Map<Long, String>, forBackup: Boolean = false): JSONObject = withContext(Dispatchers.IO) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val snapshot = readSyncSnapshot(db, localPaths, forBackup)
            db.setTransactionSuccessful()
            snapshot
        } finally { db.endTransaction() }
    }
    private fun readSyncSnapshot(db: SQLiteDatabase, localPaths: Map<Long, String>, forBackup: Boolean = false): JSONObject {
            var defaultList = JSONArray(); var loveList = JSONArray()
            val userList = JSONArray()
            db.rawQuery("SELECT id, name, sync_id, source, source_list_id, location_update_time, sync_meta FROM playlists ORDER BY position, id", null).use { lists ->
                while (lists.moveToNext()) {
                    val songs = JSONArray()
                    db.rawQuery("SELECT media_id, uri, title, artist, duration, source, source_info, sync_raw FROM songs WHERE playlist_id = ? ORDER BY position, media_id", arrayOf(lists.getLong(0).toString())).use { rows ->
                        while (rows.moveToNext()) {
                            val song = Song(rows.getLong(0), Uri.parse(rows.getString(1)), rows.getString(2), rows.getString(3), rows.getLong(4), rows.getString(5), rows.getString(6))
                            require(forBackup || song.source != "local" || localPaths[song.id]?.startsWith("/") == true) { "无法确定本地歌曲路径：${song.title}" }
                            songs.put(if (rows.isNull(7)) LegacyBackup.musicInfo(song, localPaths) else JSONObject(rows.getString(7)))
                        }
                    }
                    val syncId = lists.getString(2)
                    when (syncId) {
                        "default" -> defaultList = songs
                        "love" -> loveList = songs
                        else -> {
                            val entry = if (lists.isNull(6)) JSONObject() else JSONObject(lists.getString(6))
                            entry.put("id", syncId).put("name", lists.getString(1))
                            if (!lists.isNull(3)) entry.put("source", lists.getString(3))
                            if (!lists.isNull(4)) entry.put("sourceListId", lists.getString(4))
                            entry.put("locationUpdateTime", if (lists.isNull(5)) JSONObject.NULL else lists.getLong(5))
                            userList.put(entry.put("list", songs))
                        }
                    }
                }
            }
            return JSONObject().put("defaultList", defaultList).put("loveList", loveList).put("userList", userList)
    }
    /** Validate the entire remote snapshot before atomically replacing the local lists. */
    internal suspend fun overwriteSyncSnapshot(snapshot: JSONObject, localByPath: Map<String, Song>) = withContext(Dispatchers.IO) {
        val parsed = parseSyncSnapshot(snapshot, localByPath)
        val db = writableDatabase
        db.beginTransaction()
        try { writeSyncSnapshot(db, parsed); db.setTransactionSuccessful() }
        finally { db.endTransaction() }
        signals.changes.tryEmit(Unit)
    }
    internal suspend fun applySyncAction(event: JSONObject, localByPath: Map<String, Song>) = withContext(Dispatchers.IO) {
        val localPaths = localByPath.entries.filter { it.key.startsWith("/") }.associate { it.value.id to it.key }
        val db = writableDatabase
        db.beginTransaction()
        try {
            val current = readSyncSnapshot(db, localPaths)
            val updated = SyncListReducer.apply(current, event)
            writeSyncSnapshot(db, parseSyncSnapshot(updated, localByPath))
            db.setTransactionSuccessful()
        } finally { db.endTransaction() }
        signals.changes.tryEmit(Unit)
    }
    private fun parseSyncSnapshot(snapshot: JSONObject, localByPath: Map<String, Song>): List<SyncList> {
        fun parseSongs(items: JSONArray): List<SyncSong> {
            val identities = mutableSetOf<Pair<String, Long>>()
            return buildList {
                for (i in 0 until items.length()) {
                    val raw = items.optJSONObject(i) ?: error("同步歌曲数据无效")
                    val song = LegacyBackup.convert(raw, localByPath) ?: error("无法导入同步歌曲：${raw.optString("name")}")
                    require(identities.add(song.source to song.id)) { "同步歌单包含无法区分的歌曲：${song.title}" }
                    add(SyncSong(song, raw.toString()))
                }
            }
        }
        val parsed = mutableListOf(
            SyncList("default", "试听列表", null, parseSongs(snapshot.getJSONArray("defaultList"))),
            SyncList("love", "我的收藏", null, parseSongs(snapshot.getJSONArray("loveList"))),
        )
        val ids = mutableSetOf("default", "love", "temp")
        val users = snapshot.getJSONArray("userList")
        for (i in 0 until users.length()) {
            val item = users.getJSONObject(i)
            val id = item.getString("id"); val name = item.getString("name")
            require(id.isNotBlank() && name.isNotBlank() && ids.add(id)) { "同步歌单标识无效或重复" }
            val metadata = JSONObject(item.toString()).apply { remove("list") }
            parsed.add(SyncList(id, name, metadata, parseSongs(item.getJSONArray("list"))))
        }
        return parsed
    }
    private fun writeSyncSnapshot(db: SQLiteDatabase, parsed: List<SyncList>) {
            val existing = mutableMapOf<String, Long>()
            db.rawQuery("SELECT sync_id, id FROM playlists", null).use { rows ->
                while (rows.moveToNext()) existing[rows.getString(0)] = rows.getLong(1)
            }
            val retained = parsed.map { it.id }.toSet()
            existing.filterKeys { it !in retained }.values.forEach { id ->
                db.delete("playlists", "id = ?", arrayOf(id.toString()))
            }
            parsed.forEachIndexed { position, list ->
                val metadata = list.metadata
                val values = ContentValues().apply {
                    put("name", list.name); put("sync_id", list.id); put("position", position)
                    putNull("source"); putNull("source_list_id"); putNull("location_update_time"); putNull("sync_meta")
                    if (metadata != null && !metadata.isNull("source")) metadata.optString("source").takeIf(String::isNotBlank)?.let { put("source", it) }
                    if (metadata != null && !metadata.isNull("sourceListId")) metadata.optString("sourceListId").takeIf(String::isNotBlank)?.let { put("source_list_id", it) }
                    if (metadata != null && metadata.has("locationUpdateTime") && !metadata.isNull("locationUpdateTime")) put("location_update_time", metadata.getLong("locationUpdateTime"))
                    if (metadata != null) put("sync_meta", metadata.toString())
                }
                val id = existing[list.id]?.also { existingId ->
                    check(db.update("playlists", values, "id = ?", arrayOf(existingId.toString())) == 1)
                    db.delete("songs", "playlist_id = ?", arrayOf(existingId.toString()))
                } ?: db.insertOrThrow("playlists", null, values)
                list.songs.forEachIndexed { songPosition, entry ->
                    check(insertSong(db, id, entry.song, songPosition.toLong(), entry.raw)) { "同步歌曲保存失败" }
                }
            }
    }
    suspend fun add(id: Long, song: Song): Boolean = withContext(Dispatchers.IO) {
        localMutationGate.withLock {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val top = preferences.addAtTop
            val position = db.rawQuery(if (top) "SELECT COALESCE(MIN(position), 1) - 1 FROM songs WHERE playlist_id = ?" else "SELECT COALESCE(MAX(position), -1) + 1 FROM songs WHERE playlist_id = ?", arrayOf(id.toString()))
                .use { c -> c.moveToFirst(); c.getLong(0) }
            val inserted = insertSong(db, id, song, position)
            if (inserted && tracking(db)) {
                val syncId = findSyncId(db, id) ?: error("歌单不存在")
                val data = JSONObject().put("id", syncId).put("musicInfos", JSONArray().put(outboxSong(song)))
                    .put("addMusicLocationType", if (top) "top" else "bottom")
                enqueue(db, JSONObject().put("action", "list_music_add").put("data", data))
            }
            db.setTransactionSuccessful()
            inserted
        } finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    suspend fun remove(id: Long, song: Song): Int = withContext(Dispatchers.IO) {
        localMutationGate.withLock {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val syncId = findSyncId(db, id)
            val raw = if (syncId != null && tracking(db)) db.rawQuery("SELECT sync_raw FROM songs WHERE playlist_id = ? AND source = ? AND media_id = ?", arrayOf(id.toString(), song.source, song.id.toString())).use { c ->
                if (!c.moveToFirst()) null else if (!c.isNull(0)) JSONObject(c.getString(0)) else outboxSong(song)
            } else null
            val count = db.delete("songs", "playlist_id = ? AND source = ? AND media_id = ?", arrayOf(id.toString(), song.source, song.id.toString()))
            if (count > 0 && syncId != null && raw != null) {
                val data = JSONObject().put("listId", syncId).put("musicInfos", JSONArray().put(raw))
                enqueue(db, JSONObject().put("action", "list_music_remove").put("data", data))
            }
            db.setTransactionSuccessful(); count
        } finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    private suspend fun <T> localEdit(block: (SQLiteDatabase) -> T): T = withContext(Dispatchers.IO) {
        localMutationGate.withLock {
            val db = writableDatabase; db.beginTransaction()
            try { val result = block(db); db.setTransactionSuccessful(); result }
            finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    private fun playlistInfo(db: SQLiteDatabase, id: Long): JSONObject = db.rawQuery(
        "SELECT sync_id,name,source,source_list_id,location_update_time,sync_meta FROM playlists WHERE id = ?", arrayOf(id.toString())).use { row ->
        check(row.moveToFirst()) { "歌单不存在" }
        val item = if (row.isNull(5)) JSONObject() else JSONObject(row.getString(5))
        item.put("id", row.getString(0)).put("name", row.getString(1))
        if (!row.isNull(2)) item.put("source", row.getString(2))
        if (!row.isNull(3)) item.put("sourceListId", row.getString(3))
        item.put("locationUpdateTime", if (row.isNull(4)) JSONObject.NULL else row.getLong(4)); item
    }
    suspend fun rename(id: Long, name: String) = localEdit { db ->
        require(name.isNotBlank()) { "歌单名称不能为空" }
        require(findSyncId(db, id) !in setOf("default", "love")) { "内置歌单名称由应用管理" }
        check(db.update("playlists", ContentValues().apply { put("name", name.trim()) }, "id = ?", arrayOf(id.toString())) == 1)
        enqueue(db, JSONObject().put("action", "list_update").put("data", JSONArray().put(playlistInfo(db, id))))
    }
    suspend fun movePlaylist(id: Long, position: Int) = localEdit { db ->
        val all = db.rawQuery("SELECT id,sync_id FROM playlists ORDER BY position,id", null).use { rows ->
            buildList { while (rows.moveToNext()) add(rows.getLong(0) to rows.getString(1)) }
        }
        val users = all.filter { it.second !in setOf("default", "love") }.toMutableList()
        val current = users.firstOrNull { it.first == id } ?: error("只有自建歌单可以排序")
        users.remove(current); val target = position.coerceIn(0, users.size); users.add(target, current)
        (all.filter { it.second in setOf("default", "love") } + users).forEachIndexed { index, list ->
            db.execSQL("UPDATE playlists SET position = ? WHERE id = ?", arrayOf<Any>(index, list.first))
        }
        enqueue(db, JSONObject().put("action", "list_update_position").put("data",
            JSONObject().put("ids", JSONArray().put(current.second)).put("position", target)))
    }
    suspend fun clear(id: Long) = localEdit { db ->
        val syncId = findSyncId(db, id) ?: error("歌单不存在")
        db.delete("songs", "playlist_id = ?", arrayOf(id.toString()))
        enqueue(db, JSONObject().put("action", "list_music_clear").put("data", JSONArray().put(syncId)))
    }
    internal suspend fun importOnline(list: OnlinePlaylist, songs: List<Song>): Long = localEdit { db ->
        val id = insertPlaylist(db, list.name)
        recordCreated(db, id, list.name)
        db.update("playlists", ContentValues().apply { put("source", list.source); put("source_list_id", list.id) }, "id = ?", arrayOf(id.toString()))
        enqueue(db, JSONObject().put("action", "list_update").put("data", JSONArray().put(playlistInfo(db, id))))
        overwriteSongs(db, id, songs); id
    }
    internal suspend fun loveList(): Long = localEdit { db ->
        db.rawQuery("SELECT id FROM playlists WHERE sync_id = 'love'", null).use { if (it.moveToFirst()) it.getLong(0) else null } ?: db.insertOrThrow("playlists", null, ContentValues().apply {
            put("sync_id", "love"); put("name", "我的收藏"); put("position", -1)
        })
    }
    internal suspend fun replaceSongs(id: Long, songs: List<Song>) = localEdit { db -> overwriteSongs(db, id, songs) }
    internal suspend fun restoreBackup(lists: List<ImportedList>): Int = localEdit { db ->
        var count = 0
        for (list in lists) {
            val syncId = list.syncId?.take(200) ?: "native_${UUID.randomUUID().toString().replace("-", "")}"
            val existing = db.rawQuery("SELECT id FROM playlists WHERE sync_id = ?", arrayOf(syncId)).use { if (it.moveToFirst()) it.getLong(0) else null }
            val id = existing ?: run {
                val newId = insertPlaylist(db, list.name)
                val metadata = list.metadata?.let(::JSONObject) ?: JSONObject()
                db.update("playlists", ContentValues().apply {
                    put("sync_id", syncId); put("sync_meta", metadata.toString())
                    if (metadata.has("source")) put("source", metadata.optString("source"))
                    if (metadata.has("sourceListId")) put("source_list_id", metadata.optString("sourceListId"))
                    if (!metadata.isNull("locationUpdateTime") && metadata.has("locationUpdateTime")) put("location_update_time", metadata.getLong("locationUpdateTime"))
                }, "id = ?", arrayOf(newId.toString()))
                if (syncId !in setOf("default", "love")) enqueue(db, JSONObject().put("action", "list_create").put("data", JSONObject().put("position", -1).put("listInfos", JSONArray().put(playlistInfo(db, newId)))))
                newId
            }
            db.delete("songs", "playlist_id = ?", arrayOf(id.toString()))
            val items = JSONArray()
            list.songs.forEachIndexed { index, song ->
                val raw = list.rawSongs.getOrNull(index)
                if (insertSong(db, id, song, index.toLong(), raw)) {
                    count++; if (tracking(db)) items.put(raw?.let(::JSONObject) ?: outboxSong(song))
                }
            }
            enqueue(db, JSONObject().put("action", "list_music_overwrite").put("data", JSONObject().put("listId", syncId).put("musicInfos", items)))
        }
        count
    }
    private fun overwriteSongs(db: SQLiteDatabase, id: Long, songs: List<Song>) {
        val syncId = findSyncId(db, id) ?: error("歌单不存在")
        db.delete("songs", "playlist_id = ?", arrayOf(id.toString()))
        val added = JSONArray()
        songs.forEachIndexed { position, song -> if (insertSong(db, id, song, position.toLong()) && tracking(db)) added.put(outboxSong(song)) }
        enqueue(db, JSONObject().put("action", "list_music_overwrite").put("data", JSONObject().put("listId", syncId).put("musicInfos", added)))
    }
    private fun rows(db: SQLiteDatabase, id: Long): List<LocalSongRow> = db.rawQuery(
        "SELECT media_id,uri,title,artist,duration,source,source_info,sync_raw FROM songs WHERE playlist_id = ? ORDER BY position,media_id",
        arrayOf(id.toString())).use { cursor -> buildList {
        while (cursor.moveToNext()) {
            val song = Song(cursor.getLong(0), Uri.parse(cursor.getString(1)), cursor.getString(2), cursor.getString(3), cursor.getLong(4), cursor.getString(5), cursor.getString(6))
            add(LocalSongRow(song, if (cursor.isNull(7)) null else cursor.getString(7)))
        }
    } }
    private fun eventSong(entry: LocalSongRow): JSONObject = entry.raw?.let(::JSONObject) ?: outboxSong(entry.song)
    private fun reorder(db: SQLiteDatabase, id: Long, items: List<LocalSongRow>) {
        items.forEachIndexed { position, entry ->
            db.execSQL("UPDATE songs SET position = ? WHERE playlist_id = ? AND source = ? AND media_id = ?",
                arrayOf<Any>(position, id, entry.song.source, entry.song.id))
        }
        val syncId = findSyncId(db, id) ?: error("歌单不存在")
        if (!tracking(db)) return
        enqueue(db, JSONObject().put("action", "list_music_update_position").put("data", JSONObject().put("listId", syncId)
            .put("position", 0).put("musicInfos", JSONArray().apply { items.forEach { put(eventSong(it)) } })))
    }
    suspend fun sortSongs(id: Long, field: String) = localEdit { db ->
        val values = rows(db, id)
        val sorted = when (field) {
            "title" -> values.sortedBy { it.song.title.lowercase(Locale.ROOT) }
            "artist" -> values.sortedBy { it.song.artist.lowercase(Locale.ROOT) }
            "duration" -> values.sortedBy { it.song.duration }
            "reverse" -> values.reversed()
            else -> error("不支持的排序方式")
        }
        reorder(db, id, sorted)
    }
    suspend fun moveSongPosition(id: Long, song: Song, position: Int) = localEdit { db ->
        val values = rows(db, id).toMutableList()
        val selected = values.firstOrNull { it.song.id == song.id && it.song.source == song.source } ?: error("歌曲不存在")
        values.remove(selected); values.add(position.coerceIn(0, values.size), selected); reorder(db, id, values)
    }
    internal suspend fun updateLocalMetadata(song: Song) = localEdit { db ->
        require(song.source == "local")
        val affected = db.rawQuery("SELECT DISTINCT playlist_id FROM songs WHERE source='local' AND media_id=?", arrayOf(song.id.toString())).use { c -> buildList {
            while (c.moveToNext()) add(c.getLong(0))
        } }
        affected.forEach { id ->
            val row = rows(db, id).first { it.song.source == "local" && it.song.id == song.id }
            val raw = row.raw?.let(::JSONObject)
            raw?.put("name", song.title)?.put("singer", song.artist)
            raw?.optJSONObject("meta")?.put("albumName", JSONObject(song.sourceInfo ?: "{}").optString("albumName"))
            db.update("songs", ContentValues().apply { put("title", song.title); put("artist", song.artist); put("source_info", song.sourceInfo); put("sync_raw", raw?.toString()) },
                "playlist_id=? AND source='local' AND media_id=?", arrayOf(id.toString(), song.id.toString()))
            if (tracking(db)) enqueue(db, JSONObject().put("action", "list_music_update").put("data", JSONArray().put(JSONObject()
                .put("id", findSyncId(db, id)).put("musicInfo", (raw ?: outboxSong(song)).apply { put("__nativeLocalMediaId", song.id) }))))
        }
    }
    suspend fun moveSong(fromId: Long, toId: Long, song: Song) = localEdit { db ->
        if (fromId == toId) return@localEdit
        val from = findSyncId(db, fromId) ?: error("原歌单不存在"); val to = findSyncId(db, toId) ?: error("目标歌单不存在")
        val selected = rows(db, fromId).firstOrNull { it.song.id == song.id && it.song.source == song.source } ?: error("歌曲不存在")
        val top = preferences.addAtTop
        val position = db.rawQuery(if (top) "SELECT COALESCE(MIN(position),0)-1 FROM songs WHERE playlist_id = ?" else "SELECT COALESCE(MAX(position),-1)+1 FROM songs WHERE playlist_id = ?", arrayOf(toId.toString())).use { it.moveToFirst(); it.getLong(0) }
        insertSong(db, toId, selected.song, position, selected.raw)
        db.delete("songs", "playlist_id = ? AND source = ? AND media_id = ?", arrayOf(fromId.toString(), song.source, song.id.toString()))
        if (tracking(db)) enqueue(db, JSONObject().put("action", "list_music_move").put("data", JSONObject().put("fromId", from).put("toId", to)
            .put("addMusicLocationType", if (top) "top" else "bottom").put("musicInfos", JSONArray().put(eventSong(selected)))))
    }
    internal suspend fun batchSongs(songs: List<Song>, fromId: Long?, toId: Long?, removeOriginal: Boolean): Int = localEdit { db ->
        require(songs.isNotEmpty() && (toId != null || removeOriginal && fromId != null)) { "批量操作缺少歌曲或目标" }
        if (fromId != null && fromId == toId) return@localEdit 0
        val from = fromId?.let { findSyncId(db, it) ?: error("原歌单不存在") }
        val to = toId?.let { findSyncId(db, it) ?: error("目标歌单不存在") }
        val original = fromId?.let { rows(db, it).associateBy { row -> row.song.source to row.song.id } }
        val selected = songs.distinctBy { it.source to it.id }.map { song ->
            if (original == null) LocalSongRow(song, null) else original[song.source to song.id] ?: error("所选歌曲已从歌单移除")
        }
        val items = JSONArray()
        val top = preferences.addAtTop
        var position = if (toId == null) 0L else db.rawQuery(if (top) "SELECT COALESCE(MIN(position),0)-${selected.size} FROM songs WHERE playlist_id = ?" else "SELECT COALESCE(MAX(position),-1)+1 FROM songs WHERE playlist_id = ?", arrayOf(toId.toString())).use { it.moveToFirst(); it.getLong(0) }
        selected.forEach { entry ->
            if (toId != null) insertSong(db, toId, entry.song, position++, entry.raw)
            if (removeOriginal && fromId != null) db.delete("songs", "playlist_id = ? AND source = ? AND media_id = ?", arrayOf(fromId.toString(), entry.song.source, entry.song.id.toString()))
            if (tracking(db)) items.put(eventSong(entry))
        }
        if (toId != null && removeOriginal && fromId != null) enqueue(db, JSONObject().put("action", "list_music_move").put("data", JSONObject()
            .put("fromId", from).put("toId", to).put("addMusicLocationType", if (top) "top" else "bottom").put("musicInfos", items)))
        else {
            if (toId != null) enqueue(db, JSONObject().put("action", "list_music_add").put("data", JSONObject().put("id", to).put("addMusicLocationType", if (top) "top" else "bottom").put("musicInfos", items)))
            if (removeOriginal && fromId != null) enqueue(db, JSONObject().put("action", "list_music_remove").put("data", JSONObject().put("listId", from).put("musicInfos", items)))
        }
        selected.size
    }
    suspend fun importLists(lists: List<ImportedList>): Int = withContext(Dispatchers.IO) {
        localMutationGate.withLock {
        val db = writableDatabase
        var inserted = 0
        db.beginTransaction()
        try {
            lists.forEach { list ->
                val id = insertPlaylist(db, list.name)
                recordCreated(db, id, list.name)
                val added = JSONArray()
                list.songs.forEachIndexed { position, song ->
                    if (insertSong(db, id, song, position.toLong())) {
                        inserted++
                        if (tracking(db)) added.put(outboxSong(song))
                    }
                }
                if (added.length() > 0) {
                    val data = JSONObject().put("id", findSyncId(db, id)).put("musicInfos", added).put("addMusicLocationType", "bottom")
                    enqueue(db, JSONObject().put("action", "list_music_add").put("data", data))
                }
            }
            db.setTransactionSuccessful()
            inserted
        } finally { db.endTransaction(); notifyLocalChanged() }
        }
    }
    private fun insertPlaylist(db: SQLiteDatabase, name: String): Long {
        val position = db.rawQuery("SELECT COALESCE(MAX(position), -1) + 1 FROM playlists", null).use { it.moveToFirst(); it.getLong(0) }
        return db.insertOrThrow("playlists", null, ContentValues().apply {
            put("name", name); put("sync_id", "native_${UUID.randomUUID().toString().replace("-", "")}"); put("position", position)
        })
    }
    internal suspend fun setSyncTracking(enabled: Boolean) = withContext(Dispatchers.IO) {
        writableDatabase.update("sync_config", ContentValues().apply { put("tracking", if (enabled) 1 else 0) }, "id = 1", null)
        signals.outgoing.tryEmit(Unit)
    }
    internal suspend fun pendingSyncActions(localPaths: Map<Long, String>, limit: Int = 100): List<PendingSyncAction> = withContext(Dispatchers.IO) {
        require(limit in 1..1000)
        readableDatabase.rawQuery("SELECT sequence, event FROM sync_outbox ORDER BY sequence LIMIT ?", arrayOf(limit.toString())).use { rows ->
            buildList {
                while (rows.moveToNext()) add(PendingSyncAction(rows.getLong(0), materializeAction(JSONObject(rows.getString(1)), localPaths)))
            }
        }
    }
    internal suspend fun acknowledgeSyncAction(sequence: Long) = withContext(Dispatchers.IO) {
        writableDatabase.delete("sync_outbox", "sequence = ?", arrayOf(sequence.toString()))
    }
    internal suspend fun syncOutboxWatermark(): Long = withContext(Dispatchers.IO) {
        readableDatabase.rawQuery("SELECT COALESCE(MAX(sequence), 0) FROM sync_outbox", null).use { it.moveToFirst(); it.getLong(0) }
    }
    internal suspend fun acknowledgeSyncThrough(sequence: Long) = withContext(Dispatchers.IO) {
        writableDatabase.delete("sync_outbox", "sequence <= ?", arrayOf(sequence.toString()))
    }
    private fun tracking(db: SQLiteDatabase): Boolean = db.rawQuery("SELECT tracking FROM sync_config WHERE id = 1", null).use { it.moveToFirst() && it.getInt(0) != 0 }
    private fun enqueue(db: SQLiteDatabase, event: JSONObject) {
        if (tracking(db)) db.insertOrThrow("sync_outbox", null, ContentValues().apply { put("event", event.toString()) })
    }
    private fun findSyncId(db: SQLiteDatabase, id: Long): String? = db.rawQuery("SELECT sync_id FROM playlists WHERE id = ?", arrayOf(id.toString())).use { if (it.moveToFirst()) it.getString(0) else null }
    private fun recordCreated(db: SQLiteDatabase, id: Long, name: String) {
        if (!tracking(db)) return
        val info = JSONObject().put("id", findSyncId(db, id)).put("name", name).put("locationUpdateTime", JSONObject.NULL)
        val data = JSONObject().put("position", -1).put("listInfos", JSONArray().put(info))
        enqueue(db, JSONObject().put("action", "list_create").put("data", data))
    }
    private fun outboxSong(song: Song): JSONObject = LegacyBackup.musicInfo(song, emptyMap()).apply {
        if (song.source == "local") put("__nativeLocalMediaId", song.id)
    }
    private fun materializeAction(event: JSONObject, paths: Map<Long, String>): JSONObject {
        if (event.optString("action") == "list_music_update") {
            val items = event.getJSONArray("data")
            for (index in 0 until items.length()) {
                val song = items.getJSONObject(index).getJSONObject("musicInfo")
                if (song.has("__nativeLocalMediaId")) {
                    val path = paths[song.getLong("__nativeLocalMediaId")]?.takeIf { it.startsWith("/") } ?: error("无法确定待同步本地歌曲路径")
                    song.remove("__nativeLocalMediaId"); song.put("id", "local_$path")
                    song.getJSONObject("meta").put("songId", path).put("filePath", path).put("ext", path.substringAfterLast('.', ""))
                }
            }
            return event
        }
        if (event.optString("action") !in setOf("list_music_add", "list_music_remove", "list_music_move", "list_music_update_position", "list_music_overwrite")) return event
        val data = event.getJSONObject("data")
        val input = data.getJSONArray("musicInfos")
        val output = JSONArray()
        for (i in 0 until input.length()) {
            val song = input.getJSONObject(i)
            if (song.has("__nativeLocalMediaId")) {
                val id = song.getLong("__nativeLocalMediaId")
                val path = paths[id]?.takeIf { it.startsWith("/") } ?: error("无法确定待同步本地歌曲路径：${song.optString("name")}")
                song.remove("__nativeLocalMediaId")
                song.put("id", "local_$path")
                song.getJSONObject("meta").put("songId", path).put("filePath", path).put("ext", path.substringAfterLast('.', ""))
            }
            output.put(if (event.getString("action") in setOf("list_music_remove", "list_music_update_position")) song.getString("id") else song)
        }
        data.remove("musicInfos")
        data.put(if (event.getString("action") in setOf("list_music_remove", "list_music_update_position")) "ids" else "musicInfos", output)
        return event
    }
    private fun insertSong(db: SQLiteDatabase, id: Long, song: Song, position: Long, syncRaw: String? = null): Boolean =
        db.insertWithOnConflict("songs", null, ContentValues().apply {
            put("playlist_id", id); put("media_id", song.id); put("uri", song.uri.toString())
            put("title", song.title); put("artist", song.artist); put("duration", song.duration); put("position", position)
            put("source", song.source); put("source_info", song.sourceInfo)
            put("sync_raw", syncRaw)
        }, SQLiteDatabase.CONFLICT_IGNORE) != -1L
}
