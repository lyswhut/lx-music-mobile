package com.lxmusicmobile.lyric;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.HashMap;
import java.util.List;

public class Lyric extends LyricPlayer {
  LyricView lyricView = null;

  public void showLyric(ReactApplicationContext reactContext, boolean isLock) {
    if (lyricView == null) {
      lyricView = new LyricView(reactContext);
    }
    lyricView.showLyricView(isLock);
  }

  public void hideLyric() {
    this.pause();
    if (lyricView != null) {
      lyricView.destroy();
      lyricView = null;
    }
  }

  @Override
  public void setLyric(String lyric, String translationLyric) {
    if (lyricView != null) super.setLyric(lyric, translationLyric);
  }

  @Override
  public void onSetLyric(List lines) {
    for (int i = 0; i < lines.size(); i++) {
      HashMap line = (HashMap) lines.get(i);
      Log.e("Lyric", (String) line.get("text") + " " + (String) line.get("translation"));
    }
  }

  @Override
  public void onPlay(int lineNum, String text) {
    HashMap line = (HashMap) lines.get(lineNum);
    if (lyricView == null) return;
    lyricView.setLyric(text);
    Log.e("Lyric", lineNum + " " + text + " " + (String) line.get("translation"));
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

  }
}
