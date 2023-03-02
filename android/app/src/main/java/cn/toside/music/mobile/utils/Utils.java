package cn.toside.music.mobile.utils;


import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
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
    FileInputStream fin = new FileInputStream(fl);
    String ret = convertStreamToString(fin);
    //Make sure you close all streams.
    fin.close();
    return ret;
  }

  static class ReadStringFromFile implements Callable<String> {
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
    FileOutputStream fileOutputStream = new FileOutputStream(file);
    fileOutputStream.write(dataString.getBytes());
    fileOutputStream.close();
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
}
