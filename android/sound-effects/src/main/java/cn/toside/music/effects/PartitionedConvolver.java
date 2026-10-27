package cn.toside.music.effects;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.jtransforms.fft.FloatFFT_1D;

public final class PartitionedConvolver {
    public static final int BLOCK = 128;
    private static final int[] TIERS = {128, 1024, 8192};
    private final float[][] ring;
    private final List<Stage> stages = new ArrayList<>();
    private long time;
    private final int impulseLength;

    public PartitionedConvolver(float[][] impulse, int sampleRate, boolean normalize) {
        int length = impulse[0].length;
        impulseLength = length;
        if (length == 0 || (impulse.length != 1 && impulse.length != 2 && impulse.length != 4)) {
            throw new IllegalArgumentException("Invalid impulse channels");
        }
        double power = 0;
        for (float[] channel : impulse) {
            if (channel.length != length) throw new IllegalArgumentException("Impulse lengths differ");
            for (float value : channel) power += value * (double) value;
        }
        double rms = Math.max(0.000125, Math.sqrt(power / (impulse.length * (double) length)));
        double scale = normalize ? Math.pow(10, -58 * 0.05) / rms * 44100 / sampleRate * (impulse.length == 4 ? 0.5 : 1) : 1;
        int size = 1;
        while (size < length + 32768) size <<= 1;
        ring = new float[2][size];
        for (int tier = 0; tier < TIERS.length; tier++) {
            int block = TIERS[tier];
            int offset = tier == 0 ? 0 : block * 2;
            if (offset >= length) break;
            int end = tier + 1 < TIERS.length ? Math.min(length, TIERS[tier + 1] * 2) : length;
            stages.add(new Stage(impulse, block, offset, end, scale));
        }
    }

    public void process(float[] left, float[] right, float[] outputLeft, float[] outputRight) {
        for (Stage stage : stages) stage.process(left, right);
        int mask = ring[0].length - 1;
        for (int i = 0; i < BLOCK; i++) {
            int index = (int) (time + i) & mask;
            outputLeft[i] = ring[0][index];
            outputRight[i] = ring[1][index];
            ring[0][index] = ring[1][index] = 0;
        }
        time += BLOCK;
    }

    public int tailFrames() {
        return impulseLength - 1;
    }

    public void reset() {
        time = 0;
        for (float[] channel : ring) Arrays.fill(channel, 0);
        for (Stage stage : stages) stage.reset();
    }

    private static void multiplyAdd(float[] sum, float[] a, float[] b) {
        sum[0] += a[0] * b[0];
        sum[1] += a[1] * b[1];
        for (int i = 2; i < sum.length; i += 2) {
            sum[i] += a[i] * b[i] - a[i + 1] * b[i + 1];
            sum[i + 1] += a[i] * b[i + 1] + a[i + 1] * b[i];
        }
    }

    private final class Stage {
        final int block, offset, count;
        final FloatFFT_1D fft;
        final float[][][] kernels;
        final float[][][] history;
        final float[][] input;
        final float[][] sum;
        int head = -1, position, step, part;
        long outputStart;
        boolean pending;

        Stage(float[][] impulse, int block, int offset, int end, double scale) {
            this.block = block;
            this.offset = offset;
            count = (end - offset + block - 1) / block;
            fft = new FloatFFT_1D(block * 2);
            kernels = new float[impulse.length][count][block * 2];
            history = new float[2][count][block * 2];
            input = new float[2][block * 2];
            sum = new float[2][block * 2];
            for (int ch = 0; ch < impulse.length; ch++) {
                for (int p = 0; p < count; p++) {
                    int from = offset + p * block;
                    int size = Math.min(block, end - from);
                    for (int i = 0; i < size; i++) kernels[ch][p][i] = (float) (impulse[ch][from + i] * scale);
                    fft.realForward(kernels[ch][p]);
                }
            }
        }

        void reset() {
            head = -1;
            position = 0;
            pending = false;
            for (float[][] channel : history) for (float[] spectrum : channel) Arrays.fill(spectrum, 0);
            for (float[] channel : input) Arrays.fill(channel, 0);
        }

        void start() {
            head = (head + 1) % count;
            for (int ch = 0; ch < 2; ch++) {
                System.arraycopy(input[ch], 0, history[ch][head], 0, block);
                Arrays.fill(history[ch][head], block, block * 2, 0);
                fft.realForward(history[ch][head]);
                Arrays.fill(sum[ch], 0);
            }
            part = 0;
        }

        void accumulate(int end) {
            for (; part < end; part++) {
                int index = (head - part + count) % count;
                multiplyAdd(sum[0], kernels[0][part], history[0][index]);
                if (kernels.length == 4) {
                    multiplyAdd(sum[1], kernels[1][part], history[0][index]);
                    multiplyAdd(sum[0], kernels[2][part], history[1][index]);
                    multiplyAdd(sum[1], kernels[3][part], history[1][index]);
                } else {
                    multiplyAdd(sum[1], kernels[kernels.length == 1 ? 0 : 1][part], history[1][index]);
                }
            }
        }

        void finish() {
            int mask = ring[0].length - 1;
            for (int ch = 0; ch < 2; ch++) {
                fft.realInverse(sum[ch], true);
                for (int i = 0; i < block * 2; i++) ring[ch][(int) (outputStart + i) & mask] += sum[ch][i];
            }
            pending = false;
        }

        void process(float[] left, float[] right) {
            if (pending) {
                int steps = block / BLOCK;
                if (step == 0) start();
                else if (step == steps - 1) finish();
                else accumulate((count * step + steps - 3) / (steps - 2));
                step++;
            }
            System.arraycopy(left, 0, input[0], position, BLOCK);
            System.arraycopy(right, 0, input[1], position, BLOCK);
            position += BLOCK;
            if (position != block) return;
            position = 0;
            outputStart = time + BLOCK - block + offset;
            pending = true;
            step = 0;
            if (offset == 0) {
                start();
                accumulate(count);
                finish();
            }
        }
    }
}
