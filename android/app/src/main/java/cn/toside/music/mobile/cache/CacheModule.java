package cn.toside.music.mobile.cache;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

import static cn.toside.music.mobile.cache.Utils.clearCacheFolder;
import static cn.toside.music.mobile.cache.Utils.getDirSize;
import static cn.toside.music.mobile.cache.Utils.isMethodsCompat;

// https://github.com/midas-gufei/react-native-clear-app-cache/tree/master/android/src/main/java/com/learnta/clear
public class CacheModule extends ReactContextBaseJavaModule {
  private final CacheModule cacheModule;

  CacheModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.cacheModule = this;
  }

  @Override
  public String getName() {
    return "CacheModule";
  }


  @ReactMethod
  public void getAppCacheSize(Promise promise) {
    // 计算缓存大小
    long fileSize = 0;
    // File filesDir = getReactApplicationContext().getFilesDir();// /data/data/package_name/files
    File cacheDir = getReactApplicationContext().getCacheDir();// /data/data/package_name/cache
    // fileSize += getDirSize(filesDir);
    fileSize += getDirSize(cacheDir);
    // 2.2版本才有将应用缓存转移到sd卡的功能
    if (isMethodsCompat(android.os.Build.VERSION_CODES.FROYO)) {
      File externalCacheDir = Utils.getExternalCacheDir(getReactApplicationContext());//"<sdcard>/Android/data/<package_name>/cache/"
      fileSize += getDirSize(externalCacheDir);
    }

    promise.resolve(String.valueOf(fileSize));
  }

  //清除缓存
  @ReactMethod
  public void clearAppCache(Promise promise) {
    CacheClearAsyncTask asyncTask = new CacheClearAsyncTask(cacheModule, promise);
    asyncTask.execute(10);
  }

  /**
   * 清除app缓存
   */
  public void clearCache() {

    getReactApplicationContext().deleteDatabase("webview.db");
    getReactApplicationContext().deleteDatabase("webview.db-shm");
    getReactApplicationContext().deleteDatabase("webview.db-wal");
    getReactApplicationContext().deleteDatabase("webviewCache.db");
    getReactApplicationContext().deleteDatabase("webviewCache.db-shm");
    getReactApplicationContext().deleteDatabase("webviewCache.db-wal");
    //清除数据缓存
    // clearCacheFolder(getReactApplicationContext().getFilesDir(), System.currentTimeMillis());
    clearCacheFolder(getReactApplicationContext().getCacheDir(), System.currentTimeMillis());
    //2.2版本才有将应用缓存转移到sd卡的功能
    if (isMethodsCompat(android.os.Build.VERSION_CODES.FROYO)) {
      clearCacheFolder(Utils.getExternalCacheDir(getReactApplicationContext()), System.currentTimeMillis());
    }

  }

}
