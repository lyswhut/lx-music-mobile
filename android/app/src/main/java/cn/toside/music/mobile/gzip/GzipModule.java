package cn.toside.music.mobile.gzip;

import android.util.Base64;

import com.facebook.common.internal.Throwables;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.concurrent.Callable;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import cn.toside.music.mobile.utils.TaskRunner;

// https://github.com/FWC1994/react-native-gzip/blob/main/android/src/main/java/com/reactlibrary/GzipModule.java
// https://www.digitalocean.com/community/tutorials/java-gzip-example-compress-decompress-file
// https://github.com/ammarahm-ed/react-native-gzip/blob/master/android/src/main/java/com/gzip/GzipModule.java
public class GzipModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  GzipModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "GzipModule";
  }

  @ReactMethod
  public void unGzipFromBase64(String base64, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new Utils.UnGzip(base64), promise::resolve);
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }

  @ReactMethod
  public void gzipStringToBase64(String data, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new Utils.Gzip(data), promise::resolve);
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }

  @ReactMethod
  public void unGzipFile(String source, String target, Boolean force, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new Utils.UnGzipFile(source, target, force), (String errMessage) -> {
        if ("".equals(errMessage)) {
          promise.resolve(null);
        } else promise.reject("-2", errMessage);
      });
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }

  @ReactMethod
  public void gzipFile(String source, String target, Boolean force, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new Utils.GzipFile(source, target, force), (String errMessage) -> {
        if ("".equals(errMessage)) {
          promise.resolve(null);
        } else promise.reject("-2", errMessage);
      });
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }
}

