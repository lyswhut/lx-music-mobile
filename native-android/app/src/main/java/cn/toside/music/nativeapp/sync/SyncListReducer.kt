package cn.toside.music.nativeapp.sync

import org.json.JSONArray
import org.json.JSONObject

/** Applies one v4 list event to a copy; invalid events leave the original untouched. */
internal object SyncListReducer {
    fun apply(snapshot: JSONObject, event: JSONObject, now: Long = System.currentTimeMillis()): JSONObject {
        val action = event.getString("action")
        if (action == "list_data_overwrite") return JSONObject(event.getJSONObject("data").toString())
        val result = JSONObject(snapshot.toString())
        val users = result.getJSONArray("userList").objects().toMutableList()
        val data = event.get("data")
        fun findUser(id: String) = users.firstOrNull { it.optString("id") == id }
        fun list(id: String): MutableList<JSONObject> = when (id) {
            "default" -> result.getJSONArray("defaultList").objects().toMutableList()
            "love" -> result.getJSONArray("loveList").objects().toMutableList()
            else -> (findUser(id) ?: error("同步歌单不存在：$id")).getJSONArray("list").objects().toMutableList()
        }
        fun setList(id: String, items: List<JSONObject>) {
            val array = JSONArray(items)
            when (id) {
                "default" -> result.put("defaultList", array)
                "love" -> result.put("loveList", array)
                else -> (findUser(id) ?: error("同步歌单不存在：$id")).put("list", array)
            }
        }
        fun add(id: String, items: List<JSONObject>, where: String) {
            val current = list(id)
            val existing = current.map { it.getString("id") }.toMutableSet()
            val fresh = items.filter { existing.add(it.getString("id")) }
            if (where == "top") current.addAll(0, fresh) else current.addAll(fresh)
            setList(id, current)
        }
        fun remove(id: String, ids: Set<String>) = setList(id, list(id).filterNot { it.getString("id") in ids })
        fun reorder(items: MutableList<JSONObject>, ids: List<String>, position: Int): List<JSONObject> {
            require(position >= 0 && ids.size == ids.distinct().size) { "同步排序位置无效" }
            val byId = items.associateBy { it.getString("id") }
            val moved = ids.map { byId[it] ?: error("同步排序项目不存在：$it") }
            val idSet = ids.toSet()
            val rest = items.filterNot { it.getString("id") in idSet }.toMutableList()
            rest.addAll(position.coerceAtMost(rest.size), moved)
            return rest
        }
        when (action) {
            "list_create" -> {
                val obj = data as JSONObject; val position = obj.getInt("position")
                for (item in obj.getJSONArray("listInfos").objects()) {
                    val id = item.getString("id")
                    require(id !in setOf("default", "love", "temp")) { "同步歌单标识无效" }
                    if (findUser(id) != null) continue
                    val created = JSONObject(item.toString()).put("list", JSONArray())
                    if (position < 0 || position >= users.size) users.add(created) else users.add(position, created)
                }
            }
            "list_remove" -> {
                val ids = (data as JSONArray).strings().toSet()
                users.removeAll { it.getString("id") in ids }
            }
            "list_update" -> for (item in (data as JSONArray).objects()) {
                val target = findUser(item.getString("id")) ?: continue
                for (key in listOf("name", "source", "sourceListId", "locationUpdateTime")) {
                    if (item.has(key)) target.put(key, item.get(key)) else target.remove(key)
                }
            }
            "list_update_position" -> {
                val obj = data as JSONObject; val ids = obj.getJSONArray("ids").strings()
                val sorted = reorder(users, ids, obj.getInt("position"))
                ids.forEach { id -> sorted.first { it.getString("id") == id }.put("locationUpdateTime", now) }
                users.clear(); users.addAll(sorted)
            }
            "list_music_add" -> {
                val obj = data as JSONObject
                add(obj.getString("id"), obj.getJSONArray("musicInfos").objects(), obj.optString("addMusicLocationType"))
            }
            "list_music_move" -> {
                val obj = data as JSONObject; val items = obj.getJSONArray("musicInfos").objects()
                remove(obj.getString("fromId"), items.map { it.getString("id") }.toSet())
                add(obj.getString("toId"), items, obj.optString("addMusicLocationType"))
            }
            "list_music_remove" -> {
                val obj = data as JSONObject
                remove(obj.getString("listId"), obj.getJSONArray("ids").strings().toSet())
            }
            "list_music_update" -> for (item in (data as JSONArray).objects()) {
                val id = item.getString("id"); val update = item.getJSONObject("musicInfo")
                val songs = list(id); val target = songs.firstOrNull { it.optString("id") == update.getString("id") } ?: continue
                for (key in listOf("name", "singer", "source", "interval", "meta")) {
                    if (update.has(key)) target.put(key, update.get(key)) else target.remove(key)
                }
                setList(id, songs)
            }
            "list_music_update_position" -> {
                val obj = data as JSONObject; val id = obj.getString("listId")
                setList(id, reorder(list(id), obj.getJSONArray("ids").strings(), obj.getInt("position")))
            }
            "list_music_overwrite" -> {
                val obj = data as JSONObject
                setList(obj.getString("listId"), obj.getJSONArray("musicInfos").objects())
            }
            "list_music_clear" -> (data as JSONArray).strings().forEach { setList(it, emptyList()) }
            else -> error("未知同步操作：$action")
        }
        return result.put("userList", JSONArray(users))
    }
    private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }
    private fun JSONArray.strings(): List<String> = (0 until length()).map { getString(it) }
}
