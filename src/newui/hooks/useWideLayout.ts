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
  /**
   * 当前窗口宽 = 本档的唯一判据（横竖屏切换即时更新，走 useWindowDimensions 而非屏幕物理宽）。
   * 与原型同一口径的换算：原型的判据是「屏内宽 = 外框宽 − `WIDE_EDGE`(11) × 2」
   * （app.js:3483 / app.js:3491 `wideInnerW`），而 RN 的窗口宽本身就是屏内宽（没有那圈装饰边框），
   * 所以同一个数直接代同一组阈值（app.js:3485 `WIDE_TIERS` 的 600 / 840）。
   */
  windowWidth: number
  /** 档位名（compact = 手机竖屏档 = 本 hook 全部字段回到竖屏基线） */
  tier: WideTier
  /** 该档的栅格列数：< 600 = CARD_GRID.columns（2）/ 600-839 = 3 / ≥ 840 = 4 */
  columns: number
  /** 该档栅格**行**间隙：medium / expanded = 16（styles.css:1318-1321）；**compact = undefined**，
   *  消费侧写 `?? CARD_GRID.rowGap` 回 14 那条竖屏基线（基线本值不许改） */
  rowGap?: number
  /** 该档栅格**列**间隙：medium 14 / expanded 12；**compact = undefined** → 消费侧 `?? CARD_GRID.columnGap`（12） */
  columnGap?: number
  /**
   * 该档的内容盒限宽（dp，原型 `.wide .page{max-width:620px}`，styles.css:1316 / app.js:3484 `WIDE_MAX_W`）；
   * 竖屏档（< 600）为 undefined = 不限宽。
   * 要「数值」的调用点读这一条，只往样式里铺的调用点读下面的 boxStyle（同源，boxStyle 就是它的样式形态）。
   */
  contentMaxWidth?: number
  /**
   * 直接铺进页面滚动容器 `contentContainerStyle` 的限宽 + 水平居中样式。
   * 竖屏档是 undefined —— 铺上去等于什么都没写（窄屏那侧零变化）。
   */
  boxStyle?: ViewStyle
  /**
   * 该档的**结构度量覆盖**（原型 `.wide` 那一族规则的逐值镜像，每键出处见 tokens.ts `WIDE_STRUCTURAL`）。
   * 竖屏档是 undefined：消费侧一律写 `wide?.xxx ?? 竖屏基线 token`，
   * 于是 compact 分支既取不到宽值、也不会有任何一条宽样式落到树上。
   */
  wide?: WideStructural
  /**
   * 单列行屏那根 620 居中轴的左右内衬（原型 `max(16px, calc((100% - 620px)/2))`，styles.css:1335-1340 六处同式）。
   * 竖屏档 undefined = 各屏继续吃自己的 16 基线。
   */
  layerPaddingX?: number
  /**
   * 顶栏总高（消费点：TopBar 自身高 / 两个滚动容器上内衬 / 分类条吸顶触发线）。
   * = `topbarHeight(statusBarHeight, wide)`：竖屏 2 + 行高 46 + 10，
   * 宽屏档换成原型的 36 − 32 = 4 那截（styles.css:1314），代实测状态栏即 92，
   * 与 `.wide .viewport{padding-top:92px}`（styles.css:1315）同一数。
   * 判档收在本 hook 里，各消费点不许自己拼阈值。
   */
  topBarHeight: (statusBarHeight: number) => number
}

/**
 * 轻量宽屏档的唯一判据入口。
 * 口径全部指向原型：阈值 600 / 840 = `new_design/app.js:3485` 的 `WIDE_TIERS`（挂在实测屏内宽上，
 * 屏内宽 = 外框宽 − `WIDE_EDGE`×2 = `app.js:3491`）；内容盒限宽 620 = `new_design/styles.css:1316`
 * 的 `.wide .page` 与 `app.js:3484` 的 `WIDE_MAX_W`；结构度量 = `styles.css:1308-1343` 那一族
 * `.wide` 规则（tokens.ts 的 `WIDE_STRUCTURAL` 逐条注明来源行号）。
 *
 * 一个 hook 统一算档，消费侧只有三类动作：
 * 1. 列数 —— `useGridItemWidth` 的默认列数吃它（所有用默认列数的栅格自动分档）、
 *    虚拟化页的「按列数成行」也吃它；
 * 2. 栅格间隙与内容盒 —— `rowGap`/`columnGap` 换 CardGrid 与手工成行的默认值，
 *    `boxStyle` 铺在页面滚动容器 contentContainerStyle 上（限宽 + 居中）；
 * 3. 结构度量 —— 顶栏 / Tab 栏 / 迷你条 / 轮播 / 单列行屏那几处高度与内衬读 `wide?.xxx`，
 *    竖屏基线（`TOP_BAR.*` / `TAB_BAR.*` / `MINIBAR.*` / `BANNER.height` / `PL_LAYER.paddingX` /
 *    `LAYOUT.contentGapAboveTabBar`）一个都没改。
 *
 * 判档**只在本文件与 tokens.ts 的 `wide*Of` 一组函数里**：组件里不许再写 600 / 840 / 620 这类阈值。
 * 明确不做结构级形态：没有左侧导航栏、没有详情主从、设定页不加两列、播放页不动。
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
      // 百分比宽 + maxWidth：盒宽取「窗口宽与限宽的较小者」，alignSelf 让它在滚动容器里水平居中
      boxStyle: contentMaxWidth === undefined
        ? undefined
        : { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
      wide,
      layerPaddingX: wideLayerPaddingXOf(windowWidth),
      topBarHeight: statusBarHeight => topbarHeight(statusBarHeight, wide),
    }
  }, [windowWidth])
}
