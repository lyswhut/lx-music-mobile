import type { ReactElement } from 'react'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { FixedWindowList } from '@/newui/components/FixedWindowList/FixedWindowList'
import { LAYOUT, TAB_BAR } from '@/newui/theme'
// 直连具体 hook，与兄弟件 PageViewport 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { useViewportScroll } from './useViewportScroll'

export interface PageListViewProps<T> {
  /** 列表数据（行粒度：网格场景由页面自行把卡片两两成行，见 PlaylistPage 的 PoolRow） */
  data: readonly T[]
  renderItem: (item: T, index: number) => ReactElement
  keyExtractor: (item: T, index: number) => string
  /** 列表头（页头 / 分类条 / 横排等定长内容，随滚动进出、不回收）。
   *  页面侧各自包一层 View */
  headerComponent?: ReactElement | null
  /** 列表尾（分页状态行 / 终点行 / 页脚说明等，类型同上） */
  footerComponent?: ReactElement | null
  /** 状态栏高度（TopBar 覆盖其上，内容上留白需等于顶栏总高） */
  topInset?: number
  /** 底部安全区，与 Tab 栏一同叠在内容留白之下 */
  bottomInset?: number
  /** 吸顶状态变化（与 PageViewport 同一 hook、同一阈值语义） */
  onPinnedChange?: (pinned: boolean) => void
  /** 触底回调（距底 endReachedDistance px，边沿触发） */
  onEndReached?: () => void
  /** 距底触发线（px），仅在传了 onEndReached 时生效 */
  endReachedDistance?: number
  /** 透传给内容容器的样式 */
  contentContainerStyle?: StyleProp<ViewStyle>
  /** 单行内容高度（px）。必须与实际渲染行高一致，否则滚动位置漂移 */
  rowHeight: number
  /** 行间距（px），由本组件挂在每行 marginBottom，调用方不要在行内容里再加同值 margin */
  rowGap?: number
  /** 视口上下各多挂几行，默认 6 */
  overscan?: number
}

/**
 * 页面级虚拟化滚动容器（定高行形态，与 PageViewport 成对）。
 * 推荐池等无上限增长的列表必须走虚拟化：挂载视图数 ≈ 屏内行数 + overscan，
 * 与数据总长解耦，避免 Yoga 节点涨爆 Java 堆。
 * 内边距 / 顶栏留白 / 底部留白 / 宽屏限宽 620 居中，与 PageViewport 逐值一致；
 * 两项滚动计量（吸顶 / 触底）走同一个 useViewportScroll，滚动事件透传给内层 ScrollView，坐标系相同。
 * 内部用 FixedWindowList 而非 FlatList：VirtualizedList 在 contentLength 为 0 时会锁死
 * 渲染窗口（getItemLayout 也救不了），Android 上 RNN push/pop 使 ScrollView 重新附着后
 * 该守卫条件会再次生效，追加数据不进窗口——即「正在加载下一批」后列表尾空白的根因。
 * FixedWindowList 自管窗口：行高由调用方给定，未挂载行用定高占位顶住，
 * contentSize 第一帧即准确，不依赖原生 contentSize 上报解冻。
 * 泛型用普通函数组件而非 memo：memo 会把泛型塌成 any/unknown，入参稳定性由页面侧保证。
 */
export function PageListView<T>({
  data,
  renderItem,
  keyExtractor,
  headerComponent,
  footerComponent,
  topInset = 0,
  bottomInset = 0,
  onPinnedChange,
  onEndReached,
  endReachedDistance = 0,
  contentContainerStyle,
  rowHeight,
  rowGap = 0,
  overscan,
}: PageListViewProps<T>) {
  const scrollHandlers = useViewportScroll({ onPinnedChange, onEndReached, endReachedDistance })
  // 宽屏：与 PageViewport 同一道限宽 + 居中 + 上下内衬（竖屏档全为基线值，零变化）
  const { boxStyle, wide, topBarHeight } = useWideLayout()

  return (
    <FixedWindowList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerComponent ?? undefined}
      ListFooterComponent={footerComponent ?? undefined}
      rowHeight={rowHeight}
      rowGap={rowGap}
      overscan={overscan}
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          // 上 = 本档顶栏总高；下 = 本档「Tab 栏之上净空 + Tab 栏高」+ 安全区
          paddingTop: topBarHeight(topInset),
          paddingBottom:
            (wide?.contentGapAboveTabBar ?? LAYOUT.contentGapAboveTabBar) +
            (wide?.tabBarHeight ?? TAB_BAR.height) +
            bottomInset,
        },
        boxStyle,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      // 吸顶 / 触底计量透传：FixedWindowList 把这三个事件原样挂到内层 ScrollView
      onScroll={scrollHandlers.onScroll}
      onContentSizeChange={scrollHandlers.onContentSizeChange}
      onLayout={scrollHandlers.onLayout}
    />
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
})
