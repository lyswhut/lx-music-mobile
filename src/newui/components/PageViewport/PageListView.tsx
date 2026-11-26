import type { ReactElement } from 'react'
import { FlatList, StyleSheet, type ListRenderItem, type StyleProp, type ViewStyle } from 'react-native'

import { LAYOUT, TAB_BAR } from '@/newui/theme'
// 直连具体 hook，与兄弟件 PageViewport 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { useViewportScroll } from './useViewportScroll'

export interface PageListViewProps<T> {
  /** 列表数据（行粒度：网格场景由页面自行把卡片两两成行，见 PlaylistPage 的 PoolRow） */
  data: readonly T[]
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  /** 列表头（页头 / 分类条 / 横排等定长内容，随滚动进出、不回收）。
   *  RN 0.73 的 ListHeaderComponent 只收 ReactElement，页面侧各自包一层 View */
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
}

/**
 * 页面级虚拟化滚动容器（FlatList 形态，与 PageViewport 成对）。
 * 推荐池等无上限增长的列表必须走虚拟化：挂载视图数 ≈ 屏内行数 + windowSize 余量，
 * 与数据总长解耦，避免 Yoga 节点涨爆 Java 堆。
 * 内边距 / 顶栏留白 / 底部留白 / 宽屏限宽 620 居中，与 PageViewport 逐值一致；
 * 两项滚动计量（吸顶 / 触底）走同一个 useViewportScroll，FlatList 的滚动事件透传给内层 ScrollView，坐标系相同。
 * 单元格里的 SVG 封面在 Android 回收后可能整格变白，回收参数按实测取 removeClippedSubviews + windowSize。
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
}: PageListViewProps<T>) {
  const scrollHandlers = useViewportScroll({ onPinnedChange, onEndReached, endReachedDistance })
  // 宽屏：与 PageViewport 同一道限宽 + 居中 + 上下内衬（竖屏档全为基线值，零变化）
  const { boxStyle, wide, topBarHeight } = useWideLayout()

  return (
    <FlatList
      data={data as T[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={footerComponent}
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
      // 网格行高随屏宽动态变化，无法 getItemLayout；首批按约一屏渲染，后续按批次补
      initialNumToRender={12}
      maxToRenderPerBatch={4}
      windowSize={8}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      {...scrollHandlers}
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
