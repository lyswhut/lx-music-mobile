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

/** 原型 --ease: cubic-bezier(.22,.61,.36,1) */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

/**
 * 浮层「虚拟化主体」的行配置（2026-10-16 评论浮层 OOM 修复轮新增，可选）。
 * 传入后骨架自带的唯一滚动容器由 ScrollView 换成 FlatList（VirtualizedList），
 * handle/标题/副题进入 ListHeaderComponent 头部 cell（位置与视觉和滚动行为零变化——
 * 它们在旧 ScrollView 里本来也是随内容滚走的普通子节点），
 * 挂载视图数从「全量行」退化为「屏内行 + windowSize 余量」。
 * 刻意仍是一层滚动容器：不往 children 里嵌第二层，嵌套手势争抢的老口径不变。
 */
export interface SheetListProps<T> {
  data: readonly T[]
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  /** 头部 cell 内、标题/副题之下的附加定长内容（如评论浮层三态提示）；随滚动进出、不回收 */
  headerComponent?: ReactElement | null
  /**
   * 钉住区（可选；评论浮层钉住回归修复轮）：传了它，handle/标题/副题与本组件一起钉在滚动区上方，
   * 只有下方列表滚——原型 #playerSheet 的 flex:none 组（handle/标题/副题/#psMeta 钉住、#psBody 独滚，
   * styles.css L839-841；#psMeta 语义 = 评论浮层 .cmt-total「总数 + 热度排序」行，164dfa4 口径）。
   * 不传（默认）= 与旧行为逐字一致：head 与 headerComponent 同进列表头部 cell、随内容滚。
   */
  pinnedComponent?: ReactElement | null
  /** 列表尾 cell（如分页状态行）；随滚动进出 */
  footerComponent?: ReactElement | null
  // —— 虚拟化精细化参数（覆盖 token 默认值；不传则吃 SHEET.list* 默认） ——
  /** 固定高度列表（如 QueueSheet）可提供精确 offset 计算，根除"最后一行只剩半截" */
  getItemLayout?: (data: ArrayLike<T> | null | undefined, index: number) => {
    length: number
    offset: number
    index: number
  }
  /** 首批初始渲染数量（如 CommentSheet 每页 15 条，首批全渲染） */
  initialNumToRender?: number
  /** 动态高度列表滚到某位置时 VirtualizedList 可能算不准 offset，让它自己回调重试 */
  onScrollToIndexFailed?: (info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => void
}

export interface SheetProps<T = unknown> {
  /** 显隐（false 时播完退场动画后自动卸载） */
  visible: boolean
  /** .sheet-title（20px / 900）；不传则不渲染（原型 #moreSheet 就没有标题行，只有 handle + 内容） */
  title?: string
  /** .sheet-sub（12.5px / text-3 / 行高 1.6）；不传则不渲染 */
  subtitle?: string
  /** 关闭（点遮罩 / Android 返回键都走它） */
  onClose: () => void
  /** .sheet-body 滚动内容（挂在标题/副题之下，原型 #psBody）；list 模式下忽略（主体由列表承载） */
  children?: ReactNode
  /** 底部安全区（叠加在 30px 内边距之下） */
  bottomInset?: number
  /**
   * 滚动接近底部时回调 —— 浮层内含分页列表时用（评论浮层加载更多），不传则不挂触底链路、与旧行为完全一致。
   * 两条路径的触发语义：
   * - ScrollView 默认主体：骨架自带这**唯一**一个 ScrollView 的 onScroll 距底判定（RN 0.73 ScrollViewProps
   *   无 onEndReached，那是 VirtualizedList 专属），阈值 SHEET.endReachThreshold px，滚动事件会连发；
   * - list 虚拟化主体：FlatList 原生 onEndReached，阈值按 endReachThreshold px 折算成视口倍数近似对齐，
   *   原生仍可能连发/短内容自动触发。
   * 两种语义下「重复触发挡重入」都由调用方负责（CommentSheet 的 isLoading/isEnd 闸），行为等价。
   */
  onEndReached?: () => void
  /**
   * 虚拟化主体（可选）：传了就把骨架自带的 ScrollView 换成 FlatList（评论这类「分页累加、
   * 无上限」的大列表专用；配 pinnedComponent 可另开钉住区，见该字段注释）。
   * 不传 = 与改造前逐像素一致的普通浮层，其余浮层零影响。
   */
  list?: SheetListProps<T>
}

/**
 * 通用底部浮层（对应原型 .sheet，styles.css L716-733）：
 * 遮罩淡入 .3s + 体贴退场（原型 translateY 100%→0 / .4s，styles.css L725 与 L730；RN 落地为窗口高像素位移，见 translateY 注释），
 * 圆角顶部 28 / 底部直角（原型 L722 底部 40px 是嵌合假机框 .screen L77 的 44px 圆角，真机贴屏底应为直角，第 14 轮口径），
 * surface2→surface 竖向渐变 + 顶边高光，max-height 78% 内滚动；点遮罩或 Android 返回键关闭。
 * 实现形态：所在屏幕根 View 内的 absolute-fill 覆盖层（原型 .sheet 就是所在层的 inset:0 子层，
 * 浮层不跨屏幕复用，因此不用 RNN Modal/新路由，改动最小、退场动画也最顺）。
 * 遮罩毛玻璃（原型 .sheet-mask L710 background rgba(0,0,0,.55) + backdrop-filter blur(3px)）：
 * 直挂共通依赖 @react-native-community/blur 的 BlurView（探测位与玻璃层共用 blurNativeRegistered），
 * 分层顺序照 CSS 语义 = 模糊像在下、.55 黑染色在上；原生模块未注册时退回纯半透明黑（与旧形态逐像素一致）。
 * 刻意不走 BlurredContainer 本体：它的降级语义是「不透明表面底」，遮罩要的降级是「透底的半透明黑」，
 * 两者不同族，强行套 spec 反而逼出 fallback 分支的特例，故此处只用 BlurView 原生件 + 共用探测位。
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
  // 退场动画播完前保持挂载（对齐原型 visibility 延迟 .42s）
  const [mounted, setMounted] = useState(visible)
  const progress = useMemo(() => new Animated.Value(visible ? 1 : 0), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible) setMounted(true)
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? SHEET.bodyDuration : SHEET.exitDuration,
      easing: EASE,
      useNativeDriver: false, // 与遮罩 opacity、体贴 maxHeight 共用一条 JS 驱动 progress，不混用 native driver
    })
    animation.start(({ finished }) => {
      if (!visible && finished) setMounted(false)
    })
    return () => animation.stop()
  }, [visible, progress])

  // Android 物理返回键：浮层开着时先收浮层（原型 data-close 的等价路径）
  useEffect(() => {
    if (!visible) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => subscription.remove()
  }, [visible, onClose])

  /**
   * list 模式给 FlatList 的触底链路：引用永不变（VirtualizedList 对回调引用变化会告警且重建内部监听），
   * 经 ref 透传当前 props.onEndReached。ScrollView 模式不用它（走内联 onScroll 距底判定，与旧行为一致）。
   *
   * **不使用 FlatList 原生 onEndReached**——动态高度列表（评论卡含回复线程）下，VirtualizedList
   * 靠 cellsAroundViewport 估算"视口末 cell = 数据末条"来决定是否触发，估算不准时（首批 15 条评论
   * 高度 > Sheet 窗口、但 VirtualizedList 按平均行高估窗口只覆盖到第 7 条）永远不触发。
   *
   * 改为自记滚动度量（offset / 视口高 / 内容高），在**四个时机**共用同一条 SHEET.endReachThreshold：
   * - onScroll                             滚动过程中；
   * - onScrollEndDrag / onMomentumScrollEnd 滚动停手（甩到底后虚拟化补齐渲染、不再有滚动事件的窗口）；
   * - onContentSizeChange                  内容从短变长的瞬间（首屏数据在 FlatList 挂载之后才到、
   *                                        短内容不足一屏时用户根本滚不动，也就永远等不到滚动事件）；
   * - onLayout                             视口测量到位。
   * 同一内容高只发一次（滚离底部即解除），与调用方的 isLoading/isEnd 闸门叠加，等价 VirtualizedList
   * 的 contentLength 去重。
   *
   * 2026-11-03 评论浮窗「首次打开拉到底不加载更多、关闭重开一次才好」的根因就是漏掉
   * onContentSizeChange 这一类时机：重开时数据已在场，布局一量到就补判补齐；首开时列表先以空数据挂载、
   * 数据到了才长高，若只认滚动事件，短内容永远等不到触发（与歌单详情 2026-10-15 同一套判例）。
   */
  const endReachedRef = useRef(onEndReached)
  endReachedRef.current = onEndReached
  /** 最近一次的滚动度量（供非滚动时机补判用） */
  const listScrollMetricsRef = useRef({ offset: 0, visible: 0, content: 0 })
  /** 上次触底触发时的内容高；同一高度只发一次，滚离底部或内容变化才允许重新触发 */
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

  // 原型 .sheet-body transform:translateY(100%)（styles.css L661 / L666）——「自身高度」的百分比；
  // RN 的 transform translateY 只接受 number（百分比字符串直接 invariant 崩溃，真机实测），
  // 且体贴高度随内容变化并被 max-height 78%（L662）截断，这里用窗口高像素值近似退场位移：
  // 体贴贴屏底，向下位移一整屏必然把它完全推出屏幕，视觉等价。
  // windowHeight 变化（转屏/折叠）时本行随重渲染重新 interpolate，位移自动跟新值，无需重建 progress。
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  })

  /** handle + 标题 + 副题（两条主体路径共用同一结构；旧版就是 ScrollView 的前几个子节点，位置零变化） */
  const sheetHead = (
    <>
      {/* .sheet-handle：36×4 胶囊（原型 L721 background:var(--fill-4)） */}
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
      {/* .sheet-mask（styles.css L710）：rgba(0,0,0,.55) + backdrop-filter blur(3px)，点击关闭。
          CSS 的 backdrop-filter 模糊的是「元素身后内容」，background 画在模糊像之上 —— RN 对应分层：
          容器自身必须透底（Android BlurView 采样的是其窗口身后的原生绘制，容器若自带 .55 黑底会被
          一并糊进模糊像、等效加深两层），故 BlurView 在前（下）、染色层在后（上）；
          原生模块未注册时只渲染染色层 = 与改造前「纯半透明黑」逐像素一致，天然降级。 */}
      <Animated.View style={[styles.mask, { opacity: progress }]}>
        {blurNativeRegistered && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurAmount={SHEET.maskBlur}
            blurType={theme.scheme}
            // Android：染色由下方 maskTint 层承担，关掉库自带 overlay；
            // 是否逐帧重采样与三块常驻玻璃位同一开关（theme.GLASS_PERF，理由见 tokens.ts）。
            // 本遮罩是**整屏面积**的模糊：autoUpdate 打开时层内每滚一行都要把整屏重截图 + 重模糊，
            // 而浮层开着时身后那层页面并不动（只有层内列表在滚，且层内列表被体贴挡住），
            // 冻结快照在这里没有可观感代价，纯省开销。
            // iOS：系统「降低透明度」时原生落到的纯色兜底
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

      {/* .sheet-body：surface2→surface 渐变 + 顶边 1px 高光；78% 窗口高内滚动 */}
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
              // 第 14 轮：底部改直角后删掉原 borderBottomColor 垫底 hack——当年是给 40px 底角
              // 与屏底 bg 的缝隙收口用的，直角后不存在缝隙，留着只误导分层
            },
          ]}
        >
          {list ? (
            /* 虚拟化主体（评论这类分页累加大列表）：骨架自带滚动容器就地换成 FlatList，
               不是往 children 里嵌第二层滚动容器（嵌套抢手势的老口径不变）。
               刻意不启用 removeClippedSubviews——回收单元里的 SVG 封面（Art 内圈层）
               在 Android 有整格变白的老毛病（PageListView 2026-10-16 同轮结论）；windowSize 回收已够用。
               评论浮层钉住回归修复轮：pinnedComponent 传入时，handle/标题/副题与它一起摆到
               FlatList 之外当钉住区（原型 #playerSheet 的 flex:none 组，styles.css L839-841），
               对齐 164dfa4「标题、说明和总数不被顶出视野、只有列表滚」；不传则这一整段原样。 */
            <>
              {list.pinnedComponent != null && (
                /* 钉住区。衬距拆账：.sheet-body 的 padding 8/20 只落一次（原型 #psBody 顶部无内衬），
                   故 paddingTop + paddingX 归本区、滚动内容只留 paddingX（pinnedScrollContent）——
                   未钉住时两者仍在列表头拼回原样，两态像素同一张版面。 */
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
                  // 底部补偿：让最后一个 item 的 bottom edge 不被 Sheet body 的 overflow:hidden 裁半截
                  // 两场景通用（Queue/Comment 都受益），保守取一行 SongRow + 一行评论高度的上界
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
                // 不用 FlatList 原生 onEndReached——动态高度下 cellsAroundViewport 估算不准，
                // 改自记滚动度量 + 四个时机补判（说明见 handleListScrollForEndReached 上方注释）
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
                      // RN 0.73 的 ScrollViewProps 没有 onEndReached（那是 VirtualizedList 系专属），
                      // 这里用 onScroll 距底判定等价复刻：距底 < SHEET.endReachThreshold 即触发一次；
                      // 事件会连发，靠调用方（CommentSheet）的 isLoading/isEnd 挡重入，与旧 FlatList 同构。
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
   * .sheet position:absolute inset:0 z-index:80
   * （RN：所在屏幕根 View 的最后一层 + 显式 `Z_LAYER.sheet`——详情层的列表本体也标了层叠数，
   * 浮层若只靠「排在最后」压住，会被带 zIndex 的内容盖在下面）
   */
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: Z_LAYER.sheet,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
  },
  /** .sheet-mask 的 background 档（styles.css L710 rgba(0,0,0,.55)）：染色独立成层压在模糊像之上，
   *  不画在 mask 容器上——容器必须透底，Android BlurView 才糊得到「身后页面」而不是自身底色 */
  maskTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(ART_INK.veil, SHEET.maskAlpha),
  },
  bodyWrap: {
    width: '100%',
  },
  /** .sheet-body（styles.css L712）border-radius:28px 28px 40px 40px 的 RN 口径：
   *  顶部 28 原样，底部 40 是嵌合假机框圆角的补偿（见 SHEET.radiusBottom 注释），真机贴屏底改 0；
   *  inset 0 1px 0（顶边高光）转 1px 实描边 */
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
  /** 钉住区（list 路径且传了 pinnedComponent 时渲染）：.sheet-body 的 padding 8/20 只落一次，
   *  钉住后 paddingTop + paddingX 归本区，滚动内容改吃 pinnedScrollContent，两态像素一致 */
  pinnedZone: {
    paddingHorizontal: SHEET.paddingX,
    paddingTop: SHEET.paddingTop,
  },
  /** 钉住模式下滚动内容的衬距：paddingTop 已归钉住区（原型 #psBody 顶部无内衬），横向照旧 */
  pinnedScrollContent: {
    paddingHorizontal: SHEET.paddingX,
  },
  /** .sheet-handle：margin 6 auto 14 */
  handle: {
    alignSelf: 'center',
    width: SHEET.handleWidth,
    height: SHEET.handleHeight,
    borderRadius: SHEET.handleRadius,
    marginTop: SHEET.handleMarginTop,
    marginBottom: SHEET.handleMarginBottom,
  },
  /** .sheet-title：20 / 900 */
  title: {
    fontSize: FONT_SIZE.sheetTitle,
    fontWeight: FONT_WEIGHT.black,
  },
  /** .sheet-sub：12.5 / text-3 / margin-top 5 / line-height 1.6 */
  sub: {
    marginTop: SHEET.subMarginTop,
    marginBottom: 0,
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SHEET.subLineHeight,
  },
})
