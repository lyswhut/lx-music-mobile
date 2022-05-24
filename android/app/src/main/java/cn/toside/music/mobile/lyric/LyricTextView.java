package cn.toside.music.mobile.lyric;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.widget.TextView;

// https://github.com/Block-Network/StatusBarLyric/blob/main/app/src/main/java/statusbar/lyric/view/LyricTextView.kt
@SuppressLint("AppCompatCustomView")
public class LyricTextView extends TextView {
  private boolean isStop = true;
  private float textLength = 0F;
  private float viewWidth = 0F;
  private final float SPEED_LIMIT = 0.135F;
  private float speed;
  // private float speed = 4F;
  private long time = 0;
  private float xx = 0F;
  private String text = null;
  private final Paint mPaint;
  private final Runnable mStartScrollRunnable;
  private final Runnable invalidateRunnable;
  public static final int startScrollDelay = 1000;
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
    viewWidth = (float) getWidth();
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
  public void setTextSize(float size) {
    super.setTextSize(size);
    speed = SPEED_LIMIT * size;
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  public void setWidth(int pixels) {
    super.setWidth(pixels);
    if (text == null) return;
    post(mStartScrollRunnable);
  }

  @Override
  protected void onDraw(Canvas canvas) {
    float mSpeed = speed;
    if (text != null) {
      float y = getTextSize() / 2 + Math.abs(mPaint.ascent() + mPaint.descent()) / 2;
      if (getText().length() <= 20 && System.currentTimeMillis() - time <= (long)1500) {
        canvas.drawText(text, xx, y, mPaint);
        invalidateAfter();
        return;
      }

      if (getText().length() >= 20) {
        mSpeed += mSpeed;
      }

      canvas.drawText(text, xx, y, mPaint);
    }

    if (!isStop) {
      if (viewWidth - xx + mSpeed >= textLength) {
        xx = viewWidth > textLength ? 0.0F : viewWidth - textLength;
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

  // public void setSpeed(float speed) {
  //  this.speed = speed;
  // }

  public void setTextT(CharSequence charSequence) {
    super.setText(charSequence);
    time = System.currentTimeMillis();
  }
}
