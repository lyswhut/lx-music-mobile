package com.lxmusicmobile.lyric;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LyricModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  Lyric lyric;

  LyricModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    lyric = new Lyric();
  }

  @Override
  public String getName() {
    return "LyricModule";
  }

  @ReactMethod
  public void showLyric(boolean isLook, Promise promise) {
    lyric.showLyric(reactContext, isLook);
    promise.resolve(null);
  }

  @ReactMethod
  public void hideLyric(Promise promise) {
    lyric.hideLyric();
    promise.resolve(null);
  }


  @ReactMethod
  public void setLyric(String lyric, String translation, Promise promise) {
    Log.e("Lyric", "set lyric: " + lyric);
    Log.e("Lyric", "set lyric translation: " + translation);
    this.lyric.setLyric(lyric, translation);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleTranslation(boolean isShowTranslation, Promise promise) {

    promise.resolve(null);
  }

  @ReactMethod
  public void play(int time, Promise promise) {
    Log.e("Lyric", "play lyric: " + time);
    lyric.play(time);
    promise.resolve(null);
  }

  @ReactMethod
  public void pause(Promise promise) {
    Log.e("Lyric", "play pause");
    lyric.pause();
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleLock(boolean isLock, Promise promise) {
    if (isLock) {
      lyric.lockLyric();
    } else {
      lyric.unlockLyric();
    }
  }
}
