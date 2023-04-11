package cn.toside.music.mobile.lyric;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.TextUtils;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.TranslateAnimation;
import android.widget.TextSwitcher;
import android.widget.TextView;

import androidx.annotation.Nullable;

import java.util.ArrayList;

// https://github.com/Block-Network/StatusBarLyric/blob/main/app/src/main/java/statusbar/lyric/view/LyricSwitchView.kt
@SuppressLint({"ViewConstructor"})
public final class LyricSwitchView extends TextSwitcher {
  private final TextView textView;
  private final TextView textView2;
  private final ArrayList<TextView> viewArray;
  // private final boolean isSingleLine;
  private boolean isShowAnima;

  private boolean isSingleLine;

  public LyricSwitchView(Context context, boolean isSingleLine, boolean isShowAnima) {
    super(context);
    // this.isSingleLine = isSingleLine;
    this.isShowAnima = isShowAnima;
    this.isSingleLine = isSingleLine;

    if (isSingleLine) {
      viewArray = new ArrayList<>(2);
      textView = new LyricTextView(context);
      textView2 = new LyricTextView(context);
      viewArray.add(textView);
      viewArray.add(textView2);
//      for (TextView v : viewArray) {
//        v.setShadowLayer(0.1f, 0, 0, Color.BLACK);
//      }
    } else {
      viewArray = new ArrayList<>(2);
      textView = new TextView(context);
      textView2 = new TextView(context);
      viewArray.add(textView);
      viewArray.add(textView2);
      for (TextView v : viewArray) {
//        v.setShadowLayer(0.2f, 0, 0, Color.BLACK);
        v.setEllipsize(TextUtils.TruncateAt.END);
      }
    }
    setAnima();
    this.addView(textView);
    this.addView(textView2);
  }

  @Nullable
  public Animation inAnim(String str, float height) {
    AnimationSet animationSet = new AnimationSet(true);
    if (str == null) return null;

    TranslateAnimation translateAnimation;
    switch (str) {
      case "top":
        translateAnimation = new TranslateAnimation(0.0F, 0.0F, height, 0.0F);
        break;
      case "bottom":
        translateAnimation = new TranslateAnimation(0.0F, 0.0F, -height, 0.0F);
        break;
      case "left":
        translateAnimation = new TranslateAnimation(100.0F, 0.0F, 0.0F, 0.0F);
        break;
      case "right":
        translateAnimation = new TranslateAnimation(-100.0F, 0.0F, 0.0F, 0.0F);
        break;
      default: return null;
    }

    translateAnimation.setDuration(300L);
    AlphaAnimation alphaAnimation = new AlphaAnimation(0.0F, 1.0F);
    alphaAnimation.setDuration(300L);
    animationSet.addAnimation(translateAnimation);
    animationSet.addAnimation(alphaAnimation);
    return animationSet;
  }

  @Nullable
  public Animation outAnim(String str, float height) {
    AnimationSet animationSet = new AnimationSet(true);
    if (str == null) return null;

    TranslateAnimation translateAnimation;
    switch (str) {
      case "top":
        translateAnimation = new TranslateAnimation(0.0F, 0.0F, 0.0F, -height);
        break;
      case "bottom":
        translateAnimation = new TranslateAnimation(0.0F, 0.0F, 0.0F, height);
        break;
      case "left":
        translateAnimation = new TranslateAnimation(0.0F, -100.0F, 0.0F, 0.0F);
        break;
      case "right":
        translateAnimation = new TranslateAnimation(0.0F, 100.0F, 0.0F, 0.0F);
        break;
      default: return null;
    }
    translateAnimation.setDuration(300L);
    AlphaAnimation alphaAnimation = new AlphaAnimation(1.0F, 0.0F);
    alphaAnimation.setDuration(300L);
    animationSet.addAnimation(translateAnimation);
    animationSet.addAnimation(alphaAnimation);
    return animationSet;
  }

  private void setAnima() {
    if (isShowAnima) {
      float size = textView.getTextSize();
      setInAnimation(inAnim("top", size));
      setOutAnimation(outAnim("top", size));
    } else {
      setInAnimation(null);
      setOutAnimation(null);
    }
  }

  public void setShowAnima(boolean showAnima) {
    isShowAnima = showAnima;
    setAnima();
  }

  public CharSequence getText() {
    View currentView = this.getCurrentView();
    return currentView == null ? "" : ((TextView)currentView).getText();
  }

  public TextPaint getPaint() {
    return ((TextView)this.getCurrentView()).getPaint();
  }

  public void setWidth(int i) {
    for (TextView v : viewArray) v.setWidth(i);
  }

  public void setTextColor(int i) {
    for (TextView v : viewArray) v.setTextColor(i);
  }

  public void setShadowColor(int i) {
    float radius;
    if (isSingleLine) {
      radius = 0.1f;
    } else {
      radius = 0.2f;
    }
    for (TextView v : viewArray) v.setShadowLayer(radius, 0, 0, i);
  }

  public void setSourceText(CharSequence str) {
    for (TextView v : viewArray) v.setText(str);
  }

  public void setLetterSpacings(float letterSpacing) {
    for (TextView v : viewArray) v.setLetterSpacing(letterSpacing);
  }

  public void setHeight(int i) {
    for (TextView v : viewArray) v.setHeight(i);
  }

  public void setTypeface(Typeface typeface) {
    for (TextView v : viewArray) v.setTypeface(typeface);
  }

  public void setSingleLine(boolean bool) {
    for (TextView v : viewArray) v.setSingleLine(bool);
  }

  public void setMaxLines(int i) {
    for (TextView v : viewArray) v.setMaxLines(i);
  }

  public void setTextSize(float f) {
    for (TextView v : viewArray) v.setTextSize(f);
    setAnima();
  }

  public void setGravity(int i) {
    for (TextView v : viewArray) v.setGravity(i);
  }

}
