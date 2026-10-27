package cn.toside.music.effects;

public final class EffectSettings {
    public static final int[] FREQUENCIES = {31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000};
    public static final EffectSettings OFF = new EffectSettings(false, new double[10], "", 1, 0);
    public final boolean equalizer;
    public final double[] gains;
    public final String source;
    public final double dry;
    public final double wet;

    public EffectSettings(boolean equalizer, double[] gains, String source, double dry, double wet) {
        if (gains.length != FREQUENCIES.length) throw new IllegalArgumentException("Invalid equalizer bands");
        this.equalizer = equalizer;
        this.gains = gains.clone();
        for (double gain : gains) check(gain, -15, 15);
        check(dry, 0, 5);
        check(wet, 0, 5);
        if (!source.isEmpty() && !source.matches("[a-zA-Z0-9_-]+[.]wav")) {
            throw new IllegalArgumentException("Invalid impulse source");
        }
        this.source = source;
        this.dry = dry;
        this.wet = wet;
    }

    public boolean active() {
        return equalizer || !source.isEmpty();
    }

    private static void check(double value, double min, double max) {
        if (Double.isNaN(value) || Double.isInfinite(value) || value < min || value > max) {
            throw new IllegalArgumentException("Effect value outside range");
        }
    }
}
