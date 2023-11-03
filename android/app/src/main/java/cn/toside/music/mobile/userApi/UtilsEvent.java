package cn.toside.music.mobile.userApi;

import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class UtilsEvent {
  final String API_ACTION = "api-action";
  private final ReactApplicationContext reactContext;

  UtilsEvent(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  public void sendEvent(String eventName, @Nullable WritableMap params) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }
}
