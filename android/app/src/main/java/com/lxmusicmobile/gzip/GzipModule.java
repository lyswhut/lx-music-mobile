package com.lxmusicmobile.gzip;

import static org.apache.commons.compress.compressors.CompressorStreamFactory.GZIP;

import com.facebook.common.internal.Throwables;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import org.apache.commons.compress.compressors.CompressorException;
import org.apache.commons.compress.compressors.CompressorInputStream;
import org.apache.commons.compress.compressors.CompressorStreamFactory;
import org.apache.commons.compress.compressors.gzip.GzipCompressorOutputStream;
import org.apache.commons.compress.utils.IOUtils;
import org.apache.commons.io.FileUtils;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

// https://github.com/FWC1994/react-native-gzip/blob/main/android/src/main/java/com/reactlibrary/GzipModule.java
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
  public void unGzip(String source, String target, Boolean force, Promise promise) {
    File sourceFile = new File(source);
    File targetFile = new File(target);
    if(!Utils.checkDir(sourceFile, targetFile, force)){
      promise.reject("-2", "error");
      return;
    }

    FileInputStream fileInputStream;

    try{
      fileInputStream = FileUtils.openInputStream(sourceFile);
      final CompressorInputStream compressorInputStream = new CompressorStreamFactory()
        .createCompressorInputStream(GZIP, fileInputStream);

      final FileOutputStream outputStream = FileUtils.openOutputStream(targetFile);
      IOUtils.copy(compressorInputStream, outputStream);
      outputStream.close();

      WritableMap map = Arguments.createMap();
      map.putString("path", targetFile.getAbsolutePath());
      promise.resolve(map);
    } catch (IOException | CompressorException e) {
      e.printStackTrace();
      promise.reject("-2", "unGzip error: " + Throwables.getStackTraceAsString(e));
    }
  }

  @ReactMethod
  public void gzip(String source, String target, Boolean force, Promise promise) {
    File sourceFile = new File(source);
    File targetFile = new File(target);
    if(!Utils.checkFile(sourceFile, targetFile, force)){
      promise.reject("-2", "error");
      return;
    }

    FileInputStream fileInputStream;
    FileOutputStream fileOutputStream;

    try{
      fileInputStream = FileUtils.openInputStream(sourceFile);
      fileOutputStream = FileUtils.openOutputStream(targetFile);

      BufferedOutputStream out = new BufferedOutputStream(fileOutputStream);
      GzipCompressorOutputStream gzOut = new GzipCompressorOutputStream(out);
      final byte[] buffer = new byte[2048];
      int n = 0;
      while (-1 != (n = fileInputStream.read(buffer))) {
        gzOut.write(buffer, 0, n);
      }
      gzOut.close();
      fileInputStream.close();

      WritableMap map = Arguments.createMap();
      map.putString("path", targetFile.getAbsolutePath());
      promise.resolve(map);
    } catch (IOException e) {
      e.printStackTrace();
      promise.reject("-2", "gzip error: " + source.length() + "\nstack: " + Throwables.getStackTraceAsString(e));
    }
  }
}

