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
//  public static boolean deletePath(File dir) {
//    if (dir.isDirectory()) {
//      String[] children = dir.list();
//      for (int i=0; i< children.length; i++) {
//        boolean success = deletePath(new File(dir, children[i]));
//        if (!success) {
//          return false;
//        }
//      }
//    }
//
//    // The directory is now empty so delete it
//    return dir.delete();
//  }
}
