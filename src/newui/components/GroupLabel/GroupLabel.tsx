import { memo, type ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { FONT_WEIGHT, OPTION_ROW, useTheme } from '@/newui/theme'

export interface GroupLabelProps {
  /** 标签文字 */
  label: string
  /**
   * 右槽内容（如折叠开关 FoldToggle）：传入即变 space-between；
   * 不传保持原样，对既有调用方零影响。
   */
  trailing?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 浮层分组小标：10.5 / 800 / 字距 1.3 / text-3。
 * 根节点用 View 而非 Text，右槽由 trailing 承载。
 */
export const GroupLabel = memo(({ label, trailing, style }: GroupLabelProps) => {
  const theme = useTheme()
  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.text, { color: theme.colors.text3 }]}>
        {label}
      </Text>
      {trailing}
    </View>
  )
})

GroupLabel.displayName = 'NewUIGroupLabel'

const styles = StyleSheet.create({
  /** 外距 + 横排（space-between / 垂直居中） */
  root: {
    marginTop: OPTION_ROW.labelMarginTop,
    marginBottom: OPTION_ROW.labelMarginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: OPTION_ROW.labelFoldGap,
  },
  text: {
    flexShrink: 1,
    fontSize: OPTION_ROW.labelSize,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: OPTION_ROW.labelLetterSpacing,
  },
})
