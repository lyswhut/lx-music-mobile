import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import {
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  MINE,
  useTheme,
} from '@/newui/theme'

export interface StatItem {
  key: string
  /** 统计数值（.stat b，等宽数字） */
  value: number
  /** 标签（.stat span） */
  label: string
}

export interface StatRowProps {
  items: readonly StatItem[]
}

/**
 * 统计三格（对应原型 .stat-row / .stat，styles.css L367-371）：等分横排，每格「数字 + 标签」。
 * 纯展示组件；数字口径由容器决定（喜欢 / 歌单 / 最近播放）。
 */
export const StatRow = memo(({ items }: StatRowProps) => {
  const theme = useTheme()
  return (
    <View style={styles.root}>
      {items.map(item => (
        <View
          key={item.key}
          style={[styles.cell, { backgroundColor: theme.colors.card, borderColor: theme.colors.line }]}
        >
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.value}</Text>
          <Text style={[styles.label, { color: theme.colors.text3 }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
})

StatRow.displayName = 'NewUIStatRow'

const styles = StyleSheet.create({
  /** .stat-row：row / gap 8 / margin-top 18；宽屏限宽 620（原型 .pad 档，手机窄于此值无感） */
  root: {
    flexDirection: 'row',
    gap: MINE.statGap,
    marginTop: MINE.statMarginTop,
    maxWidth: MINE.statMaxWidth,
  },
  /** .stat：flex 1、内边距 11/4、圆角 16、细描边（底色 .05 归到色板 chip） */
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: MINE.statPaddingY,
    paddingHorizontal: MINE.statPaddingX,
    borderRadius: MINE.statRadius,
    borderWidth: 1,
  },
  /** .stat b：17px / 900 / 等宽数字 */
  value: {
    fontSize: FONT_SIZE.statValue,
    fontWeight: FONT_WEIGHT.black,
    fontVariant: ['tabular-nums'],
  },
  /** .stat span：10.5px / text-3 / margin-top 3 / letter-spacing .4 */
  label: {
    marginTop: MINE.statLabelMarginTop,
    fontSize: FONT_SIZE.tiny,
    letterSpacing: LETTER_SPACING.wide,
  },
})
