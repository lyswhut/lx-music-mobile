import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { EMPTY_TIP, FONT_SIZE, useTheme } from '@/newui/theme'

export interface EmptyTipProps {
  /** 空态文案 */
  text: string
  /** layer：右推层内变体，内边距更大 */
  variant?: 'page' | 'layer'
  style?: StyleProp<ViewStyle>
}

/** 空列表提示：居中一句话，三级文字色。 */
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
  pagePadding: {
    paddingTop: EMPTY_TIP.paddingTop,
    paddingBottom: EMPTY_TIP.paddingBottom,
  },
  layerPadding: {
    paddingVertical: EMPTY_TIP.layerPaddingY,
  },
  text: {
    fontSize: FONT_SIZE.smallLg,
    lineHeight: EMPTY_TIP.lineHeight,
    textAlign: 'center',
  },
})
