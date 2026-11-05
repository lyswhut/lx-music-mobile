package cn.toside.music.nativeapp

import org.json.JSONObject

internal enum class SyncFeature(val key: String, val label: String) {
    LIST("list", "歌单"), DISLIKE("dislike", "不喜欢列表");

    val modes: List<String> get() = listOf("merge_local_remote", "merge_remote_local", "overwrite_local_remote", "overwrite_remote_local") +
        (if (this == LIST) listOf("overwrite_local_remote_full", "overwrite_remote_local_full") else emptyList()) + "cancel"

    companion object {
        fun negotiate(versions: JSONObject): Set<SyncFeature> = entries.filterTo(linkedSetOf()) {
            val version = versions.opt(it.key)
            version is Number && version.toDouble() == 1.0
        }
            .also { check(it.isNotEmpty()) { "同步服务没有兼容的同步功能" } }
        fun configuration(features: Set<SyncFeature>): JSONObject = JSONObject().apply {
            features.forEach { put(it.key, JSONObject().put("skipSnapshot", false)) }
        }
    }
}
