import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { CARD_GRID } from '@/newui/theme'
// 直连具体 hook，不走 @/newui/hooks 桶口
import { useWideLayout } from '@/newui/hooks/useWideLayout'

export interface CardGridProps {
  /** 卡片；单卡宽度由容器用 gridItemWidth 算出后传入 */
  children: ReactNode
  /** 行间隙；缺省取宽屏档，竖屏回 CARD_GRID.rowGap（14） */
  rowGap?: number
  /** 列间隙；缺省取宽屏档，竖屏回 CARD_GRID.columnGap（12） */
  columnGap?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 卡片网格：flexWrap + gap 表达等分列，列数由子卡宽度决定（宽度来自 useGridItemWidth），
 * 这一层不必知道档位，横竖屏各自换行。
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
