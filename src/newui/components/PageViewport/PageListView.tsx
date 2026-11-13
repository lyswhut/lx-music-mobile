import type { ReactElement } from 'react'
import { FlatList, StyleSheet, type ListRenderItem, type StyleProp, type ViewStyle } from 'react-native'

import { LIST_LOAD_LIMIT } from '@/core/songlist'
import { LAYOUT, TAB_BAR } from '@/newui/theme'
// 直连具体 hook（不走 @/newui/hooks 桶口），与兄弟件 PageViewport 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { useViewportScroll } from './useViewportScroll'

export interface PageListViewProps<T> {
  /** 列表数据（行粒度：网格场景由页面自行把卡片两两成行，见 PlaylistPage 的 PoolRow） */
  data: readonly T[]
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  /** 列表头（页头 / 分类条 / 横排等定长内容；随滚动进出、不回收）。
   *  RN 0.73 的 ListHeaderComponent 类型收 ReactElement（不收任意 ReactNode），页面侧各传单一 View 包装 */
  headerComponent?: ReactElement | null
  /** 列表尾（分页状态行 / 终点行 / 页脚说明等；类型同上） */
  footerComponent?: ReactElement | null
  /** 状态栏高度（TopBar 覆盖其上，内容上留白需等于顶栏总高） */
  topInset?: number
  /** 底部安全区（原型 --safe-b，与 Tab 栏一同叠加在内容留白之下） */
  bottomInset?: number
  /** 吸顶状态变化（与 PageViewport 同一 hook、同一阈值语义） */
  onPinnedChange?: (pinned: boolean) => void
  /** 触底回调（距底 endReachedDistance px，边沿触发；与 PageViewport 同口径） */
  onEndReached?: () => void
  /** 距底触发线（px），仅在传了 onEndReached 时生效 */
  endReachedDistance?: number
  /** 逐帧滚动偏移透传（主屏分类条吸顶越线判定用） */
  onScrollOffset?: (y: number) => void
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * 页面级**虚拟化**滚动容器（PageListView 之于 PageViewport = FlatList 之于 ScrollView）。
 * 背景（2026-10-16 真机 OOM 修复轮）：歌单页推荐池在裸 ScrollView 里 `.map` 全量直出，
 * 池子经 usePlaylistPool 分批累加**无上限**（一个分类几百上千份很正常），滚出屏幕的卡片
 * 不回收 —— 挂载视图数随池长线性增长，Yoga 节点把 Java 堆打满（OOM 栈顶 YogaNodeJNIBase）。
 * 本容器让「挂载视图数」退化为「屏内行数 + windowSize 余量」，与数据总长解耦。
 *
 * 与 PageViewport 的关系（成对件，口径逐字一致）：
 * - 同样的左右 16px 内边距 / 上留白顶栏总高 / 下留白「Tab 栏之上那段净空 + Tab 栏 + 安全区」；
 * - 同样的轻量宽屏档（useWideLayout：内容盒限宽 620 + 水平居中 = 原型 `.wide .page` styles.css:1316，
 *   上下内衬换成 `.wide .viewport{padding:92px 0 150px}` = styles.css:1315；
 *   竖屏档这几条全是 undefined / 基线值，不写任何宽样式）；
 * - 三项滚动计量（顶栏吸顶 pinned / 距底触底续取 / 偏移透传）走同一个 useViewportScroll——
 *   FlatList 的 onScroll / onContentSizeChange / onLayout 透传给内层 ScrollView，
 *   内容高含 header/footer  cell，与裸 ScrollView 的 contentContainer 计量同一坐标系。
 *
 * 刻意**不加** `removeClippedSubviews`：回收单元格里的 SVG 封面（Art 内圈层）在 Android 上
 * 有整格变白的老毛病（SearchResultPanel 2026-10-12 同轮结论）；windowSize 回收已够用。
 * 参数取现成范式（SonglistDetailScreen LIST_LOAD_LIMIT=30 判例，歌单详情 OOM 修复轮已验证）：
 * initialNumToRender 对齐 LIST_LOAD_LIMIT 覆盖平台一批最大条数；maxToRenderPerBatch=14 跟详情屏同档；
 * windowSize=7 保窗口余量、不把未滚到的行过早回收。网格行高约 220px，按行计。
 *
 * 泛型用普通函数组件而非 memo 包装：memo 会把泛型塌成 any/unknown，这里入参引用稳定性
 * 由页面侧（useCallback rows）保证。
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
  onScrollOffset,
  contentContainerStyle,
}: PageListViewProps<T>) {
  const scrollHandlers = useViewportScroll({ onPinnedChange, onEndReached, endReachedDistance, onScrollOffset })
  // 轻量宽屏：与 PageViewport 同一道内容盒限宽 + 居中 + 上下内衬（竖屏档全是 undefined / 基线值，零变化）
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
          // 上 = 本档顶栏总高（宽屏 92 / 竖屏 110，原型 .viewport padding-top 两条规则）；
          // 下 = 本档「Tab 栏之上那段净空 + Tab 栏高」+ 安全区（宽屏 84 + 44 → 150，styles.css:1315）
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
      initialNumToRender={LIST_LOAD_LIMIT}
      maxToRenderPerBatch={14}
      windowSize={7}
      updateCellsBatchingPeriod={50}
      {...scrollHandlers}
    />
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** .page padding:0 16px */
  content: {
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
})
