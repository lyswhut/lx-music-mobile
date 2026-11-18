import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { EMPTY_TIP, FONT_SIZE, useTheme } from '@/newui/theme'

export interface EmptyTipProps {
  /** 空态文案（原型「这个分类下暂时没有推荐，换一个试试」） */
  text: string
  /** layer：歌单详情等右推层内的变体（原型 .pl-layer .empty-tip 内边距更大） */
  variant?: 'page' | 'layer'
  style?: StyleProp<ViewStyle>
}

/**
 * 空列表提示（对应原型 .empty-tip）：居中一句话，字号走三级文字色。
 */
export const EmptyTip = memo(({ text, variant = 'page', style }: EmptyTipProps) => {
  const theme = useTheme()
  return (
    <View style={[variant === 'layer' ? styles.layerPadding : styles.pagePadding, style]}>
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{text}</Text>
    </View>
  )
})

EmptyTip.displayName = 'NewUIEmptyTip'

const styles = StyleSheet.create({
  /** 页面内：padding 22px 0 6px */
  pagePadding: {
    paddingTop: EMPTY_TIP.paddingTop,
    paddingBottom: EMPTY_TIP.paddingBottom,
  },
  /** .pl-layer .empty-tip：padding 34px 0 */
  layerPadding: {
    paddingVertical: EMPTY_TIP.layerPaddingY,
  },
  /** 12.5px / text-3 / line-height 1.7 */
  text: {
    fontSize: FONT_SIZE.smallLg,
    lineHeight: EMPTY_TIP.lineHeight,
    textAlign: 'center',
  },
})
