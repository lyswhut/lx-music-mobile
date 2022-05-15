package cn.toside.music.mobile.lyric;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;

import cn.toside.music.mobile.R;

public class LyricView extends Activity implements View.OnTouchListener {
  TextView textView = null;
  WindowManager windowManager = null;
  WindowManager.LayoutParams layoutParams = null;
  final private ReactApplicationContext reactContext;
  final private LyricEvent lyricEvent;

  // private int winWidth = 0;

  private float lastX; //上一次位置的X.Y坐标
  private float lastY;
  private float nowX;  //当前移动位置的X.Y坐标
  private float nowY;
  private float tranX; //悬浮窗移动位置的相对值
  private float tranY;
  private float prevViewPercentageX = 0;
  private float prevViewPercentageY = 0;
  private float widthPercentage = 1f;

  private float preY = 0;
  // private static boolean isVibrated = false;

  private boolean isLock = false;
  private String themeColor = "#07c556";
  // private String lastText = "LX Music ^-^";
  private String textX = "LEFT";
  private String textY = "TOP";
  private float alpha = 1f;
  private float textSize = 18f;
  private int maxWidth = 0;
  private int maxHeight = 0;

  private int maxLineNum = 5;
  // private float lineHeight = 1;

  private int mLastRotation;
  private OrientationEventListener orientationEventListener = null;

  final Handler fixViewPositionHandler;
  final Runnable fixViewPositionRunnable = this::fixViewPosition;

  LyricView(ReactApplicationContext reactContext, LyricEvent lyricEvent) {
    this.reactContext = reactContext;
    this.lyricEvent = lyricEvent;
    fixViewPositionHandler = new Handler();
  }

  private void listenOrientationEvent() {
    if (orientationEventListener == null) {
      orientationEventListener = new OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
        @Override
        public void onOrientationChanged(int orientation) {
          Display display = windowManager.getDefaultDisplay();
          int rotation = display.getRotation();
          if(rotation != mLastRotation){
            //rotation changed
            // if (rotation == Surface.ROTATION_90){} // check rotations here
            // if (rotation == Surface.ROTATION_270){} //
            Log.d("Lyric", "rotation: " + rotation);
            fixViewPositionHandler.postDelayed(fixViewPositionRunnable, 300);
          }
          mLastRotation = rotation;
        }
      };
    }
    Log.d("Lyric", "orientationEventListener: " + orientationEventListener.canDetectOrientation());
    if (orientationEventListener.canDetectOrientation()) {
      orientationEventListener.enable();
    }
  }
  private void removeOrientationEvent() {
    if (orientationEventListener == null) return;
    orientationEventListener.disable();
    // orientationEventListener = null;
  }

  private int getLayoutParamsFlags() {
    int flag = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
      WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

    if (isLock) {
      flag = flag | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
    }

    return flag;
  }

  /**
   * update screen width and height
   * @return has updated
   */
  private boolean updateWH() {
    Display display = windowManager.getDefaultDisplay();
    Point size = new Point();
    display.getSize(size);
    if (maxWidth == size.x && maxHeight == size.y) return false;
    maxWidth = size.x;
    maxHeight = size.y;
    return true;
  }

  private void fixViewPosition() {
    if (!updateWH()) return;

    int width = (int)(maxWidth * widthPercentage);
    if (layoutParams.width != width) layoutParams.width = width;

    layoutParams.x = (int)(maxWidth * prevViewPercentageX);
    layoutParams.y = (int)(maxHeight * prevViewPercentageY);

    // int maxX = this.maxWidth - layoutParams.width;
    // int maxY = this.maxHeight - layoutParams.height;
    // int x = layoutParams.x;
    // int y = layoutParams.y;
    // if (x < 0) x = 0;
    // else if (x > maxX) x = maxX;
    // if (y < 0) y = 0;
    // else if (y > maxY) y = maxY;

    // layoutParams.x = x;
    // layoutParams.y = y;
    Log.d("Lyric", "widthPercentage: " + widthPercentage + "  prevViewPercentageX: " + prevViewPercentageX);
    Log.d("Lyric", "prevViewPercentageY: " + prevViewPercentageY + "  layoutParams.x: " + layoutParams.x);
    Log.d("Lyric", "layoutParams.y: " + layoutParams.y + "  layoutParams.width: " + layoutParams.width);

    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void sendPositionEvent(int x, int y) {
    WritableMap params = Arguments.createMap();
    params.putInt("x", x);
    params.putInt("y", y);
    lyricEvent.sendEvent(lyricEvent.SET_VIEW_POSITION, params);
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
// boolean isLock, String themeColor, float alpha, int lyricViewX, int lyricViewY, String textX, String textY
  public void showLyricView(Bundle options) {
    isLock = options.getBoolean("isLock", isLock);
    themeColor = options.getString("themeColor", themeColor);
    prevViewPercentageX = (int) options.getDouble("lyricViewX", 0) / 100f;
    prevViewPercentageY = (int) options.getDouble("lyricViewY", 0) / 100f;
    textX = options.getString("textX", textX);
    textY = options.getString("textY", textY);
    alpha = (float) options.getDouble("alpha", alpha);
    textSize = (float) options.getDouble("textSize", textSize);
    widthPercentage = (int) options.getDouble("width", 100) / 100f;
    maxLineNum = (int) options.getDouble("maxLineNum", maxLineNum);
    handleShowLyric();
    fixViewPosition();
    listenOrientationEvent();
  }
  public void showLyricView() {
    try {
      handleShowLyric();
    } catch (Exception e) {
      Log.e("Lyric", e.getMessage());
      return;
    }
    fixViewPosition();
    listenOrientationEvent();
  }

  private void handleShowLyric() {
    if (windowManager == null) {
      windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
      //设置TextView的属性
      layoutParams = new WindowManager.LayoutParams();

      DisplayMetrics outMetrics = new DisplayMetrics();
      windowManager.getDefaultDisplay().getMetrics(outMetrics);
      // winWidth = (int)(outMetrics.widthPixels * 0.92);
    }

    // 注意，悬浮窗只有一个，而当打开应用的时候才会产生悬浮窗，所以要判断悬浮窗是否已经存在，
    if (textView != null) {
      windowManager.removeView(textView);
    }

    // 使用Application context
    // 创建UI控件，避免Activity销毁导致上下文出现问题,因为现在的悬浮窗是系统级别的，不依赖与Activity存在
    //创建自定义的TextView
    textView = new TextView(reactContext);
    textView.setText("LX Music ^-^");
    // Log.d("Lyric", "textX: " + textX + "  textY: " + textY);
    int textPositionX;
    int textPositionY;
    switch (textX) {
      case "CENTER":
        textPositionX = Gravity.CENTER;
        break;
      case "RIGHT":
        textPositionX = Gravity.RIGHT;
        break;
      case "left":
      default:
        textPositionX = Gravity.LEFT;
        break;
    }
    switch (textY) {
      case "CENTER":
        textPositionY = Gravity.CENTER;
        break;
      case "BOTTOM":
        textPositionY = Gravity.BOTTOM;
        break;
      case "TOP":
      default:
        textPositionY = Gravity.TOP;
        break;
    }
    textView.setGravity(textPositionX | textPositionY);
    textView.setTextColor(Color.parseColor(themeColor));
    textView.setAlpha(alpha);
    textView.setTextSize(textSize);
    Log.d("Lyric", "alpha: " + alpha + " text size: " + textSize);
    textView.setShadowLayer(0.3f, 0, 0, Color.BLACK);
    textView.setMaxLines(maxLineNum);
    textView.setEllipsize(TextUtils.TruncateAt.END);

    //监听 OnTouch 事件 为了实现"移动歌词"功能
    textView.setOnTouchListener(this);

    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_ALERT | WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    layoutParams.type = Build.VERSION.SDK_INT < Build.VERSION_CODES.O ?
      WindowManager.LayoutParams.TYPE_SYSTEM_ALERT :
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;

    // layoutParams.flags = isLock
    //  ? WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
    //  : WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
    layoutParams.flags = getLayoutParamsFlags();
    if (isLock) {
      textView.setBackgroundColor(Color.TRANSPARENT);

      // 修复 Android 12 的穿透点击问题
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
        layoutParams.alpha = 0.8f;
      }
    } else {
      textView.setBackgroundResource(R.drawable.rounded_corner);

      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
        layoutParams.alpha = 1.0f;
      }
    }

    // TYPE_SYSTEM_ALERT  系统提示,它总是出现在应用程序窗口之上
    // TYPE_SYSTEM_OVERLAY   系统顶层窗口。显示在其他一切内容之上。此窗口不能获得输入焦点，否则影响锁屏
    // FLAG_NOT_FOCUSABLE 悬浮窗口较小时，后面的应用图标由不可长按变为可长按,不设置这个flag的话，home页的划屏会有问题
    // FLAG_NOT_TOUCH_MODAL不阻塞事件传递到后面的窗口
    layoutParams.gravity = Gravity.TOP | Gravity.START;  //显示在屏幕上中部

    updateWH();

    //显示位置与指定位置的相对位置差
    layoutParams.x = (int)(maxWidth * prevViewPercentageX);
    layoutParams.y = (int)(maxHeight * prevViewPercentageY);

    //悬浮窗的宽高
    // layoutParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.width= DisplayUtil.dp2px(mContext,55);
    // layoutParams.height= DisplayUtil.dp2px(mContext,55);
    layoutParams.width = (int)(maxWidth * widthPercentage);
    // layoutParams.height = 100;
    layoutParams.height = textView.getPaint().getFontMetricsInt(null) * maxLineNum + 8;

    //设置透明
    layoutParams.format = PixelFormat.TRANSPARENT;

    //添加到window中
    windowManager.addView(textView, layoutParams);
  }

  public void setLyric(String text, ArrayList<String> extendedLyrics) {
    if (textView == null) return;
    if (extendedLyrics.size() > 0 && maxLineNum > 1) {
      int num = maxLineNum - 1;
      StringBuilder textBuilder = new StringBuilder(text);
      for (String lrc : extendedLyrics) {
        textBuilder.append("\n").append(lrc);
        if (--num < 1) break;
      }
      text = textBuilder.toString();
    }
    textView.setText(text);
  }

  public void setPosition(int x, int y) {
    if (textView == null) return;
    layoutParams.x = x;
    layoutParams.y = y;
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setMaxLineNum(int maxLineNum) {
    if (textView == null) return;
    this.maxLineNum = maxLineNum;
    textView.setMaxLines(maxLineNum);
    layoutParams.height = textView.getPaint().getFontMetricsInt(null) * maxLineNum + 8;
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setWidth(int width) {
    if (textView == null) return;
    widthPercentage = width / 100f;
    layoutParams.width = (int)(maxWidth * widthPercentage);

    int maxX = maxWidth - layoutParams.width;
    int x = layoutParams.x;
    if (x < 0) x = 0;
    else if (x > maxX) x = maxX;
    if (layoutParams.x != x) layoutParams.x = x;

    windowManager.updateViewLayout(textView, layoutParams);
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {
    int maxX = maxWidth - layoutParams.width;
    int maxY = maxHeight - layoutParams.height;

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

        int x = layoutParams.x + (int)tranX;
        int y = layoutParams.y + (int)tranY;
        if (x < 0) x = 0;
        else if (x > maxX) x = maxX;
        if (y < 0) y = 0;
        else if (y > maxY) y = maxY;

        // 移动悬浮窗
        layoutParams.x = x;
        layoutParams.y = y;
        //更新悬浮窗位置
        windowManager.updateViewLayout(textView, layoutParams);
        //记录当前坐标作为下一次计算的上一次移动的位置坐标
        lastX = nowX;
        lastY = nowY;
        break;
      case MotionEvent.ACTION_UP:
        // float dy = nowY - preY;
        // Log.d("Lyric","dy: " + dy);
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
        int percentageX = (int)((float)layoutParams.x / (float) maxWidth * 100f);
        int percentageY = (int)((float)layoutParams.y / (float) maxHeight * 100f);
        if (percentageX != prevViewPercentageX || percentageY != prevViewPercentageY) {
          prevViewPercentageX = percentageX / 100f;
          prevViewPercentageY = percentageY / 100f;
          sendPositionEvent(percentageX, percentageY);
        }
        break;
    }
    return true;
  }

  public void lockView() {
    isLock = true;
    if (windowManager == null || textView == null) return;
    layoutParams.flags = getLayoutParamsFlags();

    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
      layoutParams.alpha = 0.8f;
    }
    textView.setBackgroundColor(Color.TRANSPARENT);
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void unlockView() {
    isLock = false;
    if (windowManager == null || textView == null) return;
    layoutParams.flags = getLayoutParamsFlags();

    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
      layoutParams.alpha = 1.0f;
    }
    textView.setBackgroundResource(R.drawable.rounded_corner);
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setColor(String color) {
    themeColor = color;
    if (textView == null) return;
    textView.setTextColor(Color.parseColor(color));
    // windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setLyricTextPosition(String textX, String textY) {
    this.textX = textX;
    this.textY = textY;
    if (windowManager == null || textView == null) return;
    int textPositionX;
    int textPositionY;
    // Log.d("Lyric", "textX: " + textX + "  textY: " + textY);
    switch (textX) {
      case "CENTER":
        textPositionX = Gravity.CENTER;
        break;
      case "RIGHT":
        textPositionX = Gravity.RIGHT;
        break;
      case "left":
      default:
        textPositionX = Gravity.LEFT;
        break;
    }
    switch (textY) {
      case "CENTER":
        textPositionY = Gravity.CENTER;
        break;
      case "BOTTOM":
        textPositionY = Gravity.BOTTOM;
        break;
      case "TOP":
      default:
        textPositionY = Gravity.TOP;
        break;
    }
    textView.setGravity(textPositionX | textPositionY);
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setAlpha(float alpha) {
    this.alpha = alpha;
    if (textView == null) return;
    textView.setAlpha(alpha);
  }

  public void setTextSize(float size) {
    this.textSize = size;
    if (windowManager == null || textView == null) return;
    textView.setTextSize(size);
    layoutParams.height = textView.getPaint().getFontMetricsInt(null) * maxLineNum + 8;
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void destroyView() {
    if (textView == null || windowManager == null) return;
    windowManager.removeView(textView);
    textView = null;
    removeOrientationEvent();
  }

  public void destroy() {
    destroyView();
    windowManager = null;
    layoutParams = null;
  }
}
