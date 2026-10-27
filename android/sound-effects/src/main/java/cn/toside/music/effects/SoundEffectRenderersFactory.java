package cn.toside.music.effects;

import android.content.Context;
import androidx.media3.common.Format;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.audio.AudioSink;
import androidx.media3.exoplayer.audio.DefaultAudioSink;
import androidx.media3.exoplayer.audio.ForwardingAudioSink;

public final class SoundEffectRenderersFactory extends DefaultRenderersFactory {
    public SoundEffectRenderersFactory(Context context) {
        super(context);
    }

    @Override
    protected AudioSink buildAudioSink(Context context, boolean enableFloatOutput, boolean enableAudioTrackPlaybackParams) {
        AudioSink sink = new DefaultAudioSink.Builder(context)
            .setEnableFloatOutput(false)
            .setEnableAudioTrackPlaybackParams(false)
            .setAudioProcessors(new AudioProcessor[] {new SoundEffectAudioProcessor(context)})
            .build();
        return new ForwardingAudioSink(sink) {
            @Override
            public boolean supportsFormat(Format format) {
                return MimeTypes.AUDIO_RAW.equals(format.sampleMimeType) && super.supportsFormat(format);
            }

            @Override
            public int getFormatSupport(Format format) {
                return MimeTypes.AUDIO_RAW.equals(format.sampleMimeType) ? super.getFormatSupport(format) : SINK_FORMAT_UNSUPPORTED;
            }
        };
    }
}
