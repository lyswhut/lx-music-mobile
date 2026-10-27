package cn.toside.music.effects;

import java.util.Arrays;

public final class BiquadEqualizer {
    private final int sampleRate;
    private final double[][] coefficients = new double[10][5];
    private final double[][][] memory;
    private final double[] gains = new double[10];

    public BiquadEqualizer(int sampleRate) {
        this(sampleRate, 2);
    }

    public BiquadEqualizer(int sampleRate, int channels) {
        this.sampleRate = sampleRate;
        memory = new double[channels][10][2];
        Arrays.fill(gains, Double.NaN);
        set(EffectSettings.OFF, true);
    }

    public void set(EffectSettings settings, boolean immediate) {
        for (int band = 0; band < gains.length; band++) {
            double target = settings.equalizer ? settings.gains[band] : 0;
            double gain = immediate ? target : gains[band] + (target - gains[band]) * 0.25;
            if (Math.abs(gain - target) < 0.001) gain = target;
            if (gain == gains[band]) continue;
            gains[band] = gain;
            double[] c = coefficients[band];
            if (EffectSettings.FREQUENCIES[band] >= sampleRate / 2.0 || gain == 0) {
                c[0] = 1;
                c[1] = c[2] = c[3] = c[4] = 0;
                continue;
            }
            double a = Math.pow(10, gain / 40);
            double omega = 2 * Math.PI * EffectSettings.FREQUENCIES[band] / sampleRate;
            double alpha = Math.sin(omega) / (2 * 1.4);
            double a0 = 1 + alpha / a;
            c[0] = (1 + alpha * a) / a0;
            c[1] = -2 * Math.cos(omega) / a0;
            c[2] = (1 - alpha * a) / a0;
            c[3] = c[1];
            c[4] = (1 - alpha / a) / a0;
        }
    }

    public float process(int channel, float sample) {
        double value = sample;
        for (int band = 0; band < gains.length; band++) {
            double[] c = coefficients[band];
            double[] s = memory[channel][band];
            double result = c[0] * value + s[0];
            s[0] = c[1] * value - c[3] * result + s[1];
            s[1] = c[2] * value - c[4] * result;
            value = result;
        }
        return (float) value;
    }

    public void reset() {
        for (double[][] channel : memory) for (double[] state : channel) Arrays.fill(state, 0);
    }
}
