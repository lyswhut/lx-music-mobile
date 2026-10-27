package cn.toside.music.effects;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public final class WaveImpulse {
    public final int sampleRate;
    public final float[][] channels;

    public WaveImpulse(int sampleRate, float[][] channels) {
        this.sampleRate = sampleRate;
        this.channels = channels;
    }

    public static WaveImpulse read(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int count;
        while ((count = input.read(chunk)) != -1) {
            output.write(chunk, 0, count);
            if (output.size() > 16 * 1024 * 1024) throw new IOException("Impulse is too large");
        }
        ByteBuffer data = ByteBuffer.wrap(output.toByteArray()).order(ByteOrder.LITTLE_ENDIAN);
        if (data.remaining() < 12 || data.getInt() != 0x46464952) throw new IOException("Invalid RIFF header");
        data.getInt();
        if (data.getInt() != 0x45564157) throw new IOException("Invalid WAVE header");
        int format = 0, channelCount = 0, rate = 0, bits = 0, start = -1, length = 0;
        while (data.remaining() >= 8) {
            int id = data.getInt();
            int size = data.getInt();
            int from = data.position();
            if (size < 0 || size > data.remaining()) throw new IOException("Truncated WAV chunk");
            if (id == 0x20746d66 && size >= 16) {
                format = data.getShort() & 0xffff;
                channelCount = data.getShort() & 0xffff;
                rate = data.getInt();
                data.getInt();
                data.getShort();
                bits = data.getShort() & 0xffff;
                if (format == 0xfffe && size >= 40) format = data.getShort(from + 24) & 0xffff;
            } else if (id == 0x61746164) {
                start = from;
                length = size;
            }
            data.position(from + size + (size & 1));
        }
        if ((channelCount != 1 && channelCount != 2 && channelCount != 4) || rate < 8000 || rate > 192000
                || start < 0 || length == 0 || (format != 1 && format != 3)
                || (format == 1 && bits != 16 && bits != 24 && bits != 32) || (format == 3 && bits != 32)) {
            throw new IOException("Unsupported impulse format");
        }
        int bytes = bits / 8;
        int frames = length / (bytes * channelCount);
        float[][] samples = new float[channelCount][frames];
        data.position(start);
        for (int i = 0; i < frames; i++) {
            for (int ch = 0; ch < channelCount; ch++) {
                float value;
                if (format == 3) value = data.getFloat();
                else if (bits == 16) value = data.getShort() / 32768f;
                else if (bits == 24) {
                    int sample = (data.get() & 255) | ((data.get() & 255) << 8) | (data.get() << 16);
                    value = sample / 8388608f;
                } else value = data.getInt() / 2147483648f;
                if (Float.isNaN(value) || Float.isInfinite(value)) throw new IOException("Invalid impulse sample");
                samples[ch][i] = value;
            }
        }
        return new WaveImpulse(rate, samples);
    }

    public float[][] resample(int rate) {
        if (rate == sampleRate) return channels;
        int length = Math.max(1, (int) Math.round(channels[0].length * (double) rate / sampleRate));
        float[][] result = new float[channels.length][length];
        // 带限插值避免降低采样率时产生混叠
        double cutoff = Math.min(1, (double) rate / sampleRate) * 0.95;
        int radius = 24;
        for (int i = 0; i < length; i++) {
            double position = i * (double) sampleRate / rate;
            int center = (int) position;
            double weightSum = 0;
            for (int j = center - radius + 1; j <= center + radius; j++) {
                if (j < 0 || j >= channels[0].length) continue;
                double distance = position - j;
                double x = Math.PI * distance * cutoff;
                double sinc = Math.abs(x) < 1e-10 ? 1 : Math.sin(x) / x;
                double weight = cutoff * sinc * (0.5 + 0.5 * Math.cos(Math.PI * distance / radius));
                weightSum += weight;
                for (int ch = 0; ch < channels.length; ch++) result[ch][i] += channels[ch][j] * weight;
            }
            if (Math.abs(weightSum) > 1e-10) {
                for (int ch = 0; ch < channels.length; ch++) result[ch][i] /= weightSum;
            }
        }
        return result;
    }
}
