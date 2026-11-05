package cn.toside.music.nativeapp.ui

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.Artwork
import cn.toside.music.nativeapp.data.Song
import cn.toside.music.nativeapp.online.MusicComment
import cn.toside.music.nativeapp.online.OnlineComments

import android.app.Activity
import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.TextView
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

internal fun showComments(activity: Activity, scope: CoroutineScope, song: Song, reply: MusicComment? = null) {
    val api = OnlineComments()
    var hot = true; var page = 0; var items = emptyList<MusicComment>(); var job: Job? = null
    val density = activity.resources.displayMetrics.density
    fun dp(value: Int) = (density * value).toInt()
    val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL }
    val mode = Button(activity).apply { text = if (reply == null) activity.getString(R.string.ui_edcdd4eb5145) else activity.getString(R.string.ui_cf945e21ddef) }
    val status = TextView(activity).apply { setPadding(dp(16), dp(8), dp(16), dp(8)) }
    val list = ListView(activity)
    val more = Button(activity).apply { text = activity.getString(R.string.ui_af90a08fec8e); isEnabled = false }
    if (reply == null) content.addView(mode)
    content.addView(status); content.addView(list, LinearLayout.LayoutParams(-1, dp(320))); content.addView(more)
    val dialog = AlertDialog.Builder(activity).setTitle(reply?.let { activity.getString(R.string.ui_04348c8824f5, java.lang.String.valueOf(it.name)) } ?: activity.getString(R.string.ui_7270f21b0d99, java.lang.String.valueOf(song.title)))
        .setView(content).setNegativeButton(activity.getString(R.string.ui_3fd47edce45b), null).create()
    fun date(value: String): String = value.toLongOrNull()?.let { number ->
        DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(if (number < 10_000_000_000L) number * 1000 else number))
    } ?: value
    fun row(item: MusicComment): String = buildString {
        append(item.name).append("  ♥ ").append(item.likes)
        if (item.date.isNotBlank()) append("\n").append(date(item.date))
        if (item.location.isNotBlank()) append(" · ").append(item.location)
        append("\n").append(item.text)
        item.replies.forEach { append("\n↳ ").append(it.name).append(": ").append(it.text) }
        if (item.images.isNotEmpty()) append(activity.getString(R.string.ui_148bcfd6d534, java.lang.String.valueOf(item.images.size)))
        if (item.replyCount > 0) append(activity.getString(R.string.ui_ecb8ffea43a2)).append(item.replyCount)
    }
    fun render() {
        val position = list.firstVisiblePosition; val top = list.getChildAt(0)?.top ?: 0
        list.adapter = ArrayAdapter(activity, android.R.layout.simple_list_item_1, items.map(::row))
        list.setSelectionFromTop(position, top)
    }
    fun load(append: Boolean) {
        job?.cancel(); more.isEnabled = false; status.text = activity.getString(R.string.ui_21bd738e0d71)
        if (!append) { page = 0; items = emptyList(); render() }
        val next = if (append) page + 1 else 1
        job = scope.launch {
            try {
                val result = api.load(song, hot, next, reply?.id)
                items = if (append) (items + result.comments).distinctBy { it.id } else result.comments
                page = next; render(); status.text = activity.getString(R.string.ui_65b9115c0973, java.lang.String.valueOf(items.size), java.lang.String.valueOf(result.total.takeUnless { it == Long.MAX_VALUE } ?: activity.getString(R.string.ui_4d8c1c5b4283)))
                more.isEnabled = result.hasMore; more.text = if (result.hasMore) activity.getString(R.string.ui_af90a08fec8e) else activity.getString(R.string.ui_06d9bbeb3af9)
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = activity.getString(R.string.ui_e6e79ef974ed, java.lang.String.valueOf(e.localizedMessage)); more.text = activity.getString(R.string.ui_b8784c8dd563); more.isEnabled = true }
        }
    }
    fun image(url: String) {
        if (!url.startsWith("https://") && !url.startsWith("http://")) return
        val view = ImageView(activity).apply { adjustViewBounds = true; contentDescription = activity.getString(R.string.ui_5805f0b9bcce) }
        var imageJob: Job? = null
        val preview = AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_5805f0b9bcce)).setView(view).setNegativeButton(activity.getString(R.string.ui_3fd47edce45b), null)
            .setNeutralButton(activity.getString(R.string.ui_b231587899f3)) { _, _ -> runCatching { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }.create()
        preview.setOnDismissListener { imageJob?.cancel() }; preview.show()
        imageJob = scope.launch {
            try { view.setImageBitmap(Artwork(activity).loadUrl(url)) }
            catch (e: CancellationException) { throw e }
            catch (_: Exception) { preview.setTitle(activity.getString(R.string.ui_7206c39ccf2e)) }
        }
    }
    list.setOnItemClickListener { _, _, index, _ ->
        val item = items[index]
        val images = (item.images + item.replies.flatMap { it.images }).distinct()
        val actions = listOf(activity.getString(R.string.ui_95d495fa65a5)) + (if (item.replies.isNotEmpty()) listOf(activity.getString(R.string.ui_bec9edaffccd)) else emptyList()) +
            (if (item.replyCount > 0 && song.source in setOf("kg", "mg")) listOf(activity.getString(R.string.ui_8273d8d3de88)) else emptyList()) + images.mapIndexed { i, _ -> activity.getString(R.string.ui_475d38917292, java.lang.String.valueOf(i + 1)) }
        AlertDialog.Builder(activity).setTitle(item.name).setItems(actions.toTypedArray()) { _, which ->
            when (actions[which]) {
                activity.getString(R.string.ui_95d495fa65a5) -> (activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText(activity.getString(R.string.ui_6849b8254d20), row(item)))
                activity.getString(R.string.ui_bec9edaffccd) -> AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_cf945e21ddef)).setItems(item.replies.map(::row).toTypedArray(), null).setNegativeButton(activity.getString(R.string.ui_3fd47edce45b), null).show()
                activity.getString(R.string.ui_8273d8d3de88) -> showComments(activity, scope, song, item)
                else -> image(images[which - (actions.size - images.size)])
            }
        }.show()
    }
    mode.setOnClickListener { hot = !hot; mode.text = if (hot) activity.getString(R.string.ui_edcdd4eb5145) else activity.getString(R.string.ui_cd807c58b9cf); load(false) }
    more.setOnClickListener { load(page > 0) }
    dialog.setOnDismissListener { job?.cancel() }; dialog.show()
    dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    load(false)
}
