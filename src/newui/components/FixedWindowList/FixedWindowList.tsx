import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef,
  type ReactNode,
} from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

export interface FixedWindowListHandle {
  scrollToOffset: (options: { offset: number, animated?: boolean }) => void
}

export interface FixedWindowListProps<T> {
  data: readonly T[]
  /** 单行内容高度（px）。必须与实际渲染出来的行高严格一致，否则滚动位置会漂移 */
  rowHeight: number
  /** 行间距（px），等价于 CSS 的 gap；不要再用 contentContainerStyle.gap */
  rowGap?: number
  /** 视口上下各多挂几行（默认 6 行 ≈ 一屏的 60%，滚动时不露白） */
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string
  ListHeaderComponent?: ReactNode
  ListFooterComponent?: ReactNode
  ListEmptyComponent?: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps']
  scrollEventThrottle?: number
  /** 距底 = 视口高度的 onEndReachedThreshold 倍时触发，边沿触发（离开触发线后复位） */
  onEndReached?: () => void
  onEndReachedThreshold?: number
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange?: (width: number, height: number) => void
  onLayout?: (e: LayoutChangeEvent) => void
}

/**
 * 自管窗口的定高列表：行高由调用方给定，未挂载行用定高占位顶住，
 * contentSize 与滚动范围第一帧即准确。不用 FlatList/VirtualizedList：后者在
 * contentLength 为 0 时会锁死窗口（getItemLayout 也救不了），要等一次全局重排才解冻。
 */
function FixedWindowListInner<T>(
  {
    data,
    rowHeight,
    rowGap = 0,
    overscan = 6,
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    contentContainerStyle,
    style,
    showsVerticalScrollIndicator = false,
    keyboardShouldPersistTaps,
    scrollEventThrottle = 16,
    onEndReached,
    onEndReachedThreshold = 0.4,
    onScroll,
    onContentSizeChange,
    onLayout,
  }: FixedWindowListProps<T>,
  ref: ForwardedRef<FixedWindowListHandle>,
) {
  const pitch = rowHeight + rowGap
  const count = data.length

  const scrollRef = useRef<ScrollView>(null)
  const [viewport, setViewport] = useState(() => Dimensions.get('window').height)
  const [win, setWin] = useState(() => {
    const screenH = Dimensions.get('window').height
    return { first: 0, last: Math.min(count - 1, Math.ceil(screenH / pitch) + overscan) }
  })

  const scrollYRef = useRef(0)
  const contentHRef = useRef(0)
  /** 行区域在内容坐标系里的起点（= 头部高度 + 容器 paddingTop）；null = 还没量到 */
  const rowsTopRef = useRef<number | null>(null)
  const endFiredRef = useRef(false)

  // 回调放 ref：滚动事件高频，避免因闭包过期而反复重建监听
  const onEndReachedRef = useRef(onEndReached)
  onEndReachedRef.current = onEndReached
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll
  const onContentSizeChangeRef = useRef(onContentSizeChange)
  onContentSizeChangeRef.current = onContentSizeChange
  const onLayoutRef = useRef(onLayout)
  onLayoutRef.current = onLayout

  const syncWindow = useCallback(() => {
    if (count === 0) {
      setWin(prev => (prev.first === 0 && prev.last === -1 ? prev : { first: 0, last: -1 }))
      return
    }
    const top = scrollYRef.current
    const visible = Math.max(viewport, 1)
    const base = rowsTopRef.current
    let first = 0
    let last = count - 1
    if (base == null) {
      // 行起点未知时按「从第一行开始」铺，宁可多挂也不留白
      last = Math.min(count - 1, Math.ceil((top + visible) / pitch) + overscan)
    } else {
      const localTop = Math.max(0, top - base)
      const localBottom = Math.max(0, top + visible - base)
      first = Math.max(0, Math.floor(localTop / pitch) - overscan)
      last = Math.min(count - 1, Math.floor(localBottom / pitch) + overscan)
      if (last < first) last = first
    }
    setWin(prev => (prev.first === first && prev.last === last ? prev : { first, last }))
  }, [count, viewport, pitch, overscan])

  useEffect(() => {
    syncWindow()
  }, [syncWindow])

  // 数据长度变化（新一页落定 / 整单替换）时复位触底闩锁，
  // 否则追加后若仍在触发线内，会停在「已触发」状态不再加载
  useEffect(() => {
    endFiredRef.current = false
  }, [count])

  const checkEndReached = useCallback((offset: number, visible: number, content: number) => {
    const cb = onEndReachedRef.current
    if (!cb || visible <= 0 || content <= 0) return
    const remaining = content - visible - offset
    if (remaining > onEndReachedThreshold * visible) {
      endFiredRef.current = false
      return
    }
    if (endFiredRef.current) return
    endFiredRef.current = true
    cb()
  }, [onEndReachedThreshold])

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    scrollYRef.current = contentOffset.y
    syncWindow()
    checkEndReached(contentOffset.y, layoutMeasurement.height, contentSize.height)
    onScrollRef.current?.(e)
  }, [checkEndReached, syncWindow])

  /** 拖拽/惯性停手：再判一次窗口与触底（甩到底时最后一帧滚动事件可能早于内容补齐） */
  const handleScrollSettle = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    scrollYRef.current = contentOffset.y
    syncWindow()
    checkEndReached(contentOffset.y, layoutMeasurement.height, contentSize.height)
  }, [checkEndReached, syncWindow])

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    contentHRef.current = h
    // 内容变长后重新判一次触底
    checkEndReached(scrollYRef.current, viewport, h)
    onContentSizeChangeRef.current?.(w, h)
  }, [checkEndReached, viewport])

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h > 0) {
      setViewport(prev => (prev === h ? prev : h))
      // 视口变化后按新视口再判一次（内容比视口矮时也要能触发首屏补页）
      checkEndReached(scrollYRef.current, h, contentHRef.current)
    }
    onLayoutRef.current?.(e)
  }, [checkEndReached])

  /** 行区域起点：空 View 的 layout.y 就是「头部 + 容器 paddingTop」的累计高度 */
  const handleRowsTopLayout = useCallback((e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y
    if (rowsTopRef.current === y) return
    rowsTopRef.current = y
    syncWindow()
  }, [syncWindow])

  useImperativeHandle(ref, () => ({
    scrollToOffset: ({ offset, animated }) => {
      scrollRef.current?.scrollTo({ y: offset, animated })
    },
  }), [])

  const first = count === 0 ? 0 : win.first
  const last = count === 0 ? -1 : Math.min(win.last, count - 1)
  const topSpace = first * pitch
  // 每个已挂载行自带 rowGap 的尾部间距，末尾再减一次，使总高恰为 count × pitch − rowGap
  const bottomSpace = Math.max(0, (count - 1 - last) * pitch - rowGap)

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.base, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={handleScroll}
      onScrollEndDrag={handleScrollSettle}
      onMomentumScrollEnd={handleScrollSettle}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
    >
      {ListHeaderComponent}
      {/* 行区域起点探针：零高、不参与触摸，仅上报 layout.y */}
      <View
        collapsable={false}
        pointerEvents="none"
        onLayout={handleRowsTopLayout}
      />
      {count > 0 && topSpace > 0 ? <View style={{ height: topSpace }} /> : null}
      {data.slice(first, last + 1).map((item, offset) => {
        const index = first + offset
        return (
          <View key={keyExtractor(item, index)} style={{ height: rowHeight, marginBottom: rowGap }}>
            {renderItem(item, index)}
          </View>
        )
      })}
      {count > 0 && bottomSpace > 0 ? <View style={{ height: bottomSpace }} /> : null}
      {count === 0 ? ListEmptyComponent : null}
      {ListFooterComponent}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
})

export const FixedWindowList = forwardRef(FixedWindowListInner) as <T>(
  props: FixedWindowListProps<T> & { ref?: ForwardedRef<FixedWindowListHandle> },
) => ReturnType<typeof FixedWindowListInner>
