import { CARD_GRID, gridItemWidth } from '@/newui/theme'

import { useWideLayout } from './useWideLayout'

/**
 * 卡片网格里单卡的宽度（RN 无 CSS 的 1fr，封面是 1:1 必须先算出边长）。
 * 经 useWideLayout 跟着 useWindowDimensions 走，横竖屏切换会自动重算。
 * @param columns 列数；**不传 = 吃轻量宽屏档**（竖屏档就是 CARD_GRID.columns 的 2，
 *   600-839 三列，≥840 四列，见 hooks/useWideLayout）；
 *   显式传列数的调用点不受档位影响（原型写死几列就是几列）
 * @param columnGap 列间隙；**不传 = 吃该档的栅格列间隙**（竖屏 = CARD_GRID.columnGap 的 12，
 *   medium 14 / expanded 12 —— 原型 styles.css:1318-1321 的 `gap:16px 14px` / `gap:16px 12px`）；
 *   显式传间隙的调用点照本调
 * 内容盒限宽与「先收盒宽再算列」的换算在 gridItemWidth 内做：限宽居中后卡片不能按整屏宽铺开。
 */
export const useGridItemWidth = (
  columns?: number,
  columnGap?: number,
): number => {
  const { windowWidth, columns: tierColumns, columnGap: tierColumnGap } = useWideLayout()
  return gridItemWidth(windowWidth, columns ?? tierColumns, columnGap ?? tierColumnGap ?? CARD_GRID.columnGap)
}
