import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { CARD_GRID } from '@/newui/theme'
// 直连具体 hook（不走 @/newui/hooks 桶口），与 PageViewport / PageListView 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

export interface CardGridProps {
  /** 卡片（PlCard 等）；单卡宽度由容器用 gridItemWidth 算出后传入 */
  children: ReactNode
  /** 行间隙，默认 = 轻量宽屏档的行间隙；竖屏档（档值 undefined）回 CARD_GRID.rowGap 的 14 */
  rowGap?: number
  /** 列间隙，同上，默认回 CARD_GRID.columnGap 的 12 */
  columnGap?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 卡片网格（对应原型 .pl-grid / .radio-grid / .rank-grid 的 1fr 1fr + gap）。
 * RN 没有 CSS grid，这里用 flexWrap + gap 表达；列数不由本组件持有——**几列 = 子卡宽度决定**，
 * 宽度来自 useGridItemWidth，轻量宽屏档（≥600 三列 / ≥840 四列）改的是卡宽，
 * 所以这一层不必知道档位，横竖屏各自换行。
 * 间隙的默认值走 useWideLayout（原型 styles.css:1318-1321：medium gap:16px 14px、expanded gap:16px 12px；
 * 两张栅格 .pl-grid 与 .rank-grid 同数），竖屏档逐值回 CARD_GRID 的 14×12 基线；
 * 显式传入间隙的调用点照本调。
 */
export const CardGrid = memo(
  ({ children, rowGap, columnGap, style }: CardGridProps) => {
    const { rowGap: tierRowGap, columnGap: tierColumnGap } = useWideLayout()
    return (
      <View
        style={[
          styles.root,
          {
            rowGap: rowGap ?? tierRowGap ?? CARD_GRID.rowGap,
            columnGap: columnGap ?? tierColumnGap ?? CARD_GRID.columnGap,
          },
          style,
        ]}
      >
        {children}
      </View>
    )
  },
)

CardGrid.displayName = 'NewUICardGrid'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
