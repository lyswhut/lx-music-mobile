package com.lxmusicmobile.lyric;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LyricModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  Lyric lyric;
  // final Map<String, Object> constants = new HashMap<>();

  LyricModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;

    // constants.put("THEME_GREEN", "#07c556");
    // constants.put("THEME_YELLOW", "#fffa12");
    // constants.put("THEME_BLUE", "#19b5fe");
    // constants.put("THEME_RED", "#ff1222");
    // constants.put("THEME_PINK", "#f1828d");
    // constants.put("THEME_PURPLE", "#c851d4");
    // constants.put("THEME_ORANGE", "#fffa12");
    // constants.put("THEME_GREY", "#bdc3c7");
  }

  @Override
  public String getName() {
    return "LyricModule";
  }

//  @Override
//  public Map<String, Object> getConstants() {
//    return constants;
//  }

  @ReactMethod
  public void showLyric(boolean isLook, String themeColor, int lyricViewX, int lyricViewY, String textX, String textY , Promise promise) {
    if (lyric == null) lyric = new Lyric(reactContext);
    lyric.showLyric(isLook, themeColor, lyricViewX, lyricViewY, textX, textY, promise);
  }

  @ReactMethod
  public void hideLyric(Promise promise) {
    lyric.hideLyric();
    promise.resolve(null);
  }


  @ReactMethod
  public void setLyric(String lyric, String translation, Promise promise) {
    // Log.d("Lyric", "set lyric: " + lyric);
    // Log.d("Lyric", "set lyric translation: " + translation);
    this.lyric.setLyric(lyric, translation);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleTranslation(boolean isShowTranslation, Promise promise) {

    promise.resolve(null);
  }

  @ReactMethod
  public void play(int time, Promise promise) {
    Log.d("Lyric", "play lyric: " + time);
    lyric.play(time);
    promise.resolve(null);
  }

  @ReactMethod
  public void pause(Promise promise) {
    Log.d("Lyric", "play pause");
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
    promise.resolve(null);
  }

  @ReactMethod
  public void setColor(String themeColor, Promise promise) {
    lyric.setColor(themeColor);
    promise.resolve(null);
  }

  @ReactMethod
  public void setLyricTextPosition(String positionX, String positionY, Promise promise) {
    lyric.setLyricTextPosition(positionX, positionY);
    promise.resolve(null);
  }

  @ReactMethod
  public void checkOverlayPermission(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
      promise.reject(new Exception("Permission denied"));
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void openOverlayPermissionActivity(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + reactContext.getApplicationContext().getPackageName()));
      reactContext.startActivityForResult(intent, 1, null);
    }
    promise.resolve(null);
  }

}
