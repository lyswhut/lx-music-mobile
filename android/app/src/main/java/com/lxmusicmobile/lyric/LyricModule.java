package com.lxmusicmobile.lyric;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LyricModule  extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  Lyric lyric = null;

  LyricModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "LyricModule";
  }

  @ReactMethod
  public void showLyric(Promise promise) {
    if (lyric == null) {
      lyric = new Lyric(reactContext);
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void hideLyric(Promise promise) {
    if (lyric != null) {
      lyric.destroy();
      lyric = null;
    }
    promise.resolve(null);
  }


  @ReactMethod
  public void setLyric(String lyric, String translation, Promise promise) {
    Log.e("Lyric", "set lyric: " + lyric);
    Log.e("Lyric", "set lyric translation: " + translation);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleTranslation(boolean isShowTranslation, Promise promise) {

    promise.resolve(null);
  }

  @ReactMethod
  public void play(int time, Promise promise) {
    Log.e("Lyric", "play lyric: " + time);
    promise.resolve(null);
  }

  @ReactMethod
  public void pause(Promise promise) {
    Log.e("Lyric", "play pause");
    promise.resolve(null);
  }
}
