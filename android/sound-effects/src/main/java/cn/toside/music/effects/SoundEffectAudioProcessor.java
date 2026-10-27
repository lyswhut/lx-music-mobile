package cn.toside.music.effects;

import android.content.Context;
import androidx.media3.common.C;
import androidx.media3.common.audio.BaseAudioProcessor;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

public final class SoundEffectAudioProcessor extends BaseAudioProcessor {
    private final Context context;
    private float[][] input = new float[0][];
    private final float[][] wet = new float[2][PartitionedConvolver.BLOCK];
    private double[] mixed = new double[0];
    private int position;
    private int channels;
    private int rate;
    private int remainingEndFrames;
    private boolean hadInput;
    private boolean eosQueued;
    private BiquadEqualizer equalizer;
    private SoundEffects.Prepared active;
    private SoundEffects.Prepared endImpulse;
    private double dryGain = 1;
    private double wetGain;
    private double limiterGain = 1;

    public SoundEffectAudioProcessor(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    protected AudioFormat onConfigure(AudioFormat format) throws UnhandledAudioFormatException {
        if (format.encoding != C.ENCODING_PCM_16BIT || format.channelCount < 1 || format.sampleRate < 1) {
            throw new UnhandledAudioFormatException(format);
        }
        return format;
    }

    @Override
    public void queueInput(ByteBuffer buffer) {
        if (!buffer.hasRemaining()) return;
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        int frames = buffer.remaining() / (channels * 2);
        if (frames > 0) hadInput = true;
        int outputFrames = ((position + frames) / PartitionedConvolver.BLOCK) * PartitionedConvolver.BLOCK;
        ByteBuffer output = replaceOutputBuffer(outputFrames * channels * 2).order(ByteOrder.LITTLE_ENDIAN);
        while (buffer.remaining() >= channels * 2) {
            for (int ch = 0; ch < channels; ch++) input[ch][position] = buffer.getShort() / 32768f;
            position++;
            if (position == PartitionedConvolver.BLOCK) {
                process(output, position);
                position = 0;
            }
        }
        output.flip();
    }

    private SoundEffects.Prepared currentImpulse() {
        SoundEffects.Prepared prepared = SoundEffects.prepared();
        return prepared != null && prepared.source.equals(SoundEffects.settings().source) && prepared.rate == rate ? prepared : null;
    }

    private void process(ByteBuffer output, int frames) {
        EffectSettings settings = SoundEffects.settings();
        SoundEffects.Prepared prepared = currentImpulse();
        if (prepared != active) {
            active = prepared;
            if (active != null) active.engine.reset();
            wetGain = 0;
        }
        if (!settings.active()) {
            equalizer.set(EffectSettings.OFF, true);
            equalizer.reset();
            dryGain = limiterGain = 1;
            wetGain = 0;
            for (int i = 0; i < frames; i++) for (int ch = 0; ch < channels; ch++) output.putShort(toPcm(input[ch][i]));
            return;
        }
        equalizer.set(settings, false);
        for (int ch = 0; ch < channels; ch++) {
            for (int i = 0; i < PartitionedConvolver.BLOCK; i++) input[ch][i] = equalizer.process(ch, input[ch][i]);
        }
        if (active != null) active.engine.process(input[0], input[Math.min(1, channels - 1)], wet[0], wet[1]);
        double targetDry = active == null ? 1 : settings.dry;
        double targetWet = active == null ? 0 : settings.wet;
        double smoothing = 1 - Math.exp(-1.0 / (rate * 0.015));
        double release = 1 - Math.exp(-1.0 / (rate * 0.1));
        for (int i = 0; i < frames; i++) {
            dryGain += (targetDry - dryGain) * smoothing;
            wetGain += (targetWet - wetGain) * smoothing;
            double peak = 0;
            for (int ch = 0; ch < channels; ch++) {
                double value = input[ch][i];
                if (ch < 2) {
                    double effect = channels == 1 ? (wet[0][i] + wet[1][i]) * 0.5 : wet[ch][i];
                    value = value * dryGain + (active == null ? 0 : effect * wetGain);
                }
                mixed[ch] = value;
                peak = Math.max(peak, Math.abs(value));
            }
            // 声道联动限幅防止高增益溢出
            double target = peak > 0.98 ? 0.98 / peak : 1;
            limiterGain = target < limiterGain ? target : limiterGain + (target - limiterGain) * release;
            for (double value : mixed) output.putShort(toPcm(value * limiterGain));
        }
    }

    private static short toPcm(double value) {
        return (short) Math.max(-32768, Math.min(32767, Math.round(value * 32768)));
    }

    @Override
    protected void onQueueEndOfStream() {
        if (eosQueued) return;
        eosQueued = true;
        endImpulse = currentImpulse();
        remainingEndFrames = position + (hadInput && endImpulse != null ? endImpulse.engine.tailFrames() : 0);
        if (remainingEndFrames > 0) writeEndBlock();
    }

    private void writeEndBlock() {
        for (float[] channel : input) Arrays.fill(channel, position, channel.length, 0);
        int frames = Math.min(PartitionedConvolver.BLOCK, remainingEndFrames);
        ByteBuffer output = replaceOutputBuffer(frames * channels * 2).order(ByteOrder.LITTLE_ENDIAN);
        process(output, frames);
        position = 0;
        remainingEndFrames -= frames;
        output.flip();
    }

    @Override
    public ByteBuffer getOutput() {
        ByteBuffer output = super.getOutput();
        if (output.hasRemaining() || remainingEndFrames == 0) return output;
        if (endImpulse != null && endImpulse != currentImpulse()) {
            remainingEndFrames = 0;
            return output;
        }
        writeEndBlock();
        return super.getOutput();
    }

    @Override
    public boolean isEnded() {
        return super.isEnded() && remainingEndFrames == 0;
    }

    @Override
    protected void onFlush() {
        position = remainingEndFrames = 0;
        hadInput = eosQueued = false;
        endImpulse = null;
        if (inputAudioFormat != AudioFormat.NOT_SET) {
            if (channels != inputAudioFormat.channelCount || rate != inputAudioFormat.sampleRate || equalizer == null) {
                channels = inputAudioFormat.channelCount;
                rate = inputAudioFormat.sampleRate;
                input = new float[channels][PartitionedConvolver.BLOCK];
                mixed = new double[channels];
                equalizer = new BiquadEqualizer(rate, channels);
            }
            equalizer.set(SoundEffects.settings(), true);
            equalizer.reset();
            SoundEffects.setSampleRate(context, rate);
        }
        for (float[] channel : input) Arrays.fill(channel, 0);
        if (active != null) active.engine.reset();
        dryGain = limiterGain = 1;
        wetGain = 0;
    }

    @Override
    protected void onReset() {
        position = remainingEndFrames = 0;
        hadInput = eosQueued = false;
        active = endImpulse = null;
        equalizer = null;
        input = new float[0][];
        mixed = new double[0];
        channels = rate = 0;
    }
}
