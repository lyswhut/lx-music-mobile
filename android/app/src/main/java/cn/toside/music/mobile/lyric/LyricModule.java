package cn.toside.music.mobile.lyric;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import StatusBarLyric.API.StatusBarLyric;
import cn.toside.music.mobile.R;

public class LyricModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  Lyric lyric;
  StatusBarLyric statusBarLyric = null;
  // final Map<String, Object> constants = new HashMap<>();

  boolean isShowTranslation = false;

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

  /**
   * 更新【墨•状态栏歌词】歌词文本
   * @see <a href="https://github.com/Block-Network/StatusBarLyric">【墨•状态栏歌词】</a>
   * @param lyric 单行歌词文本
   */
  @ReactMethod
  public void updateStatusBarLyric(String lyric) {
    if (statusBarLyric == null) {
      statusBarLyric = new StatusBarLyric(reactContext,
        ContextCompat.getDrawable(reactContext, R.mipmap.ic_launcher),
        reactContext.getPackageName(), true);
    }
    if (statusBarLyric.hasEnable() && !TextUtils.isEmpty(lyric)) {
      statusBarLyric.updateLyric(lyric);
    }
  }

  /**
   * 停止【墨•状态栏歌词】歌词显示
   */
  @ReactMethod
  public void stopStatusBarLyric() {
    if (statusBarLyric != null && statusBarLyric.hasEnable()) {
      statusBarLyric.stopLyric();
    }
  }

  @ReactMethod
  public void showLyric(ReadableMap data, Promise promise) {
    if (lyric == null) lyric = new Lyric(reactContext, isShowTranslation);
    lyric.showLyric(Arguments.toBundle(data), promise);
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
    this.isShowTranslation = isShowTranslation;
    if (lyric == null) return;
    lyric.toggleTranslation(isShowTranslation);
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
  public void setAlpha(float alpha) {
    lyric.setAlpha(alpha);
  }

  @ReactMethod
  public void setTextSize(float size) { lyric.setTextSize(size); }

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
