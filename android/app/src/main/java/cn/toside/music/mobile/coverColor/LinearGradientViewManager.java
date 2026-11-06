package cn.toside.music.mobile.coverColor;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.View;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * 垂直方向的纯色渐变 View，用于播放详情页的纯色渐变背景，避免 JS 多层色带出现横纹
 */
public class LinearGradientViewManager extends SimpleViewManager<View> {

  private static final String REACT_CLASS = "LinearGradientView";

  private static class Colors {
    int start = Color.BLACK;
    int end = Color.BLACK;
  }

  LinearGradientViewManager(ReactApplicationContext reactContext) {}

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected View createViewInstance(ThemedReactContext reactContext) {
    View view = new View(reactContext);
    view.setTag(new Colors());
    applyGradient(view);
    return view;
  }

  @ReactProp(name = "startColor")
  public void setStartColor(View view, String color) {
    ((Colors) view.getTag()).start = parseColor(color);
    applyGradient(view);
  }

  @ReactProp(name = "endColor")
  public void setEndColor(View view, String color) {
    ((Colors) view.getTag()).end = parseColor(color);
    applyGradient(view);
  }

  private int parseColor(String color) {
    try {
      return Color.parseColor(color);
    } catch (Exception e) {
      return Color.BLACK;
    }
  }

  private void applyGradient(View view) {
    Colors colors = (Colors) view.getTag();
    view.setBackground(new GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        new int[] { colors.start, colors.end }));
  }
}
