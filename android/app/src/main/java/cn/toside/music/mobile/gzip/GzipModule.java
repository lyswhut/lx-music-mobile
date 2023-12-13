package cn.toside.music.mobile.gzip;

import android.util.Base64;

import com.facebook.common.internal.Throwables;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import cn.toside.music.mobile.utils.AsyncTask;

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
    AsyncTask.runTask(new Utils.UnGzip(base64), promise);
  }

  @ReactMethod
  public void gzipStringToBase64(String data, Promise promise) {
    AsyncTask.runTask(new Utils.Gzip(data), promise);
  }

  @ReactMethod
  public void unGzipFile(String source, String target, Boolean force, Promise promise) {
    AsyncTask.runTask(new Utils.UnGzipFile(source, target, force), promise);
  }

  @ReactMethod
  public void gzipFile(String source, String target, Boolean force, Promise promise) {
    AsyncTask.runTask(new Utils.GzipFile(source, target, force), promise);
  }
}

