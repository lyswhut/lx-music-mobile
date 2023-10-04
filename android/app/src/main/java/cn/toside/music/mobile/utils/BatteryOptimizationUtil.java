package cn.toside.music.mobile.utils;

import static android.content.Context.POWER_SERVICE;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

public class BatteryOptimizationUtil {
  public static boolean isIgnoringBatteryOptimization(Context context, String packageName) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PowerManager powerManager = (PowerManager) context.getSystemService(POWER_SERVICE);
      return powerManager.isIgnoringBatteryOptimizations(packageName);
    } else {
      return true;
    }
  }

  public static boolean requestIgnoreBatteryOptimization(Context context, String packageName) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      @SuppressLint("BatteryLife") Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
      intent.setData(Uri.parse("package:" + packageName));
      try {
        context.startActivity(intent);
        return true;
      } catch (Exception ignored) {}
      try {
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return true;
      } catch (Exception ignored) {}
      return false;
    }
    return true;
  }
}
