package cn.toside.music.mobile.utils;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

// https://stackoverflow.com/a/58767934
public class TaskRunner {
  private final Executor executor = Executors.newSingleThreadExecutor(); // change according to your requirements
  private final Handler handler = new Handler(Looper.getMainLooper());

  public interface Callback<R> {
    void onComplete(R result);
  }

  public <R> void executeAsync(Callable<R> callable, Callback<R> callback) {
    executor.execute(() -> {
      final R result;
      try {
        result = callable.call();
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
      handler.post(() -> {
        callback.onComplete(result);
      });
    });
  }
}
