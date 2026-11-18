import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { PAGING_END, useTheme } from '@/newui/theme'

export interface PagingEndProps {
  /** 终点行文案（原型 PLD_STATUS.end：「没有更多了」），由调用方从 const 传入 */
  text: string
  /** 落在两列网格（.pl-grid / .rank-grid）直接子位时 margin-top 收 10（原型 L285 grid-column:1/-1 同款） */
  inGrid?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 列表终点行（对应原型 .pl-end，styles.css L281-285 + app.js plEndRow L845-847）：
 * 「列到头那一行『没有更多了』：滚到底能确认『就这些』，两侧细线把它收成一条句号横线」。
 * 榜单页网格（L565）、歌单池（L766）、详情层曲目（L999）三处共用同一形态——
 * 纯展示组件，色与尺寸全走 theme token，不硬编码。
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
  /** display:flex;align-items:center;gap:10px;margin:20px 2px 6px（margin-top 走内联，网格/列表两档） */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAGING_END.gap,
    marginHorizontal: PAGING_END.marginX,
    marginBottom: PAGING_END.marginBottom,
  },
  /** ::before/::after content:'';flex:1;height:1px;opacity:.22 */
  line: {
    flex: 1,
    height: PAGING_END.lineHeight,
    opacity: PAGING_END.lineAlpha,
  },
  /** font-size:11.5px;letter-spacing:.4px（色走 theme.text3 内联） */
  text: {
    fontSize: PAGING_END.fontSize,
    letterSpacing: PAGING_END.letterSpacing,
  },
})
