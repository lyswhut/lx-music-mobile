package cn.toside.music.mobile.lyric;

import android.text.TextUtils;
import android.util.Log;

import com.facebook.react.bridge.ReadableMap;
import com.hchen.superlyricapi.Publisher;
import com.hchen.superlyricapi.SuperLyric;
import com.hchen.superlyricapi.model.Line;
import com.hchen.superlyricapi.model.Lyric;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 将当前歌曲歌词发布到 SuperLyric。
 *
 * <p>只负责把歌词转换为 SuperLyric 4.0 的数据模型并通过 Binder 发布，
 * 不保存歌词内容，也不参与播放进度计算。
 */
public class SuperLyricPublisher {
  private static final String TAG = "SuperLyric";
  private static final long DEFAULT_LAST_LINE_DURATION = 5000L;

  private boolean enabled = false;

  /**
   * 服务是否可用。
   */
  public boolean isAvailable() {
    try {
      boolean available = SuperLyric.isAvailable();
      Log.d(TAG, "Available=" + available + ", version=" + SuperLyric.serverApiVersion());
      return available;
    } catch (Throwable e) {
      Log.w(TAG, "Check service failed", e);
      return false;
    }
  }

  /**
   * 设置是否启用歌词发布。
   *
   * @param enabled 是否启用
   */
  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
    Log.d(TAG, "Set enabled=" + enabled + ", available=" + isAvailable());
    if (!enabled) clear();
  }

  /**
   * 发布一首歌的完整歌词。
   *
   * @param lyric 主歌词
   * @param translation 翻译歌词
   * @param romaLyric 罗马音歌词
   * @param info 歌曲信息，包含 id、title、artist、album、duration
   */
  public void publish(String lyric, String translation, String romaLyric, ReadableMap info) {
    if (!enabled) return;
    if (TextUtils.isEmpty(lyric)) {
      clear();
      return;
    }

    String id = getString(info, "id");
    String title = getString(info, "title");
    if (TextUtils.isEmpty(id) || TextUtils.isEmpty(title)) {
      Log.w(TAG, "Skip publish: empty id or title");
      return;
    }

    try {
      List<HashMap> lines = parse(lyric, "");
      if (lines.isEmpty()) {
        clear();
        return;
      }

      Map<Integer, String> translations = TextUtils.isEmpty(translation)
        ? Collections.emptyMap()
        : parseExtended(lyric, translation);
      Map<Integer, String> romas = TextUtils.isEmpty(romaLyric)
        ? Collections.emptyMap()
        : parseExtended(lyric, romaLyric);

      long duration = info.hasKey("duration") ? (long) info.getDouble("duration") : 0L;
      if (duration < 0L) duration = 0L;

      List<Line> targetLines = new ArrayList<>(lines.size());
      for (int i = 0; i < lines.size(); i++) {
        HashMap line = lines.get(i);
        int start = ((Number) line.get("time")).intValue();
        long end;
        if (i + 1 < lines.size()) {
          end = ((Number) lines.get(i + 1).get("time")).longValue();
          if (end < start) end = start;
        } else {
          end = duration > start ? duration : start + DEFAULT_LAST_LINE_DURATION;
        }
        targetLines.add(new Line(
          (String) line.get("text"),
          start,
          end,
          null,
          translations.get(start),
          romas.get(start)
        ));
      }

      Lyric doc = new Lyric(
        id,
        title,
        getString(info, "artist"),
        getString(info, "album"),
        duration,
        targetLines
      );
      Publisher.PublishResult result = SuperLyric.publisher().publish(doc);
      if (result == Publisher.PublishResult.OK) {
        Log.d(TAG, "Published lyric: " + title + ", lines=" + targetLines.size());
      } else {
        Log.w(TAG, "Publish rejected: " + result + ", title=" + title);
      }
    } catch (Throwable e) {
      Log.w(TAG, "Publish failed", e);
    }
  }

  /**
   * 清除已发布的歌词。
   */
  public void clear() {
    try {
      SuperLyric.publisher().clear();
    } catch (Throwable e) {
      Log.w(TAG, "Clear failed", e);
    }
  }

  private static String getString(ReadableMap info, String key) {
    if (info == null || !info.hasKey(key) || info.isNull(key)) return "";
    String value = info.getString(key);
    return value == null ? "" : value;
  }

  private static List<HashMap> parse(String lyric, String extendedLyric) {
    final List<HashMap>[] holder = new List[1];
    LyricPlayer parser = new LyricPlayer() {
      @Override
      public void onSetLyric(List lines) {
        holder[0] = lines;
      }
    };
    ArrayList<String> extended = new ArrayList<>(1);
    if (!TextUtils.isEmpty(extendedLyric)) extended.add(extendedLyric);
    parser.setLyric(lyric, extended);
    return holder[0] == null ? Collections.emptyList() : holder[0];
  }

  private static Map<Integer, String> parseExtended(String lyric, String extendedLyric) {
    List<HashMap> lines = parse(lyric, extendedLyric);
    Map<Integer, String> result = new HashMap<>(lines.size());
    for (HashMap line : lines) {
      ArrayList<String> extended = (ArrayList<String>) line.get("extendedLyrics");
      if (extended == null || extended.isEmpty()) continue;
      result.put(((Number) line.get("time")).intValue(), extended.get(0));
    }
    return result;
  }
}
