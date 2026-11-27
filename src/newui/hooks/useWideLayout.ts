import { useMemo } from 'react'
import { useWindowDimensions, type ViewStyle } from 'react-native'

import {
  topbarHeight,
  wideColumnsOf,
  wideContentMaxWidthOf,
  wideGridGapOf,
  wideLayerPaddingXOf,
  wideStructuralOf,
  wideTierOf,
  type WideStructural,
  type WideTier,
} from '@/newui/theme'

export interface WideLayout {
  /** 当前窗口宽（useWindowDimensions，横竖屏切换即时更新）；也是本档的唯一判据 */
  windowWidth: number
  /** 档位名（compact = 手机竖屏档，全部字段回到竖屏基线） */
  tier: WideTier
  /** 该档栅格列数：< 600 用 CARD_GRID.columns / 600-839 为 3 / ≥ 840 为 4 */
  columns: number
  /** 该档栅格行间隙：medium / expanded = 16；compact 为 undefined，消费侧回退 CARD_GRID.rowGap */
  rowGap?: number
  /** 该档栅格列间隙：medium 14 / expanded 12；compact 为 undefined，消费侧回退 CARD_GRID.columnGap */
  columnGap?: number
  /** 该档内容盒限宽（dp）；竖屏档为 undefined = 不限宽 */
  contentMaxWidth?: number
  /** 铺进滚动容器 contentContainerStyle 的限宽 + 水平居中样式；竖屏档为 undefined */
  boxStyle?: ViewStyle
  /** 该档的结构度量覆盖；竖屏档为 undefined，消费侧一律 `wide?.xxx ?? 竖屏基线 token` */
  wide?: WideStructural
  /** 单列行屏居中轴的左右内衬；竖屏档 undefined = 各屏继续用自己的 16 基线 */
  layerPaddingX?: number
  /** 顶栏总高（含状态栏）；判档收在本 hook 里，消费点不自己拼阈值 */
  topBarHeight: (statusBarHeight: number) => number
}

/**
 * 轻量宽屏档的唯一判据入口：阈值 600 / 840，内容盒限宽 620。
 * 消费侧只有三类动作：列数、栅格间隙与内容盒、结构度量（一律 `wide?.xxx ?? 竖屏基线`）。
 * 组件里不许再写 600 / 840 / 620 这类阈值；不做结构级形态（无侧栏、无详情主从等）。
 */
export const useWideLayout = (): WideLayout => {
  const { width: windowWidth } = useWindowDimensions()
  // 窗口宽不变时保持同一对象引用：容器是 memo 组件，样式对象每次新造会白重渲染
  return useMemo(() => {
    const contentMaxWidth = wideContentMaxWidthOf(windowWidth)
    const gap = wideGridGapOf(windowWidth)
    const wide = wideStructuralOf(windowWidth)
    return {
      windowWidth,
      tier: wideTierOf(windowWidth),
      columns: wideColumnsOf(windowWidth),
      rowGap: gap?.rowGap,
      columnGap: gap?.columnGap,
      contentMaxWidth,
      // 百分比宽 + maxWidth 取较小者，alignSelf 水平居中
      boxStyle: contentMaxWidth === undefined
        ? undefined
        : { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
      wide,
      layerPaddingX: wideLayerPaddingXOf(windowWidth),
      topBarHeight: statusBarHeight => topbarHeight(statusBarHeight, wide),
    }
  }, [windowWidth])
}
