import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_WEIGHT, RANK_GROUP, useTheme } from '@/newui/theme'
import { rankGroupCountLabel } from '@/newui/const'

export interface RankGroupHeadProps {
  /** 平台全称 */
  label: string
  /** 该平台全部榜数（不是已显示排数） */
  total: number
  /** 是否为网格里的第一个组头 */
  first?: boolean
}

/**
 * 排行榜按平台分段头：平台全称 + 「N 个榜 · 热歌 / 新歌 / 飙升在前」，baseline 对齐。
 * width:'100%' 在 CardGrid 换行容器里独占一整行。纯展示组件。
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
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: RANK_GROUP.gap,
  },
  follow: {
    marginTop: RANK_GROUP.marginTop,
    marginBottom: RANK_GROUP.marginBottom,
  },
  /** 首组上距归零（负 margin 保留，与后续组下方间距一致） */
  first: {
    marginTop: 0,
    marginBottom: RANK_GROUP.marginBottom,
  },
  title: {
    fontSize: RANK_GROUP.titleSize,
    fontWeight: FONT_WEIGHT.extraBold,
    flexShrink: 0,
  },
  count: {
    fontSize: RANK_GROUP.countSize,
    flexShrink: 1,
  },
})
