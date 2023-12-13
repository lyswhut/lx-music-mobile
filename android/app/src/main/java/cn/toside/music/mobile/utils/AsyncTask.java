package cn.toside.music.mobile.utils;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Promise;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AsyncTask {
  // https://stackoverflow.com/a/58767934
  private static class TaskRunner {
    private final ExecutorService executor = Executors.newSingleThreadExecutor(); // change according to your requirements
    private final Handler handler = new Handler(Looper.getMainLooper());

    public interface Callback<Object> {
      void onComplete(Object result);
    }

    public <Object> void executeAsync(Callable<Object> callable, Callback<Object> callback) {
      executor.execute(() -> {
        try {
          Object result = callable.call();
          handler.post(() -> callback.onComplete(result));
        } catch (Exception e) {
          handler.post(() -> callback.onComplete((Object) e));
          Log.e("TaskRunner", "execute error: " + e.getMessage());
        }
      });
    }
    public void shutdown() {
      executor.shutdown();
    }
  }

  public static void runTask(Callable<Object> callable, Promise promise) {
    TaskRunner taskRunner = new TaskRunner();
    try {
      taskRunner.executeAsync(callable, (Object result) -> {
        taskRunner.shutdown();
        if (result instanceof Exception) {
          promise.reject("-1", ((Exception) result).getMessage());
        } else promise.resolve(result);
      });
    } catch (Exception err) {
      promise.reject("-1", err.getMessage());
    }
  }
}
