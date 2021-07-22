package com.lxmusicmobile.lyric;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import com.facebook.react.bridge.ReactApplicationContext;

public class Lyric extends Activity implements View.OnTouchListener {
  TextView textView = null;
  WindowManager wm = null;
  WindowManager.LayoutParams layoutParams = null;

  Lyric(ReactApplicationContext reactContext) {
    wm = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
    //设置TextView的属性
    layoutParams = new WindowManager.LayoutParams();
    layoutParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
    layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
    //这里是关键，使控件始终在最上方
    layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_ALERT | WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
    //这个Gravity也不能少，不然的话，下面"移动歌词"的时候就会出问题了～ 可以试试[官网文档有说明]
    layoutParams.gravity = Gravity.LEFT|Gravity.TOP;

    //创建自定义的TextView
    textView = new TextView(reactContext);
    textView.setText("Test Touch ...");
    textView.setTextColor(Color.WHITE);
    textView.setBackgroundColor(Color.BLACK);
    //监听 OnTouch 事件 为了实现"移动歌词"功能
    textView.setOnTouchListener(this);

    wm.addView(textView, layoutParams);

    Log.e("Lyric", "show lyric");
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {

    Log.e("Lyric", "view y: " + v.getY());
    switch (event.getAction()){
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_MOVE:
        //getRawX/Y 是获取相对于Device的坐标位置 注意区别getX/Y[相对于View]
        layoutParams.x = (int) event.getRawX();
        layoutParams.y = (int) event.getRawY();
        Log.e("Lyric", "event y: " + event.getRawY());
        //更新"桌面歌词"的位置
        wm.updateViewLayout(textView,layoutParams);
        //下面的removeView 可以去掉"桌面歌词"
        //wm.removeView(myView);
        break;
    }
    return false;
  }

  public void destroy() {
    wm.removeView(textView);
    wm = null;
    textView = null;
    layoutParams = null;
  }
}
