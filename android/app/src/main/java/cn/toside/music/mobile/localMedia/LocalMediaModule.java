package cn.toside.music.mobile.localMedia;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import cn.toside.music.mobile.gzip.Utils;
import cn.toside.music.mobile.utils.TaskRunner;

public class LocalMediaModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  private int listenerCount = 0;

  LocalMediaModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "LocalMediaModule";
  }

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }

    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
    }
  }

  @ReactMethod
  public void scanAudioFiles(String dirPath, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new MetadataCallable.ScanAudioFiles(reactContext, dirPath), promise::resolve);
    } catch (Exception err) {
      promise.reject("-1", err.getMessage());
    }
  }

  @ReactMethod
  public void readMetadata(String filePath, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new MetadataCallable.ReadMetadata(filePath), promise::resolve);
    } catch (Exception err) {
      promise.reject("-1", err.getMessage());
    }
  }

  @ReactMethod
  public void readPic(String filePath, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new MetadataCallable.ReadPic(filePath), promise::resolve);
    } catch (Exception err) {
      promise.reject("-1", err.getMessage());
    }
  }

  @ReactMethod
  public void readLyric(String filePath, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new MetadataCallable.ReadLyric(filePath), promise::resolve);
    } catch (Exception err) {
      promise.reject("-1", err.getMessage());
    }
  }
}
