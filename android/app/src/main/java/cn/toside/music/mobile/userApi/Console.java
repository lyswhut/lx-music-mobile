package cn.toside.music.mobile.userApi;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

import com.whl.quickjs.wrapper.QuickJSContext;

public class Console implements QuickJSContext.Console {
  private final Handler eventHandler;

  Console(Handler eventHandler) {
    this.eventHandler = eventHandler;
  }

  private void sendLog(String type, String log) {
    Message message = this.eventHandler.obtainMessage();
    message.what = HandlerWhat.LOG;
    message.obj = new Object[]{type, log};
    Log.d("UserApi Log", "[" + type + "]" + log);
    this.eventHandler.sendMessage(message);
  }

  @Override
  public void log(String info) {
    sendLog("log", info);
  }

  @Override
  public void info(String info) {
    sendLog("info", info);
  }

  @Override
  public void warn(String info) {
    sendLog("warn", info);
  }

  @Override
  public void error(String info) {
    sendLog("error", info);
  }
}
