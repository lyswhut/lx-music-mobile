package cn.toside.music.mobile.lyric;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

import StatusBarLyric.API.StatusBarLyric;

public class Lyric extends LyricPlayer {
  LyricView lyricView = null;
  LyricEvent lyricEvent = null;
  StatusBarLyric statusBarLyric = null;
  ReactApplicationContext reactAppContext;

  boolean isShowLyric = false;
  boolean isUseDesktopLyric = true;
  boolean isAutoPause = true;
  // String lastText = "LX Music ^-^";
  int lastLine = 0;
  List lines = new ArrayList();
  boolean isShowTranslation;
  boolean isShowRoma;
  String lyricText = "";
  String translationText = "";
  String romaLyricText = "";

  Lyric(ReactApplicationContext reactContext, boolean isShowTranslation, boolean isShowRoma, float playbackRate) {
    this.reactAppContext = reactContext;
    this.isShowTranslation = isShowTranslation;
    this.isShowRoma = isShowRoma;
    this.playbackRate = playbackRate;
    registerScreenBroadcastReceiver();
  }

  private void registerScreenBroadcastReceiver() {
    final IntentFilter theFilter = new IntentFilter();
    /** System Defined Broadcast */
    theFilter.addAction(Intent.ACTION_SCREEN_ON);
    theFilter.addAction(Intent.ACTION_SCREEN_OFF);

    BroadcastReceiver screenOnOffReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (!isAutoPause) return;
        String strAction = intent.getAction();

        switch (Objects.requireNonNull(strAction)) {
          case Intent.ACTION_SCREEN_OFF:
            Log.d("Lyric", "ACTION_SCREEN_OFF");
            handleScreenOff();
            break;
          case Intent.ACTION_SCREEN_ON:
            Log.d("Lyric", "ACTION_SCREEN_ON");
            handleScreenOn();
            break;
        }
      }
    };

    reactAppContext.registerReceiver(screenOnOffReceiver, theFilter);
  }

  private void handleScreenOff() {
    if (!isShowLyric) return;
    setTempPause(true);

    if (isUseDesktopLyric && lyricView != null) {
      lyricView.runOnUiThread(() -> {
        lyricView.destroyView();
      });
    }
  }

  private void handleScreenOn() {
    if (!isShowLyric) return;
    if (isUseDesktopLyric) {
      if (lyricView == null) lyricView = new LyricView(reactAppContext, lyricEvent);
      lyricView.runOnUiThread(() -> {
        lyricView.showLyricView();
        updateLyric(lastLine);
        setTempPause(false);
      });
    } else {
      updateLyric(lastLine);
      setTempPause(false);
    }
  }

  private void updateLyric(int lineNum) {
    lastLine = lineNum;
    if (!isShowLyric) return;
    String lineLyric;
    ArrayList<String> extendedLyrics;
    if (lineNum < 0 || lineNum > lines.size() - 1) {
      lineLyric = "";
      extendedLyrics = new ArrayList<>(0);
    } else {
      HashMap line = (HashMap) lines.get(lineNum);
      if (line == null) {
        lineLyric = "";
        extendedLyrics = new ArrayList<>(0);
      } else {
        lineLyric = (String) line.get("text");
        extendedLyrics = (ArrayList<String>) line.get("extendedLyrics");
      }
    }

    if (isUseDesktopLyric) {
      if (lyricView == null) return;
      lyricView.setLyric(lineLyric, extendedLyrics);
    } else {
      if (statusBarLyric == null) return;
      statusBarLyric.updateLyric(lineLyric);
    }
  }

  public void showLyric(Bundle options, Promise promise) {
    if (lyricEvent == null) lyricEvent = new LyricEvent(reactAppContext);
    hideLyric();
    isUseDesktopLyric = options.getBoolean("isUseDesktopLyric", true);
    isAutoPause = options.getBoolean("isAutoPause", true);
    if (isUseDesktopLyric) {
      showDesktopLyric(options, promise);
    } else {
      showStatusBarLyric(options, promise);
    }
  }

  public void hideLyric() {
    this.pause();
    if (isUseDesktopLyric) {
      hideViewLyric();
    } else {
      hideStatusBarLyric();
    }
  }

  private void refreshLyric() {
    ArrayList<String> extendedLyrics = new ArrayList<>(2);
    if (isShowTranslation && !"".equals(translationText)) extendedLyrics.add(translationText);
    if (isShowRoma && !"".equals(romaLyricText)) extendedLyrics.add(romaLyricText);
    if (isShowLyric) super.setLyric(lyricText, extendedLyrics);
  }

  public void setLyric(String lyric, String translation, String romaLyric) {
    lyricText = lyric;
    translationText = translation;
    romaLyricText = romaLyric;
    refreshLyric();
  }

  @Override
  public void onSetLyric(List lines) {
    this.lines = lines;
    updateLyric(-1);
    // for (int i = 0; i < lines.size(); i++) {
    //   HashMap line = (HashMap) lines.get(i);
    //   Log.d("Lyric", "onSetLyric: " +(String) line.get("text") + " " + line.get("extendedLyrics"));
    // }
  }

  @Override
  public void onPlay(int lineNum) {
    updateLyric(lineNum);
    // Log.d("Lyric", lineNum + " " + text + " " + (String) line.get("translation"));
  }

  public void pauseLyric() {
    pause();
    if (!isShowLyric) return;
    if (isUseDesktopLyric) {
      if (lyricView != null) lyricView.setLyric("", new ArrayList<>(0));
    } else {
      if (statusBarLyric != null) statusBarLyric.stopLyric();
    }
  }

  public void toggleAutoPause(boolean isAutoPause) {
    this.isAutoPause = isAutoPause;
  }

  public void lockLyric() {
    if (lyricView == null) return;
    lyricView.lockView();
  }

  public void unlockLyric() {
    if (lyricView == null) return;
    lyricView.unlockView();
  }

  public void setMaxLineNum(int maxLineNum) {
    if (lyricView == null) return;
    lyricView.setMaxLineNum(maxLineNum);
  }

  public void setWidth(int width) {
    if (lyricView == null) return;
    lyricView.setWidth(width);
  }

  public void setSingleLine(boolean singleLine) {
    if (lyricView == null) return;
    lyricView.setSingleLine(singleLine);
  }

  public void setShowToggleAnima(boolean showToggleAnima) {
    if (lyricView == null) return;
    lyricView.setShowToggleAnima(showToggleAnima);
  }

  public void toggleTranslation(boolean isShowTranslation) {
    this.isShowTranslation = isShowTranslation;
    refreshLyric();
  }

  public void toggleRoma(boolean isShowRoma) {
    this.isShowRoma = isShowRoma;
    refreshLyric();
  }

  public void setPlayedColor(String unplayColor, String playedColor, String shadowColor) {
    lyricView.setColor(unplayColor, playedColor, shadowColor);
  }

  public void setAlpha(float alpha) { lyricView.setAlpha(alpha); }

  public void setTextSize(float size) { lyricView.setTextSize(size); }

  public void setLyricTextPosition(String positionX, String positionY) {
    lyricView.setLyricTextPosition(positionX, positionY);
  }

  public void setUseDesktopLyric(boolean enable, Bundle options, Promise promise) {
    if (isShowLyric) {
      if (isUseDesktopLyric) {
        hideViewLyric();
      } else {
        hideStatusBarLyric();
      }
    }
    isUseDesktopLyric = enable;
    if (enable) {
      showDesktopLyric(options, promise);
    } else {
      showStatusBarLyric(options, promise);
    }
  }

  public void showDesktopLyric (Bundle options, Promise promise) {
    if (lyricView == null) lyricView = new LyricView(reactAppContext, lyricEvent);
    try {
      lyricView.showLyricView(options);
    } catch (Exception e) {
      promise.reject(e);
      Log.e("Lyric", e.getMessage());
      return;
    }
    isShowLyric = true;
    promise.resolve(null);
  }

  public void hideViewLyric() {
    if (lyricView != null) {
      lyricView.destroy();
    }
    isShowLyric = false;
  }

  public void showStatusBarLyric(Bundle options, Promise promise) {
    if (statusBarLyric == null) {
      statusBarLyric = new StatusBarLyric(reactAppContext, null, reactAppContext.getPackageName(), false);
    }
    if (statusBarLyric.hasEnable()) {
      // statusBarLyric.updateLyric(lyricText);
      isShowLyric = true;
      promise.resolve(null);
    } else {
      isShowLyric = false;
      promise.reject(new Exception("statusBar lyric disabled"));
    }
  }

  public void hideStatusBarLyric() {
    if (statusBarLyric != null) {
      statusBarLyric.stopLyric();
    }
    isShowLyric = false;
  }
}
