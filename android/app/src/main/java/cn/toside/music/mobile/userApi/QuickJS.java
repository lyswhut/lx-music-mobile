package cn.toside.music.mobile.userApi;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Base64;
import android.util.Log;
import cn.toside.music.mobile.crypto.AES;
import cn.toside.music.mobile.crypto.RSA;
import com.facebook.react.bridge.ReactApplicationContext;

import com.whl.quickjs.android.QuickJSLoader;
import com.whl.quickjs.wrapper.JSCallFunction;
import com.whl.quickjs.wrapper.QuickJSContext;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import okhttp3.HttpUrl;

public class QuickJS {
  private final Handler eventHandler;
  private String key;
  private final ReactApplicationContext reactContext;
  private boolean isInited = false;
  private QuickJSContext jsContext = null;
  final Handler timeoutHandler = new Handler();
  private boolean inited = false;

  public QuickJS(ReactApplicationContext context, Handler eventHandler) {
    this.reactContext = context;
    this.eventHandler = eventHandler;
  }

  private void init() {
    if (this.isInited) return;
    QuickJSLoader.init();
    this.key = UUID.randomUUID().toString();
    this.isInited = true;
  }

  private String getPreloadScript() {
    try {
      InputStream inputStream = this.reactContext.getAssets().open("script/user-api-preload.js");
      byte[] buffer = new byte[inputStream.available()];
      inputStream.read(buffer);
      inputStream.close();
      return new String(buffer, StandardCharsets.UTF_8);
    } catch (Exception e) {
      return null;
    }
  }

  private void createEnvObj(QuickJSContext jsContext) {
    jsContext.getGlobalObject().setProperty("__lx_native_call__", args -> {
      if (this.key.equals(args[0])) {
        callNative((String) args[1], (String) args[2]);
        return null;
      }
      return null;
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__utils_str2b64", args -> {
      try {
        return new String(Base64.encode(((String) args[0]).getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP));
      } catch (Exception e) {
        Log.e("UserApi [utils]", "utils_str2b64 error: " + e.getMessage());
        return "";
      }
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__utils_b642buf", args -> {
      try {
        byte[] byteArray = Base64.decode(((String) args[0]).getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        StringBuilder jsonArrayString = new StringBuilder("[");
        for (int i = 0; i < byteArray.length; i++) {
          jsonArrayString.append((int) byteArray[i]);
          if (i < byteArray.length - 1) {
            jsonArrayString.append(",");
          }
        }
        jsonArrayString.append("]");
        return jsonArrayString.toString();
      } catch (Exception e) {
        Log.e("UserApi [utils]", "utils_b642buf error: " + e.getMessage());
        return "";
      }
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__utils_str2md5", args -> {
      try {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] inputBytes = ((String) args[0]).getBytes();
        byte[] md5Bytes = md.digest(inputBytes);
        StringBuilder md5String = new StringBuilder();
        for (byte b : md5Bytes) {
          md5String.append(String.format("%02x", b));
        }
        return md5String.toString();
      } catch (NoSuchAlgorithmException e) {
        Log.e("UserApi [utils]", "utils_str2md5 error: " + e.getMessage());
        return "";
      }
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__utils_aes_encrypt", args -> {
      try {
        return AES.encrypt((String) args[0], (String) args[1], (String) args[2], (String) args[3]);
      } catch (Exception e) {
        Log.e("UserApi [utils]", "utils_aes_encrypt error: " + e.getMessage());
        return "";
      }
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__utils_rsa_encrypt", args -> {
      try {
        return RSA.encryptRSAToString((String) args[0], (String) args[1], (String) args[2]);
      } catch (Exception e) {
        Log.e("UserApi [utils]", "utils_rsa_encrypt error: " + e.getMessage());
        return "";
      }
    });
    jsContext.getGlobalObject().setProperty("__lx_native_call__set_timeout", args -> {
      this.timeoutHandler.postDelayed(() -> {
        callJS("__set_timeout__", args[0]);
      }, (int) args[1]);
      return null;
    });
  }

  private boolean createJSEnv(String id, String name, String desc, String version, String author, String homepage, String rawScript) {
    init();
    QuickJSContext quickJSContext = this.jsContext;
    if (quickJSContext != null) quickJSContext.destroy();
    this.jsContext = QuickJSContext.create();
    this.jsContext.setConsole(new Console(this.eventHandler));
    String preloadScript = getPreloadScript();
    if (preloadScript == null) return false;
    createEnvObj(this.jsContext);
    this.jsContext.evaluate(preloadScript);
    this.jsContext.getGlobalObject().getJSFunction("lx_setup").call(this.key, id, name, desc, version, author, homepage, rawScript);
    return true;
  }

  private void callNative(String action, String data) {
    Message message = this.eventHandler.obtainMessage();
    message.what = HandlerWhat.ACTION;
    if ("init".equals(action)) {
      if (inited) return;
      inited = true;
    }
    message.obj = new Object[]{action, data};
    Log.d("UserApi [script call]", "script call action: " + action + " data: " + data);
    this.eventHandler.sendMessage(message);
  }

  public String loadScript(Bundle scriptInfo) {
    Log.d("UserApi", "UserApi Thread id: " + Thread.currentThread().getId());
    String script = scriptInfo.getString("script", "");
    if (createJSEnv(scriptInfo.getString("id", ""),
      scriptInfo.getString("name", "Unknown"),
      scriptInfo.getString("description", ""),
      scriptInfo.getString("version", ""),
      scriptInfo.getString("author", ""),
      scriptInfo.getString("homepage", ""),
      script)) {
      try {
        this.jsContext.evaluate(script);
        return "";
      } catch (Exception e) {
        Log.e("UserApi", "load script error: " + e.getMessage());
        try {
          callJS("__run_error__");
        } catch (Exception ignored) {}
        if (inited) return "";
        inited = true;
        return e.getMessage();
      }
    }
    return "create JavaScript Env failed";
  }

  public Object callJS(String action) {
    Object[] params = new Object[]{this.key, action};
    return callJS(params);
  }
  public Object callJS(String action, Object... args) {
    Object[] params = new Object[args.length + 2];
    params[0] = this.key;
    params[1] = action;
    System.arraycopy(args, 0, params, 2, args.length);
    return callJS(params);
  }
  public Object callJS(Object[] params) {
    try {
      return this.jsContext.getGlobalObject().getJSFunction("__lx_native__").call(params);
    } catch (Exception e) {
      Message message = eventHandler.obtainMessage();
      message.what = HandlerWhat.LOG;
      String msg = e.getMessage();
      if (msg == null) return null;
      if (msg.length() > 1024) msg = msg.substring(0, 1024) + "...";
      message.obj = new Object[]{"error", "Call script error: " + msg};
      eventHandler.sendMessage(message);
      Log.e("UserApi", "Call script error: " + e.getMessage());
      if (!this.inited) {
        eventHandler.sendMessage(eventHandler.obtainMessage(HandlerWhat.INIT_FAILED, msg));
        this.inited = true;
      }
      return null;
    }
  }

  public void destroy () {
    this.jsContext.destroy();
    this.jsContext = null;
  }
}
