package cn.toside.music.nativeapp.online

import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.ui.CommentEmoji
import cn.toside.music.nativeapp.utils.NativeHttp

import android.text.Html
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.net.URLDecoder

internal data class MusicComment(val id: String, val name: String, val text: String, val date: String = "", val likes: Long = 0,
    val location: String = "", val images: List<String> = emptyList(), val replies: List<MusicComment> = emptyList(), val replyCount: Int = 0)
internal data class CommentPage(val comments: List<MusicComment>, val total: Long, val hasMore: Boolean)

/** Public read-only comment protocols ported from the original five providers. Each screen owns its cursors. */
internal class OnlineComments {
    private var wyCursor = System.currentTimeMillis().toString()
    private var mgCursor = ""
    private val resolvedIds = mutableMapOf<String, String>()
    suspend fun load(song: Song, hot: Boolean, page: Int = 1, reply: String? = null): CommentPage {
        require(page > 0)
        val info = JSONObject(song.sourceInfo ?: error("本地歌曲没有平台评论"))
        val id = info.optString("songmid"); val size = 20
        val result: JSONObject
        when (song.source) {
            "kw" -> {
                val data = NativeHttp.json("http://ncomment.kuwo.cn/com.s?f=web&type=${if (hot) "get_rec_comment" else "get_comment"}&aapiver=1&prod=kwplayer_ar_10.5.2.0&digest=15&sid=${NativeHttp.encode(id)}&start=${size * (page - 1)}&msgflag=1&count=$size&newver=3&uid=0",
                    headers = mapOf("User-Agent" to "Dalvik/2.1.0 (Linux; U; Android 9;)"))
                check(data.optString("code") == "200") { "获取评论失败" }; result = data
            }
            "kg" -> {
                val hash = info.getString("hash")
                if (reply != null) {
                    val child = if (id.length == 32) info.optString("audioId").substringBefore('_') else id
                    result = NativeHttp.json("http://comment.service.kugou.com/index.php?r=commentsv2/getReplyWithLike&code=fc4be23b4e972707f36b8a828a93ba8a&p=$page&pagesize=$size&ver=1.01&clientver=8373&kugouid=687373022&need_show_image=1&appid=1001&childrenid=${NativeHttp.encode(child)}&tid=${NativeHttp.encode(reply)}")
                } else {
                    val params = "dfid=0&mid=16249512204336365674023395779019&clienttime=${System.currentTimeMillis()}&uuid=0&extdata=$hash&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&schash=$hash&clientver=11409&p=$page&clienttoken=&pagesize=$size&ver=10&kugouid=0"
                    val key = "OIlwieks28dk2k092lksi2UIkp"
                    val sign = MessageDigest.getInstance("MD5").digest((key + params.split('&').sorted().joinToString("") + key).toByteArray())
                        .joinToString("") { "%02x".format(it.toInt() and 255) }
                    result = NativeHttp.json("http://m.comment.service.kugou.com/r/v1/rank/${if (hot) "topliked" else "newest"}?$params&signature=$sign")
                }
                check(result.optInt("err_code", -1) == 0) { "获取评论失败" }
            }
            "wy" -> {
                val rid = "R_SO_4_$id"
                result = if (hot) NeteaseApi().publicRequest("/weapi/v1/resource/hotcomments/$rid", JSONObject().put("rid", rid)
                    .put("limit", size).put("offset", (page - 1) * size).put("beforeTime", System.currentTimeMillis().toString()))
                else {
                    if (page == 1) wyCursor = System.currentTimeMillis().toString()
                    NeteaseApi().publicRequest("/weapi/comment/resource/comments/get", JSONObject().put("rid", rid).put("threadId", rid)
                        .put("cursor", wyCursor).put("offset", 0).put("orderType", 1).put("pageNo", page).put("pageSize", size))
                        .also { wyCursor = it.getJSONObject("data").optString("cursor") }
                }
            }
            "tx" -> {
                val songId = resolveTx(info)
                result = if (hot) NativeHttp.json("https://u.y.qq.com/cgi-bin/musicu.fcg", JSONObject()
                    .put("comm", JSONObject().put("cv", 4747474).put("ct", 24).put("format", "json").put("uin", 0))
                    .put("req", JSONObject().put("module", "music.globalComment.CommentRead").put("method", "GetHotCommentList")
                        .put("param", JSONObject().put("BizType", 1).put("BizId", songId).put("LastCommentSeqNo", "").put("PageSize", size)
                            .put("PageNum", page - 1).put("HotType", 1).put("WithAirborne", 0).put("PicEnable", 1))), mapOf("Referer" to "https://y.qq.com/"))
                else NativeHttp.json("http://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg", form = mapOf("uin" to "0", "format" to "json",
                    "cid" to "205360772", "reqtype" to "2", "biztype" to "1", "topid" to songId, "cmd" to "8", "needmusiccrit" to "1", "pagenum" to (page - 1).toString(), "pagesize" to size.toString()))
                check(result.optInt("code", -1) == 0 && (!hot || result.getJSONObject("req").optInt("code", -1) == 0)) { "获取评论失败" }
            }
            "mg" -> {
                val songId = resolveMg(info)
                if (page == 1) mgCursor = ""
                val query = if (reply != null) "/${NativeHttp.encode(reply)}/v1.0?queryType=2&start=${(page - 1) * size}"
                    else "/v1.0?queryType=${if (hot) 2 else 1}&${if (hot) "hotCommentStart=${(page - 1) * size}" else "commentId=${NativeHttp.encode(mgCursor)}"}"
                result = NativeHttp.json("https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack$query&pageSize=$size&resourceId=${NativeHttp.encode(songId)}&resourceType=2")
                check(result.optString("code") == "000000") { "获取评论失败" }
            }
            else -> error("不支持的评论平台")
        }
        val parsed = parse(song.source, result, hot, page, size, reply != null)
        if (song.source == "mg" && !hot && reply == null) mgCursor = parsed.comments.lastOrNull()?.id ?: ""
        return parsed
    }
    private suspend fun resolveTx(info: JSONObject): String {
        info.optString("songId").takeIf { it.isNotBlank() && it != "0" }?.let { return it }
        val mid = info.getString("songmid"); resolvedIds["tx:$mid"]?.let { return it }
        val data = NativeHttp.json("https://u.y.qq.com/cgi-bin/musicu.fcg", JSONObject().put("comm", JSONObject().put("ct", "19").put("cv", "1859").put("uin", "0"))
            .put("req", JSONObject().put("module", "music.pf_song_detail_svr").put("method", "get_song_detail_yqq")
                .put("param", JSONObject().put("song_type", 0).put("song_mid", mid))))
        return data.getJSONObject("req").getJSONObject("data").getJSONObject("track_info").getString("id").also { resolvedIds["tx:$mid"] = it }
    }
    private suspend fun resolveMg(info: JSONObject): String {
        val mid = info.getString("songmid")
        if (mid != info.optString("copyrightId")) return mid
        resolvedIds["mg:$mid"]?.let { return it }
        val data = NativeHttp.json("https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2", form = mapOf("resourceId" to mid))
        return data.getJSONArray("resource").getJSONObject(0).getString("songId").also { resolvedIds["mg:$mid"] = it }
    }
    internal fun parse(source: String, data: JSONObject, hot: Boolean, page: Int, size: Int = 20, reply: Boolean = false): CommentPage {
        val items: JSONArray?; val total: Long
        when (source) {
            "kw" -> { items = data.optJSONArray(if (hot) "hot_comments" else "comments"); total = data.optLong(if (hot) "hot_comments_counts" else "comments_counts") }
            "kg" -> { items = data.optJSONArray("list"); total = data.optLong("count", Long.MAX_VALUE) }
            "wy" -> { items = if (hot) data.optJSONArray("hotComments") else data.optJSONObject("data")?.optJSONArray("comments"); total = if (hot) data.optLong("total") else data.getJSONObject("data").optLong("totalCount") }
            "tx" -> {
                val value = if (hot) data.getJSONObject("req").getJSONObject("data").getJSONObject("CommentList") else data.getJSONObject("comment")
                items = value.optJSONArray(if (hot) "Comments" else "commentlist"); total = value.optLong(if (hot) "Total" else "commenttotal")
            }
            "mg" -> {
                val value = data.getJSONObject("data")
                items = if (reply) value.optJSONObject("mainCommentItem")?.optJSONArray("replyComments") else value.optJSONArray(if (hot) "hotComments" else "comments")
                total = value.optLong(if (reply) "replyTotalCount" else if (hot) "cfgHotCount" else "commentNums")
            }
            else -> error("不支持的评论平台")
        }
        val comments = objects(items).map { parseItem(source, it, hot) }
        return CommentPage(comments, total, comments.isNotEmpty() && comments.size >= size && page.toLong() * size < total)
    }
    private fun parseItem(source: String, item: JSONObject, hot: Boolean): MusicComment {
        fun text(key: String) = decode(item.optString(key))
        return when (source) {
            "kw" -> MusicComment(item.optString("id"), text("u_name"), text("msg"), item.optString("time"), item.optLong("like_num"),
                images = item.optString("mpic").takeIf { it.isNotBlank() }?.let { listOf(runCatching { URLDecoder.decode(it, "UTF-8") }.getOrDefault(it)) } ?: emptyList(),
                replies = objects(item.optJSONArray("child_comments")).map { parseItem(source, it, hot) })
            "kg" -> {
                var content = text("content")
                objects(item.optJSONArray("atlist")).forEach { content = content.replace("[at=${it.optString("id")}]", "@${it.optString("name")} ") }
                val value = MusicComment(item.optString("id"), text("user_name"), content, item.optString("addtime"), item.optJSONObject("like")?.optLong("likenum") ?: 0,
                    item.optString("location"), objects(item.optJSONArray("images")).map { it.optString("url") }, replyCount = item.optInt("reply_num"))
                if (item.optString("pcontent").isBlank()) value else MusicComment(value.id, text("puser"), text("pcontent"), replies = listOf(value))
            }
            "wy" -> {
                val user = item.optJSONObject("user") ?: JSONObject()
                val value = MusicComment(item.optString("commentId"), decode(user.optString("nickname")), text("content"), item.optString("time"), item.optLong("likedCount"), item.optJSONObject("ipLocation")?.optString("location") ?: "")
                val parent = item.optJSONArray("beReplied")?.optJSONObject(0)
                if (parent == null) value else MusicComment(parent.optString("beRepliedCommentId"), decode(parent.optJSONObject("user")?.optString("nickname") ?: ""), decode(parent.optString("content")), replies = listOf(value))
            }
            "tx" -> if (hot) MusicComment("${item.optString("SeqNo")}_${item.optString("CmId")}", text("Nick"), text("Content"), item.optString("PubTime"), item.optLong("PraiseNum"),
                item.optString("Location"), item.optString("Pic").takeIf { it.isNotBlank() }?.let(::listOf) ?: emptyList(), objects(item.optJSONArray("SubComments")).map { parseItem(source, it, true) })
            else MusicComment("${item.optString("rootcommentid")}_${item.optString("commentid")}", text("rootcommentnick").removePrefix("@"), text("rootcommentcontent"), item.optString("time"), item.optLong("praisenum"),
                replies = objects(item.optJSONArray("middlecommentcontent")).reversed().map { MusicComment(it.optString("subcommentid"), decode(it.optString("replynick")).removePrefix("@"), decode(it.optString("subcommentcontent"))) })
            "mg" -> {
                val user = item.optJSONObject("user") ?: JSONObject()
                MusicComment(item.optString("commentId").ifBlank { item.optString("replyId") }, decode(user.optString("nickName")), text("commentInfo").ifBlank { text("replyInfo") },
                    item.optString("commentTime").ifBlank { item.optString("replyTime") }, item.optJSONObject("opNumItem")?.optLong("thumbNum") ?: 0,
                    replies = objects(item.optJSONArray("replyComments")).map { parseItem(source, it, hot) }, replyCount = item.optInt("replyTotalCount"))
            }
            else -> error("不支持的评论平台")
        }
    }
    private fun objects(a: JSONArray?): List<JSONObject> = if (a == null) emptyList() else (0 until a.length()).mapNotNull { a.optJSONObject(it) }
    private fun decode(value: String): String = Html.fromHtml(CommentEmoji.decode(value).replace("\\n", "\n").replace("\n", "<br>"), Html.FROM_HTML_MODE_LEGACY).toString()
}
