@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package cn.toside.music.nativeapp.player

import android.content.Context
import android.net.Uri
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionParameters.AudioOffloadPreferences
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory

/** Native Media3 path for cached streaming and optional hardware audio offload. */
internal class NativeAudioPlayer(context: Context, cache: AudioStreamCache?, offload: Boolean,
    private val changed: (NativeAudioPlayer) -> Unit, private val completed: (NativeAudioPlayer) -> Unit,
    private val failed: (NativeAudioPlayer, String) -> Unit) {
    internal val engine = ExoPlayer.Builder(context).setMediaSourceFactory(if (cache == null) DefaultMediaSourceFactory(context) else DefaultMediaSourceFactory(cache.dataSource())).build()
    var recorded = false
    init {
        engine.setWakeMode(C.WAKE_MODE_NETWORK)
        engine.setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(), false)
        engine.trackSelectionParameters = engine.trackSelectionParameters.buildUpon().setAudioOffloadPreferences(AudioOffloadPreferences.Builder()
            .setAudioOffloadMode(if (offload) AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_ENABLED else AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_DISABLED)
            .setIsSpeedChangeSupportRequired(true).build()).build()
        engine.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) { if (state == Player.STATE_ENDED) completed(this@NativeAudioPlayer) else changed(this@NativeAudioPlayer) }
            override fun onIsPlayingChanged(isPlaying: Boolean) { changed(this@NativeAudioPlayer) }
            override fun onPlayerError(error: PlaybackException) { failed(this@NativeAudioPlayer, error.errorCodeName) }
        })
    }
    fun prepare(uri: Uri, key: String?, position: Int, rate: Float, volume: Float, play: Boolean) {
        engine.volume = volume; engine.playbackParameters = PlaybackParameters(rate, 1f)
        engine.setMediaItem(MediaItem.Builder().setUri(uri).setCustomCacheKey(key).build(), position.toLong())
        engine.prepare(); engine.playWhenReady = play
    }
    val preparing get() = engine.playbackState == Player.STATE_BUFFERING || engine.playbackState == Player.STATE_IDLE
    val isPlaying get() = engine.isPlaying
    val position get() = engine.currentPosition.coerceIn(0, Int.MAX_VALUE.toLong()).toInt()
    val duration get() = engine.duration.takeIf { it != C.TIME_UNSET }?.coerceIn(0, Int.MAX_VALUE.toLong())?.toInt() ?: 0
    fun play() { if (engine.playbackState == Player.STATE_ENDED) engine.seekTo(0); engine.play() }
    fun pause() { engine.pause() }
    fun seekTo(value: Int) { engine.seekTo(value.toLong()) }
    fun rate(value: Float) { engine.playbackParameters = PlaybackParameters(value, 1f) }
    fun volume(value: Float) { engine.volume = value }
    fun release() { engine.release() }
}
