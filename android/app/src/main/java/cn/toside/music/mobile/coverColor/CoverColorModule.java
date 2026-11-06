package cn.toside.music.mobile.coverColor;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 提取图片的主色调，用于播放详情页的纯色渐变背景
 */
public class CoverColorModule extends ReactContextBaseJavaModule {

  // 串行执行，避免快速切歌时同时解码多张大图导致内存暴涨/卡死
  private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
  // 解码目标尺寸，取色只需要很小的图片
  private static final int MAX_BITMAP_SIZE = 64;

  public CoverColorModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "CoverColorModule";
  }

  @ReactMethod
  public void getColor(String url, ReadableMap headers, Promise promise) {
    EXECUTOR.execute(() -> {
      Bitmap bitmap = null;
      try {
        bitmap = loadBitmap(url, headers);
        if (bitmap == null) {
          resolveError(promise, "Failed to load image");
          return;
        }
        try {
          promise.resolve(calcAverageColor(bitmap));
        } catch (Throwable ignored) {
          // JS 上下文已销毁时 resolve 会抛异常，忽略即可
        }
      } catch (Throwable e) {
        resolveError(promise, e.getMessage());
      } finally {
        if (bitmap != null && !bitmap.isRecycled()) bitmap.recycle();
      }
    });
  }

  private void resolveError(Promise promise, String message) {
    try {
      promise.reject("E_LOAD_IMAGE", message);
    } catch (Throwable ignored) {}
  }

  private InputStream openStream(String url, ReadableMap headers) throws Exception {
    if (url.startsWith("file://")) {
      return new FileInputStream(Uri.decode(url.substring(7)));
    }
    if (url.startsWith("content://")) {
      return getReactApplicationContext().getContentResolver().openInputStream(Uri.parse(url));
    }
    HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
    connection.setConnectTimeout(8000);
    connection.setReadTimeout(8000);
    if (headers != null) {
      ReadableMapKeySetIterator iterator = headers.keySetIterator();
      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        if (headers.getType(key) == ReadableType.String) {
          connection.setRequestProperty(key, headers.getString(key));
        }
      }
    }
    connection.connect();
    return connection.getInputStream();
  }

  private byte[] readBytes(InputStream inputStream) throws Exception {
    try {
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      byte[] chunk = new byte[8192];
      int read;
      while ((read = inputStream.read(chunk)) != -1) buffer.write(chunk, 0, read);
      return buffer.toByteArray();
    } finally {
      inputStream.close();
    }
  }

  private Bitmap loadBitmap(String url, ReadableMap headers) throws Exception {
    byte[] data = readBytes(openStream(url, headers));

    // 先读取图片尺寸，再按采样率缩小解码，避免把大图完整加载进内存
    BitmapFactory.Options bounds = new BitmapFactory.Options();
    bounds.inJustDecodeBounds = true;
    BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null;

    int sampleSize = 1;
    while (bounds.outWidth / sampleSize > MAX_BITMAP_SIZE * 2 ||
        bounds.outHeight / sampleSize > MAX_BITMAP_SIZE * 2) {
      sampleSize *= 2;
    }

    BitmapFactory.Options options = new BitmapFactory.Options();
    options.inSampleSize = sampleSize;
    options.inPreferredConfig = Bitmap.Config.RGB_565;
    return BitmapFactory.decodeByteArray(data, 0, data.length, options);
  }

  /**
   * 缩放成 16x16 后取像素平均值，跳过纯白（背景/边框）与透明像素
   */
  private String calcAverageColor(Bitmap bitmap) {
    Bitmap small = Bitmap.createScaledBitmap(bitmap, 16, 16, true);
    long red = 0, green = 0, blue = 0, count = 0;
    for (int x = 0; x < 16; x++) {
      for (int y = 0; y < 16; y++) {
        int pixel = small.getPixel(x, y);
        if (Color.alpha(pixel) < 25) continue;
        int r = Color.red(pixel);
        int g = Color.green(pixel);
        int b = Color.blue(pixel);
        if (r > 245 && g > 245 && b > 245) continue;
        red += r;
        green += g;
        blue += b;
        count++;
      }
    }
    if (small != bitmap) small.recycle();
    if (count == 0) return "#000000";
    return String.format("#%02X%02X%02X", red / count, green / count, blue / count);
  }
}
