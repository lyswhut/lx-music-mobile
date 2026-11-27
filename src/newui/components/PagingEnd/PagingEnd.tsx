import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { PAGING_END, useTheme } from '@/newui/theme'

export interface PagingEndProps {
  /** 终点行文案（「没有更多了」），由调用方传入 */
  text: string
  /** 落在网格直接子位时缩小上间距 */
  inGrid?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 列表终点行：「没有更多了」+ 两侧细线，滚到底能确认列表就这些。
 * 纯展示组件，色与尺寸全走 theme token。
 */
export const PagingEnd = memo(({ text, inGrid = false, style }: PagingEndProps) => {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.root,
        { marginTop: inGrid ? PAGING_END.marginTopInGrid : PAGING_END.marginTop },
        style,
      ]}
    >
      <View style={[styles.line, { backgroundColor: theme.colors.text3 }]} />
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{text}</Text>
      <View style={[styles.line, { backgroundColor: theme.colors.text3 }]} />
    </View>
  )
})

PagingEnd.displayName = 'NewUIPagingEnd'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAGING_END.gap,
    marginHorizontal: PAGING_END.marginX,
    marginBottom: PAGING_END.marginBottom,
  },
  line: {
    flex: 1,
    height: PAGING_END.lineHeight,
    opacity: PAGING_END.lineAlpha,
  },
  text: {
    fontSize: PAGING_END.fontSize,
    letterSpacing: PAGING_END.letterSpacing,
  },
})
