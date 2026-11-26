import { useCallback, useRef } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { TOP_BAR } from '@/newui/theme'

export interface ViewportScrollOptions {
  /** 吸顶状态变化；只在跨越阈值时回调一次，避免每帧刷新父组件 */
  onPinnedChange?: (pinned: boolean) => void
  /**
   * 触底回调。不传 = 不启用。
   * RN 自带 onEndReachedThreshold 是视口高度倍数，换算不出固定像素语义，
   * 故用 offset / 内容高 / 视口高自算剩余距离；出触发线再回来才重新发（边沿触发）。
   */
  onEndReached?: () => void
  /** 距底触发线（px），仅在传了 onEndReached 时生效；0 = 触到最底才发 */
  endReachedDistance?: number
}

/** 直接铺到 ScrollView / FlatList（其内层同为 ScrollView）上的三个滚动计量事件 */
export interface ViewportScrollHandlers {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange: (width: number, height: number) => void
  onLayout: (e: LayoutChangeEvent) => void
}

/**
 * 页面滚动容器的滚动计量：顶栏吸顶、距底触底。
 * 裸 ScrollView 的 PageViewport 与 FlatList 的 PageListView 共用同一口径。
 */
export const useViewportScroll = ({
  onPinnedChange,
  onEndReached,
  endReachedDistance = 0,
}: ViewportScrollOptions): ViewportScrollHandlers => {
  const pinnedRef = useRef(false)
  const callbackRef = useRef(onPinnedChange)
  callbackRef.current = onPinnedChange
  // 触底透传：与 onPinnedChange 同款 ref 转发，回调换引用不引起 ScrollView 属性抖动
  const endReachedRef = useRef(onEndReached)
  endReachedRef.current = onEndReached
  const endReachedDistanceRef = useRef(endReachedDistance)
  endReachedDistanceRef.current = endReachedDistance
  // 边沿触发：进线只发一次，出线复位；内容尺寸或布局一变就重估，
  // 避免「请求在途 / 补回内容没推出触发线」时标志一直挂着、必须手动滚开再回来
  const endReachedFiredRef = useRef(false)
  // 吸顶三个输入：偏移 / 内容高 / 视口高。任一变化都重算——
  // 内容变短时平台会钳位偏移但不一定回抛 onScroll，只听 onScroll 会停在旧状态
  const offsetRef = useRef(0)
  const contentHeightRef = useRef(0)
  const viewportHeightRef = useRef(0)

  const evaluate = useCallback(() => {
    const maxOffset = Math.max(0, contentHeightRef.current - viewportHeightRef.current)
    const next = Math.min(offsetRef.current, maxOffset) > TOP_BAR.pinnedThreshold
    if (next === pinnedRef.current) return
    pinnedRef.current = next
    callbackRef.current?.(next)
  }, [])

  /** 触底判定（滚动 / 内容变化 / 布局变化三处共用）：
   * 剩余距离 = 内容高 - 视口高 - 偏移（按新内容高钳位），进线发一次、出线复位。 */
  const checkEndReached = useCallback(() => {
    if (!endReachedRef.current) return
    const viewport = viewportHeightRef.current
    const content = contentHeightRef.current
    // 首帧还没测得布局（0×0）时不判定，免得把「未测量」当成「已触底」空发信号
    if (viewport <= 0 || content <= 0) return
    const maxOffset = Math.max(0, content - viewport)
    const remaining = content - viewport - Math.min(offsetRef.current, maxOffset)
    if (remaining <= endReachedDistanceRef.current) {
      if (!endReachedFiredRef.current) {
        endReachedFiredRef.current = true
        endReachedRef.current()
      }
    } else {
      endReachedFiredRef.current = false
    }
  }, [])

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y
    evaluate()
    checkEndReached()
  }, [checkEndReached, evaluate])

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    contentHeightRef.current = height
    evaluate()
    // 内容一变先解边沿锁再重估：补齐渲染、失败 / 空页只加状态尾巴等场景都靠这里补发
    endReachedFiredRef.current = false
    checkEndReached()
  }, [checkEndReached, evaluate])

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    viewportHeightRef.current = e.nativeEvent.layout.height
    evaluate()
    checkEndReached()
  }, [checkEndReached, evaluate])

  return { onScroll, onContentSizeChange, onLayout }
}
