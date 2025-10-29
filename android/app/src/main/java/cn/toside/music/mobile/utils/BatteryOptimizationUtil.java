package cn.toside.music.mobile.utils;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import java.util.List;

public class BatteryOptimizationUtil {

  public static boolean isIgnoringBatteryOptimization(Context context, String packageName) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
      if (pm != null) {
        return pm.isIgnoringBatteryOptimizations(packageName);
      }
      return false;
    }
    return true; // Android 6.0 以下不需要
  }

  /**
   * 请求忽略电池优化
   * @return true: 已忽略或成功打开系统页面；false: 系统不支持或调用失败
   */
  public static boolean requestIgnoreBatteryOptimization(Context context, String packageName) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true;
    }

    PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    if (pm != null && pm.isIgnoringBatteryOptimizations(packageName)) {
      return true;
    }

    @SuppressLint("BatteryLife")
    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
    intent.setData(Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

    PackageManager pmgr = context.getPackageManager();
    List<ResolveInfo> resolveInfos = pmgr.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
    if (resolveInfos.isEmpty()) {
      Log.w("BatteryOptimizationUtil", "No Activity found to handle ignore battery optimization intent");
      return false;
    }

    try {
      context.startActivity(intent);
      return true;
    } catch (Exception e) {
      Log.e("BatteryOptimizationUtil", "Failed to start ignore battery optimization intent", e);
      return false;
    }
  }
}
