package cn.toside.music.mobile.localMedia;

import android.media.MediaScannerConnection;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;

import java.io.File;
import java.io.FilenameFilter;
import java.util.Objects;

public class Utils {
  private static class MediaFileFilter implements FilenameFilter {
    @Override
    public boolean accept(File dir, String name) {
      String lowercaseName = name.toLowerCase();
      return lowercaseName.endsWith(".mp3")
        || lowercaseName.endsWith(".flac")
        || lowercaseName.endsWith(".ogg")
        || lowercaseName.endsWith(".wav");
    }
  }

  public static WritableArray scanAudioFiles(ReactApplicationContext context, String directoryPath) {
    File dir = new File(directoryPath);

    WritableArray audioFilePaths = Arguments.createArray();

    if (dir.exists()) {
      File[] mediaFiles = dir.listFiles(new MediaFileFilter());
      assert mediaFiles != null;
      for (File file: mediaFiles) {
        if (file.isFile()) audioFilePaths.pushString(file.getAbsolutePath());
      }
      // if (mediaFiles.length > 0) {
      //   String[] filePaths = new String[mediaFiles.length];
      //   for (int i = 0; i < mediaFiles.length; i++) {
      //     filePaths[i] = mediaFiles[i].getAbsolutePath();
      //     Log.d("MediaScanner", filePaths[i]);
      //   }
      //   MediaScannerConnection.scanFile(context, filePaths, null,
      //     (path, uri) -> {
      //       audioFilePaths.pushString(path);
      //       Log.d("MediaScanner", "Scanned " + path + ":");
      //       Log.d("MediaScanner", "-> uri=" + uri);
      //     });
      // }
    }
    return audioFilePaths;
  }
}
