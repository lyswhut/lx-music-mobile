package cn.toside.music.nativeapp

import android.app.Activity
import android.app.AlertDialog
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import java.util.Locale
import kotlin.math.roundToInt

internal class PlayerSettingsDialog(
    private val activity: Activity,
    private val settings: PlayerSettings,
    private val offsets: LyricOffsets,
    private val landscape: Boolean,
    private val song: Song?,
    private val setRate: (Float) -> Unit,
    private val setVolume: (Float) -> Unit,
    private val appearanceChanged: () -> Unit,
    private val offsetChanged: (Song) -> Unit,
) {
    fun show(): AlertDialog {
        val content = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(8), dp(20), dp(8)) }
        fun label(text: String) = TextView(activity).apply { this.text = text; textSize = 15f; setPadding(0, dp(12), 0, dp(4)); content.addView(this) }
        fun slider(description: String, min: Int, max: Int, value: Int, title: TextView,
            format: (Int) -> String, change: (Int) -> Unit): SeekBar = SeekBar(activity).apply {
            this.min = min; this.max = max; progress = value; contentDescription = description
            title.text = format(value)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar?, progress: Int, fromUser: Boolean) {
                    title.text = format(progress)
                    if (fromUser) try { change(progress) }
                    catch (e: RuntimeException) { Toast.makeText(activity, e.localizedMessage ?: activity.getString(R.string.ui_e919e87486b4), Toast.LENGTH_SHORT).show() }
                }
                override fun onStartTrackingTouch(bar: SeekBar?) = Unit
                override fun onStopTrackingTouch(bar: SeekBar?) = Unit
            })
            content.addView(this, LinearLayout.LayoutParams(-1, dp(44)))
        }
        val rateLabel = label(activity.getString(R.string.ui_f7fbdb84467e))
        lateinit var rate: SeekBar
        rate = slider(activity.getString(R.string.ui_f7fbdb84467e), 60, 200, (settings.playbackRate * 100).roundToInt(), rateLabel,
            { activity.getString(R.string.ui_7e3f2f88c8fc, java.lang.String.valueOf(String.format(Locale.ROOT, "%.2f", it / 100f))) }) { value ->
            try { setRate(value / 100f) }
            catch (e: RuntimeException) { rate.progress = (settings.playbackRate * 100).roundToInt(); throw e }
        }
        val volumeLabel = label(activity.getString(R.string.ui_dc0e25979181))
        lateinit var volume: SeekBar
        volume = slider(activity.getString(R.string.ui_dc0e25979181), 0, 100, (settings.volume * 100).roundToInt(), volumeLabel, { activity.getString(R.string.ui_f3978b48d365, java.lang.String.valueOf(it)) }) { value ->
            try { setVolume(value / 100f) }
            catch (e: RuntimeException) { volume.progress = (settings.volume * 100).roundToInt(); throw e }
        }
        val fontLabel = label(activity.getString(R.string.ui_7eb039f21dbd))
        val font = slider(activity.getString(R.string.ui_7eb039f21dbd), 10, 30, settings.appearance(landscape).fontSizeSp, fontLabel,
            { activity.getString(R.string.ui_c99707d3d601, java.lang.String.valueOf(if (landscape) activity.getString(R.string.ui_055a6b3a3de7) else activity.getString(R.string.ui_c35bd83b94b4)), java.lang.String.valueOf(it)) }) {
            settings.setFontSize(it, landscape); appearanceChanged()
        }
        label(activity.getString(R.string.ui_f5f431a88186))
        val alignment = RadioGroup(activity).apply { orientation = LinearLayout.HORIZONTAL; contentDescription = activity.getString(R.string.ui_f5f431a88186) }
        val choices = LyricAlignment.entries.associateWith { value ->
            RadioButton(activity).apply {
                id = View.generateViewId(); text = value.localized(activity); contentDescription = value.localized(activity)
                alignment.addView(this, RadioGroup.LayoutParams(0, -2, 1f))
            }
        }
        alignment.check(choices.getValue(settings.appearance(landscape).alignment).id)
        alignment.setOnCheckedChangeListener { _, id ->
            choices.entries.firstOrNull { it.value.id == id }?.key?.let { settings.setAlignment(it); appearanceChanged() }
        }
        content.addView(alignment)
        fun toggle(label: String, checked: Boolean, change: (Boolean) -> Unit) {
            content.addView(CheckBox(activity).apply {
                text = label; contentDescription = label; isChecked = checked
                setOnCheckedChangeListener { _, value -> change(value); appearanceChanged() }
            })
        }
        toggle(activity.getString(R.string.ui_6e30e4ed3423), settings.showTranslation) { settings.showTranslation = it }
        toggle(activity.getString(R.string.ui_1dd07ef2a8c1), settings.showRomanization) { settings.showRomanization = it }
        toggle(activity.getString(R.string.ui_e17be4f4d18f), settings.wordHighlight) { settings.wordHighlight = it }
        toggle(activity.getString(R.string.ui_f3ee75d994c7), settings.traditionalLyrics) { settings.traditionalLyrics = it }
        val offsetLabel = label(activity.getString(R.string.ui_9f47534dbad2))
        content.addView(TextView(activity).apply {
            text = song?.let { "${it.title} · ${it.artist}" } ?: activity.getString(R.string.ui_76fd6993ada5)
            textSize = 12f
        })
        val delay = slider(activity.getString(R.string.ui_9f47534dbad2), 0, 1200, ((song?.let(offsets::get) ?: 0) + LyricOffsets.MAX_DELAY) / 100,
            offsetLabel, { formatOffset(it * 100 - LyricOffsets.MAX_DELAY) }) { progress ->
            song?.let { offsets.set(it, progress * 100 - LyricOffsets.MAX_DELAY); offsetChanged(it) }
        }.apply { isEnabled = song != null }
        fun changeOffset(value: Int) {
            song?.let {
                val next = value.coerceIn(-LyricOffsets.MAX_DELAY, LyricOffsets.MAX_DELAY)
                offsets.set(it, next); delay.progress = (next + LyricOffsets.MAX_DELAY) / 100; offsetChanged(it)
            }
        }
        val offsetButtons = LinearLayout(activity)
        listOf(activity.getString(R.string.ui_b54e1d73efc8) to -500, activity.getString(R.string.ui_c9aeeabf6acc) to 0, activity.getString(R.string.ui_896a97e85ced) to 500).forEach { (text, amount) ->
            offsetButtons.addView(Button(activity).apply {
                this.text = text; contentDescription = text; isEnabled = song != null
                setOnClickListener { changeOffset(if (amount == 0) 0 else (song?.let(offsets::get) ?: 0) + amount) }
            }, LinearLayout.LayoutParams(0, -2, 1f))
        }
        content.addView(offsetButtons)
        val scroll = ScrollView(activity).apply { addView(content) }
        val dialog = AlertDialog.Builder(activity).setTitle(activity.getString(R.string.ui_8c38525734c0)).setView(scroll)
            .setPositiveButton(activity.getString(R.string.ui_c0b3fbff51cc), null).setNeutralButton(activity.getString(R.string.ui_ba2e93e73037), null).create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener {
                try {
                    setRate(1f); setVolume(1f)
                    settings.setFontSize(if (landscape) 22 else 21, landscape)
                    settings.setAlignment(LyricAlignment.LEFT)
                    rate.progress = 100; volume.progress = 100; font.progress = if (landscape) 22 else 21
                    alignment.check(choices.getValue(LyricAlignment.LEFT).id)
                    changeOffset(0); appearanceChanged()
                } catch (e: RuntimeException) { Toast.makeText(activity, e.localizedMessage ?: activity.getString(R.string.ui_3a89dbc96a55), Toast.LENGTH_SHORT).show() }
            }
        }
        dialog.show()
        return dialog
    }
    private fun formatOffset(delayMs: Int): String = activity.getString(R.string.ui_87f152e81f80) + when {
        delayMs == 0 -> activity.getString(R.string.ui_e3f1123bb38b)
        else -> activity.getString(R.string.ui_e207e127367b, java.lang.String.valueOf(if (delayMs > 0) activity.getString(R.string.ui_876d80cccc0c) else activity.getString(R.string.ui_728e91804a2f)), java.lang.String.valueOf(String.format(Locale.ROOT, "%.1f", kotlin.math.abs(delayMs) / 1000f)))
    }
    private fun dp(value: Int): Int = (value * activity.resources.displayMetrics.density).toInt()
}
