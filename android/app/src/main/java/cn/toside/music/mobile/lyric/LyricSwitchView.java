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
  private LyricTextView lyricTextView;
  private LyricTextView lyricTextView2;
  private TextView textView;
  private TextView textView2;
  private ArrayList<LyricTextView> viewArray;
  private ArrayList<TextView> textViewArray;
  private final boolean isSingleLine;
  private int maxLine = 1;

  public LyricSwitchView(Context context, boolean isSingleLine) {
    super(context);
    this.isSingleLine = isSingleLine;

    if (isSingleLine) {
      viewArray = new ArrayList<>(2);
      lyricTextView = new LyricTextView(context);
      lyricTextView2 = new LyricTextView(context);
      viewArray.add(lyricTextView);
      viewArray.add(lyricTextView2);
      for (LyricTextView v : viewArray) {
        v.setShadowLayer(0.1f, 0, 0, Color.BLACK);
      }
      setAnima();
      this.addView(lyricTextView);
      this.addView(lyricTextView2);
    } else {
      textViewArray = new ArrayList<>(2);
      textView = new TextView(context);
      textView2 = new TextView(context);
      textViewArray.add(textView);
      textViewArray.add(textView2);
      for (TextView v : textViewArray) {
        v.setShadowLayer(0.2f, 0, 0, Color.BLACK);
        v.setEllipsize(TextUtils.TruncateAt.END);
      }
      setAnima();
      this.addView(textView);
      this.addView(textView2);
    }

    setAnima();
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
    if (isSingleLine) {
      setInAnimation(inAnim("top", lyricTextView.getTextSize()));
      setOutAnimation(outAnim("top", lyricTextView.getTextSize()));
    } else {
      setInAnimation(inAnim("top", textView.getTextSize() * maxLine));
      setOutAnimation(outAnim("top", textView.getTextSize() * maxLine));
    }
  }

  public CharSequence getText() {
    View currentView = this.getCurrentView();
    return currentView == null ? "" : ((TextView)currentView).getText();
  }

  public TextPaint getPaint() {
    return ((TextView)this.getCurrentView()).getPaint();
  }

  public void setWidth(int i) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setWidth(i);
    } else {
      for (TextView v : textViewArray) v.setWidth(i);
    }
  }

  public void setTextColor(int i) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setTextColor(i);
    } else {
      for (TextView v : textViewArray) v.setTextColor(i);
    }
  }

  public void setSourceText(CharSequence str) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setText(str);
    } else {
      for (TextView v : textViewArray) v.setText(str);
    }
  }

  public void setLetterSpacings(float letterSpacing) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setLetterSpacing(letterSpacing);
    } else {
      for (TextView v : textViewArray) v.setLetterSpacing(letterSpacing);
    }
  }

  public void setHeight(int i) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setHeight(i);
    } else {
      for (TextView v : textViewArray) v.setHeight(i);
    }
  }

  public void setTypeface(Typeface typeface) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setTypeface(typeface);
    } else {
      for (TextView v : textViewArray) v.setTypeface(typeface);
    }
  }

  public void setSingleLine(boolean bool) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setSingleLine(bool);
    } else {
      for (TextView v : textViewArray) v.setSingleLine(bool);
    }
  }

  public void setMaxLines(int i) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setMaxLines(i);
      maxLine = 1;
    } else {
      for (TextView v : textViewArray) v.setMaxLines(i);
      maxLine = i;
    }
    setAnima();
  }

  public void setTextSize(float f) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setTextSize(f);
    } else {
      for (TextView v : textViewArray) v.setTextSize(f);
    }
    setAnima();
  }

  public void setGravity(int i) {
    if (isSingleLine) {
      for (LyricTextView v : viewArray) v.setGravity(i);
    } else {
      for (TextView v : textViewArray) v.setGravity(i);
    }
  }

}
