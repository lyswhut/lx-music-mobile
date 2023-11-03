package cn.toside.music.mobile.userApi;

import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import java.lang.Thread;

public class UserApiModule extends ReactContextBaseJavaModule {
  private JavaScriptThread javaScriptThread;
  private final ReactApplicationContext reactContext;
  private UtilsEvent utilsEvent;

  UserApiModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.javaScriptThread = null;
    this.utilsEvent = null;
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "UserApiModule";
  }

  @ReactMethod
  public void loadScript(ReadableMap data) {
    if (this.utilsEvent == null) this.utilsEvent = new UtilsEvent(this.reactContext);
    if (this.javaScriptThread != null) destroy();
    Bundle info = Arguments.toBundle(data);
    this.javaScriptThread = new JavaScriptThread(this.reactContext, info);
    final JsHandler jsHandler = new JsHandler(this.reactContext.getMainLooper(), this.utilsEvent);
    this.javaScriptThread.prepareHandler(jsHandler);
    this.javaScriptThread.getHandler().sendEmptyMessage(HandlerWhat.INIT);
    this.javaScriptThread.setUncaughtExceptionHandler((thread, ex) -> {
      Message message = jsHandler.obtainMessage();
      message.what = HandlerWhat.LOG;
      message.obj = new Object[]{"error", "Uncaught exception in JavaScriptThread: " + ex.getMessage()};
      jsHandler.sendMessage(message);
      Log.e("JavaScriptThread", "Uncaught exception in JavaScriptThread: " + ex.getMessage());
    });
    Log.d("UserApi", "Module Thread id: " + Thread.currentThread().getId());
  }

  @ReactMethod
  public boolean sendAction(String action, String info) {
    JavaScriptThread javaScriptThread = this.javaScriptThread;
    if (javaScriptThread == null) return false;
    Message message = javaScriptThread.getHandler().obtainMessage();
    message.what = HandlerWhat.ACTION;
    message.obj = new Object[]{action, info};
    this.javaScriptThread.getHandler().sendMessage(message);
    return true;
  }

  @ReactMethod
  public void destroy() {
    JavaScriptThread javaScriptThread = this.javaScriptThread;
    if (javaScriptThread == null) {
      return;
    }
    javaScriptThread.stopThread();
    this.javaScriptThread = null;
  }
}
