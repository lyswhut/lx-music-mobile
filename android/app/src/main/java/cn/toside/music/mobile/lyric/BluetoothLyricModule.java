package cn.toside.music.mobile.lyric;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class BluetoothLyricModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  BluetoothLyric bluetoothLyric;
  // final Map<String, Object> constants = new HashMap<>();

  float playbackRate = 1;

  private int listenerCount = 0;

  BluetoothLyricModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    bluetoothLyric = new BluetoothLyric(reactContext, playbackRate);
    // Log.d("Lyric", "init bt lyric");
  }

  @Override
  public String getName() {
    return "BluetoothLyricModule";
  }

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }

    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
    }
  }

  @ReactMethod
  public void setLyric(String lyric, String title, String singer, String album, Promise promise) {
    if (bluetoothLyric != null) this.bluetoothLyric.setLyric(lyric, title, singer, album);
    promise.resolve(null);
  }

  @ReactMethod
  public void setPlaybackRate(float playbackRate, Promise promise) {
    this.playbackRate = playbackRate;
    // Log.d("Lyric", "set bt lyric rate " + playbackRate);
    if (bluetoothLyric != null) bluetoothLyric.setPlaybackRate(playbackRate);
    promise.resolve(null);
  }

  @ReactMethod
  public void play(int time, Promise promise) {
    // Log.d("Lyric", "play bt lyric: " + time);
    if (bluetoothLyric != null) bluetoothLyric.play(time);
    promise.resolve(null);
  }

  @ReactMethod
  public void pause(Promise promise) {
    // Log.d("Lyric", "play bt pause");
    if (bluetoothLyric != null) bluetoothLyric.pauseLyric();
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleSendBluetoothLyric(boolean isSendBluetoothLyric, Promise promise) {
    if (bluetoothLyric != null) bluetoothLyric.toggleSendBluetoothLyric(isSendBluetoothLyric);
    promise.resolve(null);
  }

}
