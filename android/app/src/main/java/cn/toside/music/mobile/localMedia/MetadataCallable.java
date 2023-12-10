package cn.toside.music.mobile.localMedia;

import android.os.Handler;
import android.os.HandlerThread;
import android.os.Message;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.zip.GZIPInputStream;

public class MetadataCallable {
  static class ReadMetadata implements Callable<WritableMap> {
    private final String filePath;
    public ReadMetadata(String filePath) {
      this.filePath = filePath;
    }
    @Override
    public WritableMap call() {
      try {
        return Metadata.readMetadata(this.filePath);
      } catch (Exception err) {
        Log.e("ReadMetadata", "Read Metadata Error: " + err.getMessage());
        return null;
      }
    }
  }

  static class ReadPic implements Callable<String> {
    private final String filePath;
    public ReadPic(String filePath) {
      this.filePath = filePath;
    }
    @Override
    public String call() {
      try {
        return Metadata.readPic(this.filePath);
      } catch (Exception err) {
        Log.e("ReadMetadata", "Read Pic Error: " + err.getMessage());
        return "";
      }
    }
  }

  static class ReadLyric implements Callable<String> {
    private final String filePath;
    public ReadLyric(String filePath) {
      this.filePath = filePath;
    }
    @Override
    public String call() {
      try {
        return Metadata.readLyric(this.filePath);
      } catch (Exception err) {
        Log.e("ReadMetadata", "Read Lyric Error: " + err.getMessage());
        return "";
      }
    }
  }

  static class ScanAudioFiles implements Callable<WritableArray> {
    private final ReactApplicationContext context;
    private final String dirPath;
    public ScanAudioFiles(ReactApplicationContext context, String dirPath) {
      this.context = context;
      this.dirPath = dirPath;
    }

    @Override
    public WritableArray call() {
      try {
        return Utils.scanAudioFiles(this.context, this.dirPath);
      } catch (Exception err) {
        return Arguments.createArray();
      }
    }
  }
}
