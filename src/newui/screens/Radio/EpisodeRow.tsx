import { memo } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { QTag } from '@/newui/components/QTag'
import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_WEIGHT, POD, useTheme } from '@/newui/theme'

/**
 * 单集行（原型 `.ep-row`，`new_design/parts/radio/detail.html` L17 / `detail.css` L416-L425，U82 屏级辅件）。
 *
 * **整行就是入口，行内不放按钮**（件头逐字：`.ep-play` 与列表尾那句人话终点行本轮一起撤掉）：
 * 根节点是 `Pressable`，没有第二颗可点控件；按下态 = `.ep-row:active{background:var(--fill-1)}`。
 *
 * 行内容三档（app.js `epRow` L2050-L2062）：
 * 1. `.ep-title` 集名，两行截断；
 * 2. `.ep-meta` 发布日期 ｜ 时长 ｜（本机记的就是这一集时）一枚「还剩 X」的 `.q-tag`；
 * 3. `.ep-text` 摘要，**接口给了才占位**（缺则整段不渲染，不留空坑）。
 *
 * 行高 89 是原型量测值（`POD.epRowHeight`，index.html L766），**不写成死高度**：
 * 带摘要与不带摘要是两种实际高度，交给 FlatList 自己量（见 PodcastDetailScreen 的虚拟化说明）。
 * 纯展示组件：进度归属（`p.idx === 行号`）与格式化都由容器算好再传。
 */
export interface EpisodeRowProps {
  /** 集名（`.ep-title`） */
  title: string
  /** 发布日期文本「10 月 15 日」（`PodEpisodeRow.dateText`，已过 `podDateText`） */
  dateText: string
  /** 时长文本「18 分钟」（`PodEpisodeRow.durationText`，已过 `podDurationText`） */
  durationText: string
  /** 一集简介：可缺席（← `shortDescription`），缺则这一段整个不渲染 */
  intro?: string
  /** 本机进度文本「还剩 X」：只有本机记的那一集才有（app.js L2058），由容器判好再传 */
  leftText?: string
  onPress: () => void
  /** 行距等外距由容器给（`.ep-list{gap:1px}` 在 FlatList 侧表达，判例 SongRow 的 `style={styles.rowGap}`） */
  style?: StyleProp<ViewStyle>
}

export const EpisodeRow = memo(({
  title,
  dateText,
  durationText,
  intro,
  leftText,
  onPress,
  style,
}: EpisodeRowProps) => {
  const theme = useTheme()
  // `.ep-row{transition:.2s var(--ease)}`：与 `.pod-row` 同一条口径，行类只变底色、不缩放
  const pressFx = usePressFx()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.row, style]}
    >
      {/* .ep-row:active{background:var(--fill-1)}：不动的底色层淡入，正文与行距一概不受影响 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pressBg,
          { backgroundColor: theme.colors.fill1, opacity: pressFx.progress },
        ]}
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: theme.colors.text3 }]}>{dateText}</Text>
          {/* `.ep-meta .sep`：1×9 竖线（detail.css L423，走 line-strong，与 hero 的 `.ph-meta .sep` 同族） */}
          <View style={[styles.sep, { backgroundColor: theme.colors.lineStrong }]} />
          <Text style={[styles.metaText, { color: theme.colors.text3 }]}>{durationText}</Text>
          {leftText != null && leftText.length > 0 && <QTag label={leftText} />}
        </View>
        {intro != null && intro.length > 0 && (
          <Text style={[styles.intro, { color: theme.colors.text2 }]} numberOfLines={2}>
            {intro}
          </Text>
        )}
      </View>
    </Pressable>
  )
})

EpisodeRow.displayName = 'NewUIEpisodeRow'

const styles = StyleSheet.create({
  /** .ep-row{display:flex;align-items:flex-start;gap:12px;width:100%;padding:12px 8px;border-radius:14px} */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: POD.epRowGap,
    paddingVertical: POD.epRowPaddingY,
    paddingHorizontal: POD.epRowPaddingX,
    borderRadius: POD.epRowRadius,
  },
  /** 按下底色层：铺满整行、跟行同圆角（行根没有 overflow:hidden，圆角得自己带） */
  pressBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: POD.epRowRadius,
  },
  /** .ep-body{flex:1;min-width:0} */
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** .ep-title{14px/700;line-height:1.45，两行截断} */
  title: {
    fontSize: POD.epTitleSize,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: Math.round(POD.epTitleSize * POD.epTitleLineHeight),
  },
  /** .ep-meta{11px;color:text-3;margin-top:5px;gap:6px;font-variant-numeric:tabular-nums} */
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: POD.epMetaGap,
    marginTop: POD.epMetaMarginTop,
  },
  metaText: {
    fontSize: POD.epMetaSize,
    fontVariant: ['tabular-nums'],
  },
  /** .sep{width:1px;height:9px;flex:none} */
  sep: {
    width: POD.epMetaSepWidth,
    height: POD.epMetaSepHeight,
    flexShrink: 0,
  },
  /** .ep-text{11.5px;color:text-2;line-height:1.6;margin-top:5px，两行截断} */
  intro: {
    fontSize: POD.epTextSize,
    lineHeight: Math.round(POD.epTextSize * POD.epTextLineHeight),
    marginTop: POD.epTextMarginTop,
  },
})
