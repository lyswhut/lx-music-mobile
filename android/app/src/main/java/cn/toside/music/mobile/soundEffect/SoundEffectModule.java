package cn.toside.music.mobile.soundEffect;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import cn.toside.music.effects.EffectSettings;
import cn.toside.music.effects.SoundEffects;

public final class SoundEffectModule extends ReactContextBaseJavaModule {
    public SoundEffectModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SoundEffectModule";
    }

    @ReactMethod
    public void configure(ReadableMap options, Promise promise) {
        try {
            ReadableArray bands = options.getArray("gains");
            if (bands == null || bands.size() != EffectSettings.FREQUENCIES.length) {
                throw new IllegalArgumentException("Invalid equalizer bands");
            }
            double[] gains = new double[bands.size()];
            for (int i = 0; i < gains.length; i++) gains[i] = bands.getDouble(i);
            String source = options.getString("source");
            EffectSettings settings = new EffectSettings(options.getBoolean("equalizer"), gains,
                source == null ? "" : source, options.getDouble("dry"), options.getDouble("wet"));
            SoundEffects.configure(getReactApplicationContext(), settings, error -> {
                if (error == null) promise.resolve(null);
                else promise.reject("sound_effect_prepare_failed", error);
            });
        } catch (Exception error) {
            promise.reject("sound_effect_invalid_settings", error);
        }
    }
}
