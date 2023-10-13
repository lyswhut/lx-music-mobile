package cn.toside.music.mobile.gzip;


import static cn.toside.music.mobile.utils.Utils.deletePath;

import android.util.Base64;
import android.util.Log;

import com.facebook.common.internal.Throwables;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Callable;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

// https://github.com/FWC1994/react-native-gzip/blob/main/android/src/main/java/com/reactlibrary/GzipModule.java
public class Utils {
  static public Boolean checkDir(File sourceFile, File targetFile, Boolean force) {
    if (!sourceFile.exists()) {
      return false;
    }

    if (targetFile.exists()) {
      if (!force) {
        return false;
      }

      deletePath(targetFile);
      // targetFile.mkdirs();
    }
    return true;
  }

  static public Boolean checkFile(File sourceFile, File targetFile, Boolean force) {
    if (!sourceFile.exists()) {
      return false;
    }

    if (targetFile.exists()) {
      if (!force) {
        return false;
      }

      deletePath(targetFile);
    }
    return true;
  }

  static class UnGzipFile implements Callable<String> {
    private final String source;
    private final String target;
    private final Boolean force;

    public UnGzipFile(String source, String target, Boolean force) {
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
        fileInputStream.close();

        return "";
      } catch (IOException e) {
        e.printStackTrace();

        return "unGzip error: " + Throwables.getStackTraceAsString(e);
      }
    }
  }

  static class GzipFile implements Callable<String> {
    private final String source;
    private final String target;
    private final Boolean force;

    public GzipFile(String source, String target, Boolean force) {
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
        fileInputStream.close();
        fileOutputStream.close();

        return "";
      } catch (IOException e) {
        e.printStackTrace();
        return "gzip error: " + source.length() + "\nstack: " + Throwables.getStackTraceAsString(e);
      }
    }
  }

  static class UnGzip implements Callable<String> {
    private final byte[] data;

    public UnGzip(String data) {
      this.data = Base64.decode(data, Base64.DEFAULT);
    }

    @Override
    public String call() throws IOException {
      // Log.d("Gzip", "source: " + source + ", target: " + target);
      final int BUFFER_SIZE = 1024;
      ByteArrayInputStream is = new ByteArrayInputStream(data);
      GZIPInputStream gis = new GZIPInputStream(is, BUFFER_SIZE);
      BufferedReader bf = new BufferedReader(new InputStreamReader(gis, StandardCharsets.UTF_8));
      final StringBuilder outStr = new StringBuilder();
      String line;
      while ((line = bf.readLine()) != null) {
        outStr.append(line);
      }
      gis.close();
      is.close();
      bf.close();
      return outStr.toString();
    }
  }

  static class Gzip implements Callable<String> {
    private final String data;

    public Gzip(String data) {
      this.data = data;
    }

    @Override
    public String call() throws IOException {
      ByteArrayOutputStream os = new ByteArrayOutputStream(data.length());
      GZIPOutputStream gos = new GZIPOutputStream(os);
      gos.write(data.getBytes(StandardCharsets.UTF_8));
      gos.close();
      byte[] compressed = os.toByteArray();
      os.close();
      return Base64.encodeToString(compressed, Base64.NO_WRAP);
    }
  }
}
