package cn.toside.music.mobile.utils;


import android.content.Context;
import android.os.storage.StorageManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Objects;
import java.util.concurrent.Callable;

public class Utils {
  public static boolean deletePath(File dir) {
    if (dir.isDirectory()) {
      String[] children = dir.list();
      for (int i=0; i< children.length; i++) {
        boolean success = deletePath(new File(dir, children[i]));
        if (!success) {
          return false;
        }
      }
    }

    // The directory is now empty so delete it
    return dir.delete();
  }

  // https://gist.github.com/PauloLuan/4bcecc086095bce28e22?permalink_comment_id=2591001#gistcomment-2591001
  public static ArrayList<String> getExternalStoragePath(ReactApplicationContext mContext, boolean is_removable) {
    StorageManager mStorageManager = (StorageManager) mContext.getSystemService(Context.STORAGE_SERVICE);
    Class<?> storageVolumeClazz;
    ArrayList<String> paths = new ArrayList<>();
    try {
      storageVolumeClazz = Class.forName("android.os.storage.StorageVolume");
      Method getVolumeList = mStorageManager.getClass().getMethod("getVolumeList");
      Method getPath = storageVolumeClazz.getMethod("getPath");
      Method isRemovable = storageVolumeClazz.getMethod("isRemovable");
      Object result = getVolumeList.invoke(mStorageManager);
      final int length = Array.getLength(result);
      for (int i = 0; i < length; i++) {
        Object storageVolumeElement = Array.get(result, i);
        String path = (String) getPath.invoke(storageVolumeElement);
        boolean removable = (Boolean) isRemovable.invoke(storageVolumeElement);
        if (is_removable == removable) {
          paths.add(path);
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
    return paths;
  }

  public static String convertStreamToString(InputStream is) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    StringBuilder sb = new StringBuilder();
    String line = null;
    while ((line = reader.readLine()) != null) {
      sb.append(line).append("\n");
    }
    reader.close();
    return sb.toString();
  }

  // https://stackoverflow.com/a/13357785
  public static String getStringFromFile (String filePath) throws Exception {
    File fl = new File(filePath);
    if (!fl.exists()) return "";
    FileInputStream fin = new FileInputStream(fl);
    String ret = convertStreamToString(fin);
    //Make sure you close all streams.
    fin.close();
    return ret;
  }

  static class ReadStringFromFile implements Callable<Object> {
    private final String filePath;

    public ReadStringFromFile(String filePath) {
      this.filePath = filePath;
    }

    @Override
    public String call() throws Exception {
      return getStringFromFile(filePath);
    }
  }

  private static void writeToFile(String filePath, String dataString) throws IOException {
    File file = new File(filePath);
    deletePath(file);
    try (FileOutputStream fileOutputStream = new FileOutputStream(file)){
      fileOutputStream.write(dataString.getBytes());
    }
  }

  static class WriteStringToFile implements Callable<Object> {
    private final String filePath;
    private final String dataString;

    public WriteStringToFile(String filePath, String dataString) {
      this.filePath = filePath;
      this.dataString = dataString;
    }

    @Override
    public Object call() throws Exception {
      writeToFile(filePath, dataString);
      return null;
    }
  }

  private static void deleteRecursive(File fileOrDirectory) {
    if (fileOrDirectory.isDirectory()) {
      for (File child : Objects.requireNonNull(fileOrDirectory.listFiles())) {
        deleteRecursive(child);
      }
    }

    fileOrDirectory.delete();
  }
  public static void unlink(String filepath) {
    deleteRecursive(new File(filepath));
  }
  static class Unlink implements Callable<Object> {
    private final String filePath;

    public Unlink(String filePath) {
      this.filePath = filePath;
    }

    @Override
    public Object call() {
      unlink(filePath);
      return null;
    }
  }
}
