package com.lxmusicmobile.lyric;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import com.facebook.react.bridge.ReactApplicationContext;

public class LyricView extends Activity implements View.OnTouchListener {
  TextView textView = null;
  WindowManager windowManager = null;
  WindowManager.LayoutParams layoutParams = null;
  ReactApplicationContext reactContext;

  private int winWidth = 0;

  private float lastX; //上一次位置的X.Y坐标
  private float lastY;
  private float nowX;  //当前移动位置的X.Y坐标
  private float nowY;
  private float tranX; //悬浮窗移动位置的相对值
  private float tranY;

  private float preY = 0;
  // private static boolean isVibrated = false;

  public static int ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE = 5469;

  LyricView(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

//  public void permission(){
//    if (Build.VERSION.SDK_INT >= 23) {
//      if(!Settings.canDrawOverlays(this)) {
//        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
//        startActivity(intent);
//        return;
//      } else {
//        //Android6.0以上
//        if (mFloatView!=null && mFloatView.isShow()==false) {
//          mFloatView.show();
//        }
//      }
//    } else {
//      //Android6.0以下，不用动态声明权限
//      if (mFloatView!=null && mFloatView.isShow()==false) {
//        mFloatView.show();
//      }
//    }
//  }

  public void showLyricView(boolean isLock) {
    if (windowManager == null) {
      windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
      //设置TextView的属性
      layoutParams = new WindowManager.LayoutParams();

      DisplayMetrics outMetrics = new DisplayMetrics();
      windowManager.getDefaultDisplay().getMetrics(outMetrics);
      winWidth = (int)(outMetrics.widthPixels * 0.6);
    }

    // 注意，悬浮窗只有一个，而当打开应用的时候才会产生悬浮窗，所以要判断悬浮窗是否已经存在，
    if (textView != null) {
      windowManager.removeView(textView);
    }

    // 使用Application context
    // 创建UI控件，避免Activity销毁导致上下文出现问题,因为现在的悬浮窗是系统级别的，不依赖与Activity存在
    //创建自定义的TextView
    View view = new View(reactContext);
    textView = new TextView(reactContext);
    textView.setText("LX Music ^-^");
    textView.setTextColor(Color.rgb(205, 220, 57));
    textView.setShadowLayer(1, 0, 0, Color.BLACK);


    // textView.setBackgroundColor(0x66000000);
    //监听 OnTouch 事件 为了实现"移动歌词"功能
    textView.setOnTouchListener(this);

    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_ALERT | WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    layoutParams.type = Build.VERSION.SDK_INT < Build.VERSION_CODES.O ?
      WindowManager.LayoutParams.TYPE_SYSTEM_ALERT :
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;

    layoutParams.flags = isLock
      ? WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
      : WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;

    // TYPE_SYSTEM_ALERT  系统提示,它总是出现在应用程序窗口之上
    // TYPE_SYSTEM_OVERLAY   系统顶层窗口。显示在其他一切内容之上。此窗口不能获得输入焦点，否则影响锁屏
    // FLAG_NOT_FOCUSABLE 悬浮窗口较小时，后面的应用图标由不可长按变为可长按,不设置这个flag的话，home页的划屏会有问题
    // FLAG_NOT_TOUCH_MODAL不阻塞事件传递到后面的窗口
    layoutParams.gravity = Gravity.TOP | Gravity.CENTER_VERTICAL;  //显示在屏幕上中部

    //显示位置与指定位置的相对位置差
    layoutParams.x = 0;
    layoutParams.y = 0;
    //悬浮窗的宽高
    // layoutParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.width= DisplayUtil.dp2px(mContext,55);
    // layoutParams.height= DisplayUtil.dp2px(mContext,55);
    layoutParams.width = winWidth;
    layoutParams.height = 80;

    //设置透明
    layoutParams.format = PixelFormat.TRANSPARENT;

    //添加到window中
    windowManager.addView(textView, layoutParams);
  }

  public void setLyric(String text) {
    textView.setText(text);
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {
    boolean ret = true;
    switch (event.getAction()){
      case MotionEvent.ACTION_DOWN:
        // 获取按下时的X，Y坐标
        lastX = event.getRawX();
        lastY = event.getRawY();

        preY = lastY;
        break;
      case MotionEvent.ACTION_MOVE:
        // 获取移动时的X，Y坐标
        nowX = event.getRawX();
        nowY = event.getRawY();
        if (preY == 0){
          preY = nowY;
        }
        // 计算XY坐标偏移量
        tranX = nowX - lastX;
        tranY = nowY - lastY;
        // 移动悬浮窗
        layoutParams.x += tranX;
        layoutParams.y += tranY;
        //更新悬浮窗位置
        windowManager.updateViewLayout(textView, layoutParams);
        //记录当前坐标作为下一次计算的上一次移动的位置坐标
        lastX = nowX;
        lastY = nowY;
        break;
      case MotionEvent.ACTION_UP:
        // float dy = nowY - preY;
        // Log.e("Lyric","dy: " + dy);
        // if (isVibrated){
        //   if (dy > 10){
        //     //down
        //     actions(AppHolder.actions[3]);
        //   }else if (dy<-10){
        //     //up
        //     actions(AppHolder.actions[4]);
        //   }else {
        //     //longClick
        //     actions(AppHolder.actions[2]);
        //   }
        //   isVibrated =false;
        // }
        //根据移动的位置来判断
        // dy = 0;
        tranY = 0;
        break;
    }
    return ret;
  }

  public void lockView() {
    if (windowManager == null || textView == null) return;
    layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void unlockView() {
    if (windowManager == null || textView == null) return;
    layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void destroy() {
    windowManager.removeView(textView);
    windowManager = null;
    textView = null;
    layoutParams = null;
  }
}
