package com.lxmusicmobile.gzip;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;

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

      try {
        if (targetFile.isDirectory()) {
          FileUtils.deleteDirectory(targetFile);
        } else {
          targetFile.delete();
        }
        targetFile.mkdirs();
      } catch (IOException ex) {
        return false;
      }
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

      if (targetFile.isFile()) {
        targetFile.delete();
      }
    }
    return true;
  }
}
