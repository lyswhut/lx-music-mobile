package cn.toside.music.mobile.gzip;

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

  static class UnGzip implements Callable<String> {
    private final String source;
    private final String target;
    private final Boolean force;

    public UnGzip(String source, String target, Boolean force) {
      this.source = source;
      this.target = target;
      this.force = force;
    }

    @Override
    public String call() {
      // Log.d("Gzip", "source: " + source + ", target: " + target);
      File sourceFile = new File(source);
      File targetFile = new File(target);
      if(!Utils.checkDir(sourceFile, targetFile, force)){
        return "error";
      }

      FileInputStream fileInputStream;
      FileOutputStream fileOutputStream;

      try{
        fileInputStream = new FileInputStream(sourceFile);
        fileOutputStream = new FileOutputStream(targetFile);
        final GZIPInputStream gzipInputStream = new GZIPInputStream(fileInputStream);

        final byte[] buffer = new byte[4096];
        int len;
        while((len = gzipInputStream.read(buffer)) != -1){
          fileOutputStream.write(buffer, 0, len);
        }
        //close resources
        fileOutputStream.close();
        gzipInputStream.close();

        return "";
      } catch (IOException e) {
        e.printStackTrace();

        return "unGzip error: " + Throwables.getStackTraceAsString(e);
      }
    }
  }

  static class Gzip implements Callable<String> {
    private final String source;
    private final String target;
    private final Boolean force;

    public Gzip(String source, String target, Boolean force) {
      this.source = source;
      this.target = target;
      this.force = force;
    }

    @Override
    public String call() {
      // Log.d("Gzip", "source: " + source + ", target: " + target);
      File sourceFile = new File(source);
      File targetFile = new File(target);
      // Log.d("Gzip", "sourceFile: " + sourceFile.getAbsolutePath() + ", targetFile: " + targetFile.getAbsolutePath());
      if(!Utils.checkFile(sourceFile, targetFile, force)){
        return "error";
      }

      FileInputStream fileInputStream;
      FileOutputStream fileOutputStream;

      try{
        fileInputStream = new FileInputStream(sourceFile);
        fileOutputStream = new FileOutputStream(targetFile);

        GZIPOutputStream gzipOutputStream = new GZIPOutputStream(fileOutputStream);
        final byte[] buffer = new byte[4096];
        int len;
        while((len= fileInputStream.read(buffer)) != -1){
          gzipOutputStream.write(buffer, 0, len);
        }
        //close resources
        gzipOutputStream.close();
        gzipOutputStream.close();
        fileInputStream.close();

        return "";
      } catch (IOException e) {
        e.printStackTrace();
        return "gzip error: " + source.length() + "\nstack: " + Throwables.getStackTraceAsString(e);
      }
    }
  }

  @ReactMethod
  public void unGzip(String source, String target, Boolean force, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new UnGzip(source, target, force), (String errMessage) -> {
        if ("".equals(errMessage)) {
          promise.resolve(null);
        } else promise.reject("-2", errMessage);
      });
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }

  @ReactMethod
  public void gzip(String source, String target, Boolean force, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(new Gzip(source, target, force), (String errMessage) -> {
        if ("".equals(errMessage)) {
          promise.resolve(null);
        } else promise.reject("-2", errMessage);
      });
    } catch (RuntimeException err) {
      promise.reject("-2", err.getMessage());
    }
  }
}

