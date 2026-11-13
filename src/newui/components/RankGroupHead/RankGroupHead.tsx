import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_WEIGHT, RANK_GROUP, useTheme } from '@/newui/theme'
import { rankGroupCountLabel } from '@/newui/const'

export interface RankGroupHeadProps {
  /** 平台全称（原型 SOURCES[p].label，RN 侧 getPlatformMeta(source).label 传入） */
  label: string
  /** 该平台目录里的全部榜数（组头「N 个榜」的 N = 真实目录条数，不是已显示的排数） */
  total: number
  /** 是否为网格里的第一个组头（原型 .rank-group:first-child{margin-top:0}） */
  first?: boolean
}

/**
 * 排行榜按平台分段头（对应原型 .rank-group，styles.css L381-384 / app.js rankGroupHead L494-499）：
 * 平台全称 + 「N 个榜 · 热歌 / 新歌 / 飙升在前」，baseline 对齐。
 * 原型注释：分段标题让中途接着往下滚的人也知道自己正站在哪家的曲库里。
 * grid-column:1/-1 的「横跨整行」在 RN 侧用 width:'100%' 在 CardGrid 的换行容器里独占一整行表达。
 * 纯展示组件，数据由 RankPage 容器接线。
 */
export const RankGroupHead = memo(({ label, total, first = false }: RankGroupHeadProps) => {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.root,
        first ? styles.first : styles.follow,
      ]}
      accessibilityRole="header"
    >
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.count, { color: theme.colors.text3 }]} numberOfLines={1}>
        {rankGroupCountLabel(total)}
      </Text>
    </View>
  )
})

RankGroupHead.displayName = 'NewUIRankGroupHead'

const styles = StyleSheet.create({
  /** .rank-group{display:flex;align-items:baseline;gap:8px} + grid-column:1/-1 */
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: RANK_GROUP.gap,
  },
  /** margin:12px 0 -4px */
  follow: {
    marginTop: RANK_GROUP.marginTop,
    marginBottom: RANK_GROUP.marginBottom,
  },
  /** :first-child{margin-top:0}（负 margin 保留，把首组下方的卡拉近与后续组一致） */
  first: {
    marginTop: 0,
    marginBottom: RANK_GROUP.marginBottom,
  },
  /** b{font-size:13.5px;font-weight:800} */
  title: {
    fontSize: RANK_GROUP.titleSize,
    fontWeight: FONT_WEIGHT.extraBold,
    flexShrink: 0,
  },
  /** span{font-size:10.5px;color:var(--text-3)}（色经 theme 内联注入） */
  count: {
    fontSize: RANK_GROUP.countSize,
    flexShrink: 1,
  },
})
