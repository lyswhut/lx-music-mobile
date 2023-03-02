package cn.toside.music.mobile.gzip;


import static cn.toside.music.mobile.utils.Utils.deletePath;

import java.io.File;

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
}
