package cn.toside.music.mobile.lyric;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.Log;
import android.view.Gravity;
import android.widget.TextView;

// https://github.com/Block-Network/StatusBarLyric/blob/main/app/src/main/java/statusbar/lyric/view/LyricTextView.kt
@SuppressLint("AppCompatCustomView")
public class LyricTextView extends TextView {
  private boolean isStop = true;
  private float textLength = 0F;
  private float viewWidth = 0F;
  private float viewHeight = 0F;
  private final float SPEED_LIMIT = 0.135F;
  private float speed;
  private float xx = 0F;
  private int gravityVertical = Gravity.TOP;
  private int gravityHorizontal = Gravity.CENTER;
  private float y = 0F;
  private String text = null;
  private final Paint mPaint;
  private final Runnable mStartScrollRunnable;
  private final Runnable invalidateRunnable;
  public static final int startScrollDelay = 1500;
  public static final int invalidateDelay = 10;

  public LyricTextView(Context context) {
    super(context);
    mStartScrollRunnable = LyricTextView.this::startScroll;
    invalidateRunnable = LyricTextView.this::invalidate;
    mPaint = getPaint();
    speed = SPEED_LIMIT * getTextSize();
  }

  private void init() {
    xx = 0.0F;
    textLength = getTextLength();
    // viewWidth = (float) getWidth();
  }

  @Override
  protected void onDetachedFromWindow() {
    removeCallbacks(mStartScrollRunnable);
    super.onDetachedFromWindow();
  }

  @Override
  protected void onTextChanged(CharSequence text, int start, int lengthBefore, int lengthAfter) {
    super.onTextChanged(text, start, lengthBefore, lengthAfter);
    stopScroll();
    this.text = text.toString();
    init();
    postInvalidate();
    postDelayed(mStartScrollRunnable, startScrollDelay);
  }

  @Override
  public void setTextColor(int color) {
    if (mPaint != null) mPaint.setColor(color);
    postInvalidate();
  }

  @Override
  public void setShadowLayer(float radius, float dx, float dy, int shadowColor) {
    if (mPaint != null) mPaint.setShadowLayer(radius, dx, dy, shadowColor);
    post(mStartScrollRunnable);
  }

  @Override
  public void setTextSize(float size) {
    super.setTextSize(size);
    speed = SPEED_LIMIT * size;
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setWidth(int pixels) {
    super.setWidth(pixels);
    viewWidth = pixels;
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setHeight(int pixels) {
    super.setHeight(pixels);
    viewHeight = pixels;
    y = getDrawY();
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setGravity(int gravity) {
    if ((gravity & Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK) == 0) {
      gravity |= Gravity.START;
    }
    if ((gravity & Gravity.VERTICAL_GRAVITY_MASK) == 0) {
      gravity |= Gravity.TOP;
    }

    gravityVertical = gravity & Gravity.VERTICAL_GRAVITY_MASK;
    gravityHorizontal = gravity & Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK;

    y = getDrawY();
    // Log.d("Lyric", "gravityVertical: " + gravityVertical + " gravityHorizontal: " + gravityHorizontal);

    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  protected void onDraw(Canvas canvas) {
    float mSpeed = speed;
    if (text != null) {
      Log.d("Lyric", "getHeight: " + getHeight() + " y: " + y);
      canvas.drawText(text, getDrawX(), y, mPaint);
      if (getText().length() >= 20) {
        mSpeed += mSpeed;
      }
    }

    if (!isStop) {
      if (viewWidth - xx + mSpeed >= textLength) {
        xx = viewWidth - textLength - 2;
        stopScroll();
      } else {
        xx -= mSpeed;
      }

      invalidateAfter();
    }

  }

  private void invalidateAfter() {
    removeCallbacks(invalidateRunnable);
    postDelayed(invalidateRunnable, invalidateDelay);
  }

  private void startScroll() {
    init();
    isStop = false;
    postInvalidate();
  }

  private void stopScroll() {
    isStop = true;
    removeCallbacks(mStartScrollRunnable);
    postInvalidate();
  }

  private float getTextLength() {
    return mPaint == null ? 0.0F : mPaint.measureText(text);
  }

  private float getDrawY() {
    Paint.FontMetrics fontMetrics = mPaint.getFontMetrics();
    float top = fontMetrics.top;
    float bottom = fontMetrics.bottom;
    float ascent = fontMetrics.ascent;
    // float descent = fontMetrics.descent;

    float y;

    // float y = Math.abs(mPaint.ascent() + mPaint.descent()) / 2;
    switch (gravityVertical) {
      case Gravity.CENTER_VERTICAL:
        y = viewHeight / 2F + (bottom - top) / 2 - bottom;
        break;
      case Gravity.BOTTOM:
        y = viewHeight - bottom;
        break;
      default:
        y = -ascent;
        break;
    }
    return y;
  }

  private float getDrawX() {
    float x;
    if (textLength < viewWidth) {
      switch (gravityHorizontal) {
        case Gravity.CENTER_HORIZONTAL:
          x = (viewWidth - textLength) / 2;
          break;
        case Gravity.END:
          x = viewWidth - textLength;
          break;
        default:
          x = 0;
          break;
      }
      isStop = true;
    } else {
      x = xx;
    }
    return x;
  }

  // public void setSpeed(float speed) {
  //  this.speed = speed;
  // }

}
