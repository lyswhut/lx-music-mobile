package com.lxmusicmobile.utils;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;

import java.io.File;

public class UtilsModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  UtilsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "UtilsModule";
  }

  @ReactMethod
  public void exitApp() {
    // https://github.com/wumke/react-native-exit-app/blob/master/android/src/main/java/com/github/wumke/RNExitApp/RNExitAppModule.java
    android.os.Process.killProcess(android.os.Process.myPid());
  }

  @ReactMethod
  public void getSupportedAbis(Promise promise) {
    // https://github.com/react-native-device-info/react-native-device-info/blob/ff8f672cb08fa39a887567d6e23e2f08778e8340/android/src/main/java/com/learnium/RNDeviceInfo/RNDeviceModule.java#L877
    WritableArray array = new WritableNativeArray();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      for (String abi : Build.SUPPORTED_ABIS) {
        array.pushString(abi);
      }
    } else {
      array.pushString(Build.CPU_ABI);
    }
    promise.resolve(array);
  }

  @ReactMethod
  public void installApk(String filePath, String fileProviderAuthority, Promise promise) {
    // https://github.com/mikehardy/react-native-update-apk/blob/master/android/src/main/java/net/mikehardy/rnupdateapk/RNUpdateAPK.java
    File file = new File(filePath);
    if (!file.exists()) {
      Log.e("Utils", "installApk: file doe snot exist '" + filePath + "'");
      // FIXME this should take a promise and fail it
      promise.reject("Utils", "installApk: file doe snot exist '" + filePath + "'");
      return;
    }

    if (Build.VERSION.SDK_INT >= 24) {
      // API24 and up has a package installer that can handle FileProvider content:// URIs
      Uri contentUri;
      try {
        contentUri = FileProvider.getUriForFile(getReactApplicationContext(), fileProviderAuthority, file);
      } catch (Exception e) {
        // FIXME should be a Promise.reject really
        Log.e("Utils", "installApk exception with authority name '" + fileProviderAuthority + "'", e);
        promise.reject("Utils", "installApk exception with authority name '" + fileProviderAuthority + "'");
        return;
        // throw e;
      }
      Intent installApp = new Intent(Intent.ACTION_INSTALL_PACKAGE);
      installApp.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      installApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      installApp.setData(contentUri);
      installApp.putExtra(Intent.EXTRA_INSTALLER_PACKAGE_NAME, reactContext.getApplicationInfo().packageName);
      reactContext.startActivity(installApp);
      promise.resolve(null);
    } else {
      // Old APIs do not handle content:// URIs, so use an old file:// style
      String cmd = "chmod 777 " + file;
      try {
        Runtime.getRuntime().exec(cmd);
      } catch (Exception e) {
        // e.printStackTrace();
        Log.e("Utils", "installApk exception : " + e.getMessage(), e);
        promise.reject("Utils", e.getMessage());
      }
      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.setDataAndType(Uri.parse("file://" + file), "application/vnd.android.package-archive");
      reactContext.startActivity(intent);
      promise.resolve(null);
    }
  }
}

