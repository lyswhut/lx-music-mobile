import { CARD_GRID, gridItemWidth } from '@/newui/theme'

import { useWideLayout } from './useWideLayout'

/**
 * 卡片网格里单卡宽度（RN 无 1fr，封面 1:1 需先算边长），随窗口宽变化重算。
 * @param columns 列数；不传 = 吃轻量宽屏档
 * @param columnGap 列间隙；不传 = 吃该档的栅格列间隙
 */
export const useGridItemWidth = (
  columns?: number,
  columnGap?: number,
): number => {
  const { windowWidth, columns: tierColumns, columnGap: tierColumnGap } = useWideLayout()
  return gridItemWidth(windowWidth, columns ?? tierColumns, columnGap ?? tierColumnGap ?? CARD_GRID.columnGap)
}
