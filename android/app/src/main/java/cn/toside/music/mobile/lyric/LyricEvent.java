package cn.toside.music.mobile.lyric;

import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LyricEvent {
  final String SET_VIEW_POSITION = "set-position";
  final String SET_BLUETOOTH_LYRIC = "set-bluetooth-lyric";

  private final ReactApplicationContext reactContext;
  LyricEvent(ReactApplicationContext reactContext) { this.reactContext = reactContext; }

  public void sendEvent(String eventName, @Nullable WritableMap params) {
    Log.d("Lyric", "sendEvent: " + eventName);
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }
}
