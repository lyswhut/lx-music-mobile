package cn.toside.music.mobile.lyric;

import com.facebook.react.bridge.Promise;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LyricPlayer {
  final String timeFieldExp = "^(?:\\[[\\d:.]+])+";
  final String timeExp = "[\\d:.]+";
  final String timeLabelRxp = "^(\\[[\\d:]+\\.)0+(\\d+])";
  final String timeLabelFixRxp = "(?:\\.0+|0+)$";
//  HashMap tagRegMap;
  Pattern timeFieldPattern;
  Pattern timePattern;

  String lyric = "";
  ArrayList<String> extendedLyrics = new ArrayList<>();
  List<HashMap> lines = new ArrayList<>();
  HashMap tags = new HashMap();
  boolean isPlay = false;
  float playbackRate = 1;
  int curLineNum = 0;
  int maxLine = 0;
  int offset = 150;
  int performanceTime = 0;
  int startPlayTime = 0;
  // int delay = 0;
  Object tid = null;
  boolean tempPause = false;
  boolean tempPaused = false;

  LyricPlayer() {
//    tagRegMap = new HashMap<String, String>();
//    tagRegMap.put("title", "ti");
//    tagRegMap.put("artist", "ar");
//    tagRegMap.put("album", "al");
//    tagRegMap.put("offset", "offset");
//    tagRegMap.put("by", "by");
//    tags = new HashMap();

    timeFieldPattern = Pattern.compile(timeFieldExp);
    timePattern = Pattern.compile(timeExp);
  }

  public void setTempPause(boolean isPaused) {
    if (isPaused) {
      tempPause = true;
    } else {
      tempPause = false;
      if (tempPaused) {
        tempPaused = false;
        if (isPlay) refresh();
      }
    }
  }

//  @RequiresApi(api = Build.VERSION_CODES.N)
//  private void initTag() {
//    tagRegMap.forEach((tag, value) -> {
//      Pattern pattern = Pattern.compile("\\[" + value + ":([^\\]]*)]", Pattern.CASE_INSENSITIVE);
//      Matcher matcher = pattern.matcher(lyric);
//
//      tags.put(tag, matcher.group(1));
//    });
//  }

  private void startTimeout(Runnable runnable, long delay) {
    if (tid != null) Utils.clearTimeout(tid);
    tid = Utils.setTimeout(runnable, delay);
  }

  private void stopTimeout() {
    if (tid == null) return;
    Utils.clearTimeout(tid);
    tid = null;
  }

  private int getNow() {
    return (int)(System.nanoTime() / 1000000);
  }

  private int getCurrentTime() {
    return (int)((getNow() - this.performanceTime) * this.playbackRate) + startPlayTime;
  }

  private void initTag() {
    tags = new HashMap();
    Matcher matcher = Pattern.compile("\\[(ti|ar|al|offset|by):\\s*(\\S+(?:\\s+\\S+)*)\\s*]").matcher(this.lyric);
    while (matcher.find()) {
      String key = matcher.group(1);
      if (key == null) continue;
      String val = matcher.group(2);
      if (val == null) val = "";
      tags.put(key, val);
    }

    String offsetStr = (String) tags.get("offset");
    if (offsetStr == null || offsetStr.equals("")) {
      tags.put("offset", 0);
    } else {
      int offset;
      try {
        offset = Integer.parseInt(offsetStr);
      } catch (Exception err) {
        offset = 0;
      }
      tags.put("offset", offset);
    }
  }

  private void parseExtendedLyric(HashMap linesMap, String extendedLyric) {
    String[] extendedLyricLines = extendedLyric.split("\r\n|\n|\r");
    for (String translationLine : extendedLyricLines) {
      String line = translationLine.trim();
      Matcher timeFieldResult = timeFieldPattern.matcher(line);
      if (timeFieldResult.find()) {
        String timeField = timeFieldResult.group();
        String text = line.replaceAll(timeFieldExp, "").trim();
        if (text.length() > 0) {
          Matcher timeMatchResult = timePattern.matcher(timeField);
          while (timeMatchResult.find()) {
            String timeStr = timeMatchResult.group();
            if (timeStr.contains(".")) timeStr = timeStr.replaceAll(timeLabelRxp, "$1$2");
            else timeStr += ".0";
            timeStr = timeStr.replaceAll(timeLabelFixRxp, "");
            HashMap targetLine = (HashMap) linesMap.get(timeStr);
            if (targetLine != null) ((ArrayList<String>) targetLine.get("extendedLyrics")).add(text);
          }
        }
      }
    }
  }

  private void initLines() {
    String[] linesStr = lyric.split("\r\n|\n|\r");
    lines = new ArrayList<>();

    HashMap linesMap = new HashMap<String, HashMap>();
    HashMap timeMap = new HashMap<String, Integer>();

    for (String lineStr : linesStr) {
      String line = lineStr.trim();
      Matcher timeFieldResult = timeFieldPattern.matcher(line);
      if (timeFieldResult.find()) {
        String timeField = timeFieldResult.group();
        String text = line.replaceAll(timeFieldExp, "").trim();
        if (text.length() > 0) {
          Matcher timeMatchResult = timePattern.matcher(timeField);
          while (timeMatchResult.find()) {
            String timeStr = timeMatchResult.group();
            if (timeStr.contains(".")) timeStr = timeStr.replaceAll(timeLabelRxp, "$1$2");
            else timeStr += ".0";
            timeStr = timeStr.replaceAll(timeLabelFixRxp, "");
            if (linesMap.containsKey(timeStr)) {
              ((ArrayList<String>) ((HashMap) linesMap.get(timeStr)).get("extendedLyrics")).add(text);
              continue;
            }
            String[] timeArr = timeStr.split(":");
            String hours;
            String minutes;
            String seconds;
            String milliseconds = "0";
            switch (timeArr.length) {
              case 3:
                hours = timeArr[0];
                minutes = timeArr[1];
                seconds = timeArr[2];
                break;
              case 2:
                hours = "0";
                minutes = timeArr[0];
                seconds = timeArr[1];
                break;
              default:
                continue;
            }
            if (seconds.contains(".")) {
              timeArr = seconds.split("\\.");
              seconds = timeArr[0];
              milliseconds = timeArr[1];
            }
            HashMap<String, Object> lineInfo = new HashMap<>();
            int time = Integer.parseInt(hours) * 60 * 60 * 1000
              + Integer.parseInt(minutes) * 60 * 1000
              + Integer.parseInt(seconds) * 1000
              + Integer.parseInt(milliseconds);
            lineInfo.put("time", time);
            lineInfo.put("text", text);
            lineInfo.put("extendedLyrics", new ArrayList<String>(extendedLyrics.size()));
            timeMap.put(timeStr, time);
            linesMap.put(timeStr, lineInfo);
          }
        }
      }
    }

    for (String extendedLyric : extendedLyrics) {
      parseExtendedLyric(linesMap, extendedLyric);
    }

    Set<Entry<String, Integer>> set = timeMap.entrySet();
    List<Entry<String, Integer>> list = new ArrayList<Entry<String, Integer>>(set);
    Collections.sort(list, new Comparator<Entry<String, Integer>>() {
      public int compare(Map.Entry<String, Integer> o1,
                         Map.Entry<String, Integer> o2) {
        return o1.getValue().compareTo(o2.getValue());
      }
    });

    // lines = new ArrayList<HashMap>(list.size());
    for (Entry<String, Integer> entry : list) {
      lines.add((HashMap) linesMap.get(entry.getKey()));
    }

    this.maxLine = lines.size() - 1;
  }

  private void  init() {
    if (lyric == null) lyric = "";
    if (extendedLyrics == null) extendedLyrics = new ArrayList<>();
    initTag();
    initLines();
    onSetLyric(lines);
  }

  public void pause() {
    if (!isPlay) return;
    isPlay = false;
    tempPaused = false;
    stopTimeout();
    if (curLineNum == maxLine) return;
    int curLineNum = this.findCurLineNum(getCurrentTime());
    if (this.curLineNum != curLineNum) {
      this.curLineNum = curLineNum;
      this.onPlay(curLineNum);
    }
  }

  public void play(int curTime) {
    if (this.lines.size() == 0) return;
    pause();
    isPlay = true;

    Object tagOffset = tags.get("offset");
    if (tagOffset == null) tagOffset = 0;
    performanceTime = getNow() - (int) tagOffset - offset;
    startPlayTime = curTime;

    curLineNum = findCurLineNum(getCurrentTime()) - 1;

    refresh();
  }

  private int findCurLineNum(int curTime, int startIndex) {
    // Log.d("Lyric", "findCurLineNum: " + startIndex);
    if (curTime <= 0) return 0;
    int length = lines.size();
    for (int index = startIndex; index < length; index++) {
      if (curTime < (int) ((HashMap)lines.get(index)).get("time")) return index == 0 ? 0 : index - 1;
    }
    return length - 1;
  }

  private int findCurLineNum(int curTime) {
    return findCurLineNum(curTime, 0);
  }

  private void handleMaxLine() {
    this.onPlay(this.curLineNum);
    this.pause();
  }

  private void refresh() {
    if (tempPaused) tempPaused = false;

    curLineNum++;
    // Log.d("Lyric", "refresh: " + curLineNum);

    if (curLineNum >= maxLine) {
      handleMaxLine();
      return;
    }
    HashMap curLine = lines.get(curLineNum);

    int currentTime = getCurrentTime();
    int driftTime = currentTime - (int)curLine.get("time");
    // Log.d("Lyric", "driftTime: " + driftTime + "  time: " + curLine.get("time") + "  currentTime: " + currentTime);

    if (driftTime >= 0 || curLineNum == 0) {
      HashMap nextLine = lines.get(curLineNum + 1);
      int delay = (int)(((int)nextLine.get("time") - (int)curLine.get("time") - driftTime) / this.playbackRate);
      // Log.d("Lyric", "delay: " + delay + "  driftTime: " + driftTime);
      if (delay > 0) {
        if (isPlay) {
          startTimeout(() -> {
            if (tempPause) {
              tempPaused = true;
              return;
            }
            if (!isPlay) return;
            refresh();
          }, delay);
        }
        onPlay(curLineNum);
      } else {
        int newCurLineNum = this.findCurLineNum(currentTime, curLineNum + 1);
        if (newCurLineNum > curLineNum) curLineNum = newCurLineNum - 1;
        // Log.d("Lyric", "refresh--: " + curLineNum + "  newCurLineNum: " + newCurLineNum);
        refresh();
      }
      return;
    }

    curLineNum = this.findCurLineNum(currentTime, curLineNum) - 1;
    refresh();
  }

  public void setLyric(String lyric, ArrayList<String> extendedLyrics) {
    if (isPlay) pause();
    this.lyric = lyric;
    this.extendedLyrics = extendedLyrics;
    init();
  }

  public void setPlaybackRate(float playbackRate) {
    this.playbackRate = playbackRate;
    if (this.lines.size() == 0) return;
    if (!this.isPlay) return;
    this.play(this.getCurrentTime());
  }

  public void onPlay(int lineNum) {}

  public void onSetLyric(List lines) {}

}
