package cn.toside.music.effects;

import android.content.Context;
import android.os.Handler;
import androidx.media3.common.TrackSelectionParameters;
import androidx.media3.exoplayer.ExoPlayer;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import pl.edu.icm.jlargearrays.ConcurrencyUtils;

public final class SoundEffects {
    public interface Completion {
        void complete(Exception error);
    }

    static final class Prepared {
        final String source;
        final int rate;
        final PartitionedConvolver engine;

        Prepared(String source, int rate, PartitionedConvolver engine) {
            this.source = source;
            this.rate = rate;
            this.engine = engine;
        }
    }

    private static final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread thread = new Thread(r, "lx-sound-effects");
        thread.setDaemon(true);
        return thread;
    });
    private static final AtomicLong revision = new AtomicLong();
    private static volatile EffectSettings settings = EffectSettings.OFF;
    private static volatile Prepared prepared;
    private static volatile int sampleRate = 48000;
    private static WeakReference<ExoPlayer> player = new WeakReference<>(null);
    private static boolean allowOffload = true;
    private static WaveImpulse cachedImpulse;
    private static String cachedSource = "";

    private SoundEffects() {}

    public static EffectSettings settings() {
        return settings;
    }

    static Prepared prepared() {
        return prepared;
    }

    public static synchronized void attachPlayer(ExoPlayer value, boolean offload) {
        player = new WeakReference<>(value);
        allowOffload = offload;
        updateOffload();
    }

    public static synchronized void detachPlayer(androidx.media3.common.Player value) {
        if (player.get() == value) player.clear();
    }

    private static synchronized void updateOffload() {
        ExoPlayer value = player.get();
        if (value == null) return;
        new Handler(value.getApplicationLooper()).post(() -> {
            if (player.get() != value) return;
            value.setTrackSelectionParameters(value.getTrackSelectionParameters().buildUpon()
                .setAudioOffloadPreferences(new TrackSelectionParameters.AudioOffloadPreferences.Builder()
                    .setAudioOffloadMode(allowOffload && !settings.active()
                        ? TrackSelectionParameters.AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_ENABLED
                        : TrackSelectionParameters.AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_DISABLED)
                    .setIsGaplessSupportRequired(true).build()).build());
        });
    }

    public static void configure(Context context, EffectSettings value, Completion completion) {
        settings = value;
        updateOffload();
        prepare(context, completion);
    }

    static void setSampleRate(Context context, int rate) {
        if (rate == sampleRate && (prepared == null || prepared.rate == rate)) return;
        sampleRate = rate;
        prepare(context, error -> {
            if (error != null) android.util.Log.e("LXSoundEffects", "Could not prepare impulse", error);
        });
    }

    private static void prepare(Context context, Completion completion) {
        EffectSettings current = settings;
        int rate = sampleRate;
        long generation = revision.incrementAndGet();
        if (current.source.isEmpty()) {
            prepared = null;
            completion.complete(null);
            return;
        }
        Prepared ready = prepared;
        if (ready != null && ready.source.equals(current.source) && ready.rate == rate) {
            completion.complete(null);
            return;
        }
        worker.execute(() -> {
            if (generation != revision.get()) { completion.complete(null); return; }
            try {
                // 小型变换保持单线程以降低音频回调抖动
                ConcurrencyUtils.setNumberOfThreads(1);
                if (!cachedSource.equals(current.source)) {
                    try (InputStream input = context.getAssets().open("lx_sound_effects/" + current.source)) {
                        cachedImpulse = WaveImpulse.read(input);
                        cachedSource = current.source;
                    }
                }
                PartitionedConvolver engine = new PartitionedConvolver(cachedImpulse.resample(rate), rate, true);
                if (generation == revision.get()) prepared = new Prepared(current.source, rate, engine);
                completion.complete(null);
            } catch (Exception error) {
                completion.complete(generation == revision.get() ? error : null);
            }
        });
    }
}
