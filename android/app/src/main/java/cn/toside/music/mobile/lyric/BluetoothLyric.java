package cn.toside.music.mobile.lyric;

import static java.lang.Integer.min;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

public class BluetoothLyric extends LyricPlayer {
  LyricEvent lyricEvent = null;
  ReactApplicationContext reactAppContext;

  boolean isSendBluetoothLyric = true;
  // String lastText = "LX Music ^-^";
  List lines = new ArrayList();
  String lyricText = "";
  String titleText = "";
  String singerText = "";
  String albumText = "";

  BluetoothLyric(ReactApplicationContext reactContext, float playbackRate) {
    this.reactAppContext = reactContext;
    this.playbackRate = playbackRate;
    this.lyricEvent = new LyricEvent(reactContext);
  }


  private void setLyricToSendBluetooth(int lineNum) {
    if (lineNum >= 0 && lineNum < lines.size()) {
      HashMap line = (HashMap) lines.get(lineNum);
      if (line != null) {
        String fakeSingerLine = titleText + "-" + singerText;
        String lyricLine = (String) line.get("text");
        String lyricShow = lyricLine.substring(0, min(lyricLine.length(), 30));
        String artistShow = fakeSingerLine.substring(0, min(fakeSingerLine.length(), 30));
        String albumShow = albumText.substring(0, min(albumText.length(), 30));
        WritableMap params = Arguments.createMap();
        params.putString("title", lyricShow);
        params.putString("singer", artistShow);
        params.putString("album", albumShow);
        lyricEvent.sendEvent(lyricEvent.SET_BLUETOOTH_LYRIC, params);
        // Log.d("Lyric", "send react-bt lyric " + line.get("text"));
      }
    }
  }


  public void setLyric(String lyric, String title, String singer, String album) {
    lyricText = lyric;
    titleText = title;
    singerText = singer;
    albumText = album;
    super.setLyric(lyric, new ArrayList<String>());
    // Log.d("Lyric", "set bt lyric " + title);
  }

  @Override
  public void onSetLyric(List lines) {
    this.lines = lines;
  }

  @Override
  public void onPlay(int lineNum) {
    // Log.d("Lyric", "bt on play " + lineNum);
    if(this.isSendBluetoothLyric) setLyricToSendBluetooth(lineNum);
  }

  public void pauseLyric() {
    pause();
  }

  public void toggleSendBluetoothLyric(boolean isSendBluetoothLyric) {
    this.isSendBluetoothLyric = isSendBluetoothLyric;
    // Log.d("Lyric", "toggle bt " + isSendBluetoothLyric);
  }
}
