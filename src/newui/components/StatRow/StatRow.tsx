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
  /** 统计数值 */
  value: number
  /** 标签 */
  label: string
}

export interface StatRowProps {
  items: readonly StatItem[]
}

/**
 * 统计三格：等分横排，每格「数字 + 标签」。纯展示组件；数字口径由容器决定。
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
  /** 宽屏限宽 620（手机窄于此值无感） */
  root: {
    flexDirection: 'row',
    gap: MINE.statGap,
    marginTop: MINE.statMarginTop,
    maxWidth: MINE.statMaxWidth,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: MINE.statPaddingY,
    paddingHorizontal: MINE.statPaddingX,
    borderRadius: MINE.statRadius,
    borderWidth: 1,
  },
  value: {
    fontSize: FONT_SIZE.statValue,
    fontWeight: FONT_WEIGHT.black,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: MINE.statLabelMarginTop,
    fontSize: FONT_SIZE.tiny,
    letterSpacing: LETTER_SPACING.wide,
  },
})
