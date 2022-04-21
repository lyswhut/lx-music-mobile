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

import StatusBarLyric.API.StatusBarLyric;

public class Lyric extends LyricPlayer {
  LyricView lyricView = null;
  LyricEvent lyricEvent = null;
  StatusBarLyric statusBarLyric = null;
  ReactApplicationContext reactAppContext;

  boolean isShowLyric = false;
  boolean isUseDesktopLyric = true;
  // String lastText = "LX Music ^-^";
  int lastLine = 0;
  List lines = new ArrayList();
  boolean isShowTranslation;
  String lyricText = "";
  String lyricTransText = "";

  Lyric(ReactApplicationContext reactContext, boolean isShowTranslation) {
    this.reactAppContext = reactContext;
    this.isShowTranslation = isShowTranslation;
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
        String strAction = intent.getAction();

        switch (strAction) {
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

    if (isUseDesktopLyric) {
      if (lyricView != null) {
        lyricView.runOnUiThread(new Runnable() {
          @Override
          public void run() {
            lyricView.destroyView();
          }
        });
      }
    }
  }

  private void handleScreenOn() {
    if (!isShowLyric) return;
    if (isUseDesktopLyric) {
      if (lyricView == null) lyricView = new LyricView(reactAppContext, lyricEvent);
      lyricView.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          lyricView.showLyricView();
          updateLyric(lastLine);
          setTempPause(false);
        }
      });
    } else {
      updateLyric(lastLine);
      setTempPause(false);
    }
  }

  private void updateLyric(int lineNum) {
    lastLine = lineNum;
    if (!isShowLyric) return;
    if (lineNum < 0 || lineNum > lines.size() - 1) return;
    HashMap line = (HashMap) lines.get(lineNum);
    String lineLyric;
    String lineLyricTranslation;
    if (line == null) {
      lineLyric = "";
      lineLyricTranslation = "";
    } else {
      lineLyric = (String) line.get("text");
      lineLyricTranslation = (String) line.get("translation");
    }
    if (isUseDesktopLyric) {
      if (lyricView == null) return;
      lyricView.setLyric(lineLyric, lineLyricTranslation);
    } else {
      if (statusBarLyric == null) return;
      statusBarLyric.updateLyric(lineLyric);
    }
  }

  public void showLyric(Bundle options, Promise promise) {
    if (lyricEvent == null) lyricEvent = new LyricEvent(reactAppContext);
    isUseDesktopLyric = options.getBoolean("isUseDesktopLyric", true);
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

  @Override
  public void setLyric(String lyric, String translationLyric) {
    lyricText = lyric;
    lyricTransText = translationLyric;
    if (lyricView != null) super.setLyric(lyric, isShowTranslation ? translationLyric : "");
  }

  @Override
  public void onSetLyric(List lines) {
    this.lines = lines;
    // for (int i = 0; i < lines.size(); i++) {
      // HashMap line = (HashMap) lines.get(i);
      // Log.d("Lyric", (String) line.get("text") + " " + (String) line.get("translation"));
    // }
  }

  @Override
  public void onPlay(int lineNum) {
    updateLyric(lineNum);
    // Log.d("Lyric", lineNum + " " + text + " " + (String) line.get("translation"));
  }

  public void lockLyric() {
    if (lyricView == null) return;
    lyricView.lockView();
  }

  public void unlockLyric() {
    if (lyricView == null) return;
    lyricView.unlockView();
  }

  public void toggleTranslation(boolean isShowTranslation) {
    this.isShowTranslation = isShowTranslation;
    if (lyricView != null) super.setLyric(lyricText, isShowTranslation ? lyricTransText : "");
  }

  public void setColor(String color) {
    lyricView.setColor(color);
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
      statusBarLyric.updateLyric(lyricText);
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
