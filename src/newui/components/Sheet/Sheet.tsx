import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { BlurView } from '@react-native-community/blur'

import {
  ART_INK,
  FONT_SIZE,
  FONT_WEIGHT,
  GLASS_PERF,
  MOTION,
  SHEET,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { blurNativeRegistered } from '../Glass'

/** 浮层统一缓动 */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

/**
 * 浮层「虚拟化主体」的行配置（可选）。
 * 传入后自带滚动容器由 ScrollView 换成 FlatList，handle/标题/副题进列表头部 cell，
 * 挂载视图数退化为屏内行 + windowSize 余量；仍只有一层滚动容器，不嵌第二层。
 */
export interface SheetListProps<T> {
  data: readonly T[]
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  /** 头部 cell 内、标题/副题之下的附加定长内容（如评论三态提示），随滚动、不回收 */
  headerComponent?: ReactElement | null
  /**
   * 钉住区（可选）：传了它，handle/标题/副题与本组件一起钉在滚动区上方，只有下方列表滚。
   * 不传 = 与旧行为一致：head 与 headerComponent 同进列表头部 cell、随内容滚。
   */
  pinnedComponent?: ReactElement | null
  /** 列表尾 cell（如分页状态行），随滚动 */
  footerComponent?: ReactElement | null
  // 虚拟化精细化参数（覆盖 token 默认值）
  /** 固定高度列表可提供精确 offset，避免最后一行只剩半截 */
  getItemLayout?: (data: ArrayLike<T> | null | undefined, index: number) => {
    length: number
    offset: number
    index: number
  }
  /** 首批初始渲染数量（如评论每页 15 条，首批全渲染） */
  initialNumToRender?: number
  /** 动态高度列表滚到某位置时可能算不准 offset，交给 VirtualizedList 回调重试 */
  onScrollToIndexFailed?: (info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => void
}

export interface SheetProps<T = unknown> {
  /** 显隐（false 时播完退场动画后自动卸载） */
  visible: boolean
  /** 标题；不传则不渲染 */
  title?: string
  /** 副题；不传则不渲染 */
  subtitle?: string
  /** 关闭（点遮罩 / Android 返回键都走它） */
  onClose: () => void
  /** 滚动内容；list 模式下忽略（主体由列表承载） */
  children?: ReactNode
  /** 底部安全区（叠加在内边距之下） */
  bottomInset?: number
  /**
   * 滚动接近底部时回调（浮层内含分页列表时用）；不传则不挂触底链路。
   * ScrollView 模式用 onScroll 距底判定（RN 0.73 的 ScrollViewProps 无 onEndReached），
   * FlatList 模式用自记度量补判；重复触发挡重入由调用方负责。
   */
  onEndReached?: () => void
  /**
   * 虚拟化主体（可选）：传了就把 ScrollView 换成 FlatList（分页累加的大列表专用）。
   * 不传 = 普通浮层，其余浮层零影响。
   */
  list?: SheetListProps<T>
}

/**
 * 通用底部浮层：遮罩淡入 + 体贴退场，圆角顶部、surface2→surface 竖向渐变 + 顶边高光，
 * max-height 78% 内滚动；点遮罩或 Android 返回键关闭。
 * 实现为所在屏幕根 View 内的 absolute-fill 覆盖层，不走 Modal/新路由，退场动画最顺。
 * 遮罩毛玻璃直挂 BlurView（与玻璃层共用 blurNativeRegistered 探测位）：模糊在下、染色在上；
 * 原生模块未注册时退回纯半透明黑。刻意不走 BlurredContainer（其降级是不透明表面底，与遮罩不同族）。
 */
export function Sheet<T = unknown>({
  visible,
  title,
  subtitle,
  onClose,
  children,
  bottomInset = 0,
  onEndReached,
  list,
}: SheetProps<T>) {
  const theme = useTheme()
  const { height: windowHeight } = useWindowDimensions()
  // 退场动画播完前保持挂载
  const [mounted, setMounted] = useState(visible)
  /**
   * 遮罩是整屏面积的模糊，挂载即要做全屏截图 + RenderScript 模糊，与入场位移撞帧会掉帧；
   * 延到入场播完再挂，染色层从头就在，模糊晚到 400ms 在深色遮罩上几乎看不出。
   */
  const [blurReady, setBlurReady] = useState(false)
  const progress = useMemo(() => new Animated.Value(visible ? 1 : 0), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible) setMounted(true)
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? SHEET.bodyDuration : SHEET.exitDuration,
      easing: EASE,
      // 位移与遮罩 opacity 均可原生驱动（maxHeight 是静态样式），走原生后不依赖 JS 帧
      useNativeDriver: true,
    })
    animation.start(({ finished }) => {
      if (!visible && finished) setMounted(false)
    })
    return () => animation.stop()
  }, [visible, progress])

  // 遮罩模糊延后到入场结束；退场期间保持（撤模糊会看到背景瞬间变清），播完再复位
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => setBlurReady(false), SHEET.exitDuration)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setBlurReady(true), SHEET.bodyDuration)
    return () => clearTimeout(timer)
  }, [visible])

  // Android 物理返回键：浮层开着时先收浮层
  useEffect(() => {
    if (!visible) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => subscription.remove()
  }, [visible, onClose])

  /**
   * list 模式的触底链路：引用永不变（VirtualizedList 对回调引用变化会告警并重建监听），经 ref 透传。
   * 不用 FlatList 原生 onEndReached——动态高度列表下 VirtualizedList 的视口估算不准会永不触发。
   * 改为自记 offset / 视口高 / 内容高，在 onScroll、滚动停手、onContentSizeChange、onLayout
   * 四个时机共用同一阈值补判；同一内容高只发一次（滚离底部即解除），调用方再叠 isLoading/isEnd 闸门。
   * 必须认 onContentSizeChange：首开时列表先以空数据挂载、数据到了才长高，只认滚动事件会永远等不到。
   */
  const endReachedRef = useRef(onEndReached)
  endReachedRef.current = onEndReached
  /** 最近一次的滚动度量（供非滚动时机补判用） */
  const listScrollMetricsRef = useRef({ offset: 0, visible: 0, content: 0 })
  /** 上次触底触发时的内容高；同一高度只发一次 */
  const listSentEndForContentLengthRef = useRef(0)

  const checkListEndReached = useCallback(() => {
    const callback = endReachedRef.current
    if (callback == null) return
    const { offset, visible, content } = listScrollMetricsRef.current
    // 首帧未测量（0）不判，防把「还没布局」误读成「已触底」
    if (visible <= 0 || content <= 0) return
    // 偏移按当前内容高钳位：数据变短（如重开回到第 1 页）时平台不一定回抛 onScroll
    const maxOffset = Math.max(0, content - visible)
    const distanceFromEnd = maxOffset - Math.min(offset, maxOffset)
    if (distanceFromEnd >= SHEET.endReachThreshold) {
      // 滚离底部了 → 解除同内容高去重，允许滚回来时再次触发
      listSentEndForContentLengthRef.current = 0
      return
    }
    if (content === listSentEndForContentLengthRef.current) return
    listSentEndForContentLengthRef.current = content
    callback()
  }, [])

  /** 滚动事件（含拖拽结束 / 惯性结束）：收三段度量后补判一次 */
  const handleListScrollForEndReached = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    listScrollMetricsRef.current = {
      offset: contentOffset.y,
      visible: layoutMeasurement.height,
      content: contentSize.height,
    }
    checkListEndReached()
  }, [checkListEndReached])

  const handleListContentSizeChange = useCallback((_width: number, height: number) => {
    listScrollMetricsRef.current.content = height
    checkListEndReached()
  }, [checkListEndReached])

  const handleListLayout = useCallback((e: LayoutChangeEvent) => {
    listScrollMetricsRef.current.visible = e.nativeEvent.layout.height
    checkListEndReached()
  }, [checkListEndReached])

  // 每次浮层重新打开：度量与去重锁归零——列表已重新挂载（回到顶部），旧会话的值不该拦新会话的触底
  useEffect(() => {
    if (!visible) return
    listScrollMetricsRef.current = { offset: 0, visible: 0, content: 0 }
    listSentEndForContentLengthRef.current = 0
  }, [visible])

  if (!mounted) return null

  // translateY(100%) 是自身高度的百分比，但 RN 的 translateY 只接受 number（百分比字符串会直接崩溃），
  // 且体贴高度随内容变化并被 max-height 78% 截断，故用窗口高像素近似：向下位移一整屏必然完全出屏。
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  })

  /** handle + 标题 + 副题（两条主体路径共用同一结构） */
  const sheetHead = (
    <>
      {/* 36×4 胶囊 */}
      <View style={[styles.handle, { backgroundColor: theme.colors.fill4 }]} />
      {title != null && title.length > 0 && (
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      )}
      {subtitle != null && subtitle.length > 0 && (
        <Text style={[styles.sub, { color: theme.colors.text3 }]}>{subtitle}</Text>
      )}
    </>
  )

  return (
    <View style={styles.root} accessibilityViewIsModal>
      {/* 遮罩：容器必须透底（Android BlurView 采样窗口身后内容，自带底色会被一起糊进去），
          故 BlurView 在前（下）、染色层在后（上）；原生模块未注册时只渲染染色层，天然降级。 */}
      <Animated.View style={[styles.mask, { opacity: progress }]}>
        {blurNativeRegistered && blurReady && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurAmount={SHEET.maskBlur}
            blurType={theme.scheme}
            // Android：染色由下方 maskTint 层承担，关掉库自带 overlay；
            // autoUpdate 与常驻玻璃位同一开关。整屏面积模糊下，浮层开着时身后页面并不动，
            // 冻结快照无可观感代价，纯省开销。iOS：系统「降低透明度」时的纯色兜底。
            {...(Platform.OS === 'android'
              ? { overlayColor: 'transparent', autoUpdate: GLASS_PERF.androidAutoUpdate }
              : { reducedTransparencyFallbackColor: withAlpha(ART_INK.veil, SHEET.maskAlpha) })}
          />
        )}
        <View pointerEvents="none" style={styles.maskTint} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="关闭面板"
        />
      </Animated.View>

      {/* .sheet-body：渐变 + 顶边 1px 高光；78% 窗口高内滚动 */}
      <Animated.View
        style={[
          styles.bodyWrap,
          {
            transform: [{ translateY }],
            maxHeight: windowHeight * SHEET.maxHeightRatio,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.surface2, theme.colors.surface]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.body,
            {
              borderTopColor: theme.colors.lineStrong,
            },
          ]}
        >
          {list ? (
            /* 虚拟化主体：骨架自带滚动容器就地换成 FlatList，不往 children 嵌第二层。
               不启用 removeClippedSubviews——回收单元里的 SVG 封面在 Android 有整格变白的老毛病，
               windowSize 回收已够用。传了 pinnedComponent 时，handle/标题/副题摆到 FlatList 之外当钉住区。 */
            <>
              {list.pinnedComponent != null && (
                /* 钉住区：.sheet-body 的 padding 只落一次——paddingTop + paddingX 归本区，
                   滚动内容只留 paddingX（pinnedScrollContent），两态像素同一张版面。 */
                <View style={styles.pinnedZone}>
                  {sheetHead}
                  {list.pinnedComponent}
                </View>
              )}
              <FlatList
                data={list.data as T[]}
                renderItem={list.renderItem}
                keyExtractor={list.keyExtractor}
                ListHeaderComponent={
                  list.pinnedComponent != null
                    ? list.headerComponent
                    : <>{sheetHead}{list.headerComponent}</>
                }
                ListFooterComponent={list.footerComponent}
                style={styles.scroll}
                contentContainerStyle={[
                  list.pinnedComponent != null ? styles.pinnedScrollContent : styles.scrollContent,
                  // 底部补偿：避免最后一个 item 被 overflow:hidden 裁半截，保守取一行高度上界
                  { paddingBottom: SHEET.paddingBottom + bottomInset + SHEET.listBottomCompensation },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={MOTION.scrollThrottle}
                getItemLayout={list.getItemLayout}
                initialNumToRender={list.initialNumToRender ?? SHEET.listInitialNumToRender}
                maxToRenderPerBatch={SHEET.listMaxToRenderPerBatch}
                windowSize={SHEET.listWindowSize}
                onScrollToIndexFailed={list.onScrollToIndexFailed}
                // 不用 FlatList 原生 onEndReached——动态高度下估算不准，改自记度量 + 多时机补判
                onScroll={onEndReached ? handleListScrollForEndReached : undefined}
                onScrollEndDrag={onEndReached ? handleListScrollForEndReached : undefined}
                onMomentumScrollEnd={onEndReached ? handleListScrollForEndReached : undefined}
                onContentSizeChange={onEndReached ? handleListContentSizeChange : undefined}
                onLayout={onEndReached ? handleListLayout : undefined}
              />
            </>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: SHEET.paddingBottom + bottomInset },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={
                onEndReached
                  ? (e) => {
                      // RN 0.73 的 ScrollViewProps 无 onEndReached，用 onScroll 距底判定等价复刻；
                      // 事件会连发，靠调用方的 isLoading/isEnd 挡重入。
                      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
                      if (
                        contentOffset.y + layoutMeasurement.height >=
                        contentSize.height - SHEET.endReachThreshold
                      ) {
                        onEndReached()
                      }
                    }
                  : undefined
              }
              scrollEventThrottle={MOTION.scrollThrottle}
            >
              {sheetHead}
              {children}
            </ScrollView>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  )
}

Sheet.displayName = 'NewUISheet'

const styles = StyleSheet.create({
  /**
   * 所在屏幕根 View 的最后一层 + 显式 Z_LAYER.sheet
   *（详情层内容也带 zIndex，浮层只靠「排在最后」会被盖住）
   */
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: Z_LAYER.sheet,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
  },
  /** 染色层独立压在模糊像之上，不画在 mask 容器上——容器必须透底，Android BlurView 才糊得到身后页面 */
  maskTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(ART_INK.veil, SHEET.maskAlpha),
  },
  bodyWrap: {
    width: '100%',
  },
  /** 顶部 28；底部原为嵌合假机框的补偿，真机贴屏底改 0；顶边高光转 1px 实描边 */
  body: {
    flexGrow: 0,
    borderTopLeftRadius: SHEET.radiusTop,
    borderTopRightRadius: SHEET.radiusTop,
    borderBottomLeftRadius: SHEET.radiusBottom,
    borderBottomRightRadius: SHEET.radiusBottom,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: SHEET.paddingX,
    paddingTop: SHEET.paddingTop,
  },
  /** 钉住区：paddingTop + paddingX 归本区，滚动内容改吃 pinnedScrollContent，两态像素一致 */
  pinnedZone: {
    paddingHorizontal: SHEET.paddingX,
    paddingTop: SHEET.paddingTop,
  },
  /** 钉住模式下滚动内容的衬距：paddingTop 已归钉住区，横向照旧 */
  pinnedScrollContent: {
    paddingHorizontal: SHEET.paddingX,
  },
  handle: {
    alignSelf: 'center',
    width: SHEET.handleWidth,
    height: SHEET.handleHeight,
    borderRadius: SHEET.handleRadius,
    marginTop: SHEET.handleMarginTop,
    marginBottom: SHEET.handleMarginBottom,
  },
  title: {
    fontSize: FONT_SIZE.sheetTitle,
    fontWeight: FONT_WEIGHT.black,
  },
  sub: {
    marginTop: SHEET.subMarginTop,
    marginBottom: 0,
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SHEET.subLineHeight,
  },
})
