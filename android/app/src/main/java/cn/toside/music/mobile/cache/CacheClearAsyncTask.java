package cn.toside.music.mobile.cache;

import android.os.AsyncTask;

import com.facebook.react.bridge.Promise;

// https://github.com/midas-gufei/react-native-clear-app-cache/tree/master/android/src/main/java/com/learnta/clear
public class CacheClearAsyncTask extends AsyncTask<Integer,Integer,String> {
  public CacheModule cacheModule = null;
  public Promise promise;
  public CacheClearAsyncTask(CacheModule clearCacheModule, Promise promise) {
    super();
    this.cacheModule = clearCacheModule;
    this.promise = promise;
  }

  @Override
  protected void onPreExecute() {
    super.onPreExecute();
  }

  @Override
  protected void onPostExecute(String s) {
    super.onPostExecute(s);
    promise.resolve(null);
  }

  @Override
  protected String doInBackground(Integer... params) {
    cacheModule.clearCache();
    return null;
  }
}
