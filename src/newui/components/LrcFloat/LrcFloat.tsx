import { memo, useCallback, useMemo, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native'

import { NEW_UI_PLAYER_LRC_FLOAT_CLOSE_ARIA } from '@/newui/const'
import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  FONT_WEIGHT,
  GLASS,
  LRC_FLOAT,
  MOTION,
  SHADOW,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'

import { BlurredContainer } from '../Glass'
import { Icon } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** 原型 --ease: cubic-bezier(.22,.61,.36,1)（与 Toast / Sheet 骨架同一条曲线） */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export interface LrcFloatProps {
  /** 是否示出（容器按 syncFloat 口径算「开关开 + 有在播曲目」；原型 `[hidden]` 的等价物）。
   *  隐藏时不渲染内容，但本件保持挂载——拖位与原型同一口径跨显隐保留 */
  visible: boolean
  /** 气泡文字：当前高亮歌词行；无歌词时容器已回落曲名（原型 syncFloat L1888-1890） */
  text: string
  /** 来源圆点与光晕色：当前曲平台 tint（无平台时容器回落品牌色，原型 var(--tint,var(--brand))） */
  tint: string
  /** 点按（全程序位移 < 4px）——打开全屏播放页（原型 app.js L1930 openLayer(player())） */
  onOpenPlayer: () => void
  /** 关闭气泡 = 翻转浮窗开关（含 toast 与浮窗钮图标同步，原型 #lfClose → toggleFloat，L2622） */
  onClose: () => void
}

/**
 * LRC 浮窗（原型 .lrc-float，styles.css L666-681；行为见 app.js syncFloat / paintFloatBtn /
 * toggleFloat / bindFloatDrag，件：new_design/parts/player/lrc-float.*）。
 * 可拖动的歌词气泡：玻璃贴片底 + 平台色原点 + 单行歌词 + 关闭圆钮，
 * 按下即入拖动态（scale 1.05），拖动按 [8, 屏宽-w-8] × [56, 屏高-h-96] 夹取，
 * 松手撤拖动态；位移小于 4px 视为点按 → 打开播放页。
 * 拖动手法沿用本仓既有 PanResponder 路线（同 PlayerStageSwipe / SeekControl，
 * 不引 gesture-handler / reanimated 原生依赖）：按下即接管（原型 touch-action:none 同义），
 * 移动只用 gestureState.dx/dy 做相对位移（Android move 事件坐标不可靠，同进度条教训）。
 * 纯展示组件：显隐 / 文字 / 颜色 / 动作全部由容器传入，本件只维护「位置 + 拖动态」这一组纯视觉状态。
 * ⚠ 阶段 3（feature.md【newui】「歌词浮窗要是系统浮窗，不是应用内浮窗」）换线记录：
 * 浮窗入口已改接 core/desktopLyric 的**系统级悬浮窗**（窗口宿主在原生侧，内容观感由设置项
 * desktopLyric.style.* 决定），原主屏容器 screens/Main/LrcFloatDock 随之下线，本件按原型 U61
 * 的视觉留存（未挂载），等原型口径回来再接宿主。
 */
export const LrcFloat = memo(({ visible, text, tint, onOpenPlayer, onClose }: LrcFloatProps) => {
  const theme = useTheme()
  // `.lf-close:active{transform:scale(.85);color:var(--glass-ink);opacity:1}`（styles.css L815）：
  // scale 与 opacity 共用这条补间（opacity 常驻 .6 → 按下 1）；原型这条没写 transition，
  // 与 `.pc` / `.pt-btn` 同族，按家族缺省 200ms 补间
  const closeFx = usePressFx({ scale: LRC_FLOAT.closePressScale })

  /** 气泡位置（窗口坐标）。Animated 值读不到同步真值，posRef 是同一份数据的普通镜像 */
  const pan = useRef(
    new Animated.ValueXY({ x: LRC_FLOAT.initialLeft, y: LRC_FLOAT.initialTop }),
  ).current
  const posRef = useRef<{ x: number, y: number }>({ x: LRC_FLOAT.initialLeft, y: LRC_FLOAT.initialTop })
  /** 本次手势起点（grant 时抓取的 left/top） */
  const startRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
  /** 气泡实测尺寸（onLayout），拖动右/下边界要减它 */
  const sizeRef = useRef<{ width: number, height: number }>({ width: 0, height: 0 })
  /** 手势全过程 |dx|+|dy| 的峰值：< tapSlop 即点按（app.js L1922） */
  const movedRef = useRef(0)
  /** 拖动态缩放（.drag transform:scale(1.05)，松手按 .28s var(--ease) 回 1） */
  const scale = useRef(new Animated.Value(1)).current

  // 手势对象只建一次，运行期一律走 ref 取最新回调（同 PlayerStageSwipe 口径）
  const onOpenPlayerRef = useRef(onOpenPlayer)
  onOpenPlayerRef.current = onOpenPlayer

  /** 松手 / 手势被打断的同一条收尾（原型 stop，app.js L1923-1930） */
  const releaseDrag = useCallback(() => {
    // 撤 .drag：scale 回 1，走基础 transition .28s var(--ease)
    Animated.timing(scale, {
      toValue: 1,
      duration: LRC_FLOAT.scaleDuration,
      easing: EASE,
      useNativeDriver: true,
    }).start()
    // 位移小于 4px 视为点按 → 打开全屏播放页（tap 判定用峰值，与原型 Math.max 累计同义）
    if (movedRef.current < LRC_FLOAT.tapSlop) onOpenPlayerRef.current()
  }, [scale])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 气泡本体按下即进入拖动态（原型 pointerdown 即 grab + .drag）；
        // 关闭钮是子层 Pressable，RN responder 竞标里最深层先响应，
        // 点它不走这里——即原型 `closest('.lf-close')` 守卫的等价物
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = { ...posRef.current }
          movedRef.current = 0
          // .drag 的 transition:none：缩放即时到 1.05（先停上一次可能还在跑的回落动画）
          scale.stopAnimation()
          scale.setValue(LRC_FLOAT.dragScale)
        },
        onPanResponderMove: (_event, gesture) => {
          movedRef.current = Math.max(
            movedRef.current,
            Math.abs(gesture.dx) + Math.abs(gesture.dy),
          )
          // 边界 clamp 照 app.js L1920-1922：left ∈ [8, 屏宽-w-8]，top ∈ [56, 屏高-h-96]
          const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
          const { width, height } = sizeRef.current
          const next = {
            x: clamp(
              startRef.current.x + gesture.dx,
              LRC_FLOAT.boundLeft,
              screenWidth - width - LRC_FLOAT.boundRight,
            ),
            y: clamp(
              startRef.current.y + gesture.dy,
              LRC_FLOAT.boundTop,
              screenHeight - height - LRC_FLOAT.boundBottom,
            ),
          }
          posRef.current = next
          pan.setValue(next)
        },
        onPanResponderRelease: () => releaseDrag(),
        // 手势被系统 / 父层抢走：只撤拖动态，不点开播放页（原型 pointercancel 同款收尾）
        onPanResponderTerminate: () => releaseDrag(),
        onPanResponderTerminationRequest: () => true,
      }),
    [pan, releaseDrag, scale],
  )

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    sizeRef.current = {
      width: nativeEvent.layout.width,
      height: nativeEvent.layout.height,
    }
  }, [])

  // 原型 .lrc-float[hidden]{display:none}（L674）：隐藏即不渲染；
  // 本件仍挂载，posRef / pan 里的拖位跨显隐保留（原型 inline left/top 同一口径）
  if (!visible) return null

  return (
    <Animated.View
      accessibilityRole="button"
      onLayout={handleLayout}
      style={[
        styles.root,
        SHADOW.lrcFloat,
        {
          borderColor: theme.colors.lineStrong,
          left: pan.x,
          top: pan.y,
          transform: [{ scale }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* 玻璃底：blur(20) + glassPatch 贴片（原型 background:var(--glass) + backdrop-filter
          blur(20px) saturate(180%)，规格 theme.GLASS.lrcFloat；降级路径同 .toast 口径） */}
      <BlurredContainer spec={GLASS.lrcFloat} />
      {/* .lf-src：7px 平台色圆点 + 同色 9px 光晕（shadowColor 动态传平台 tint） */}
      <View style={[styles.src, { backgroundColor: tint, shadowColor: tint }]} />
      {/* .lf-line：单行省略歌词（12.5 / 700 / lh 16.25 / max-width 160） */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.line, { color: theme.colors.glassPatchInk }]}
      >
        {text}
      </Text>
      {/* .lf-close：19px 圆钮（子层 Pressable 先中竞标，点它不触发拖动）；
          :active scale(.85) + opacity 1（原型 L681） */}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={NEW_UI_PLAYER_LRC_FLOAT_CLOSE_ARIA}
        onPress={onClose}
        onPressIn={closeFx.onPressIn}
        onPressOut={closeFx.onPressOut}
        style={[
          styles.close,
          {
            opacity: closeFx.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [LRC_FLOAT.closeOpacity, 1],
            }),
          },
          closeFx.animatedStyle,
        ]}
      >
        <Icon name="close" size={LRC_FLOAT.closeIcon} color={theme.colors.glassPatchInk} />
      </AnimatedPressable>
    </Animated.View>
  )
})

LrcFloat.displayName = 'NewUILrcFloat'

const styles = StyleSheet.create({
  /** .lrc-float：绝对定位、悬在内容层之上（层叠数 Z_LAYER.lrcFloat=75，见 theme/tokens）；
   *  flex 横排居中 gap 8 / max-width 236 / padding 9 10 9 12 / 圆角 22 / 1px --line-strong 描边 */
  root: {
    position: 'absolute',
    zIndex: Z_LAYER.lrcFloat,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LRC_FLOAT.gap,
    maxWidth: LRC_FLOAT.maxWidth,
    paddingTop: LRC_FLOAT.paddingTop,
    paddingRight: LRC_FLOAT.paddingRight,
    paddingBottom: LRC_FLOAT.paddingBottom,
    paddingLeft: LRC_FLOAT.paddingLeft,
    borderRadius: LRC_FLOAT.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  /** .lf-src 7px 圆点（flex:none）；光晕 offset 0，色由平台 tint 动态注入 */
  src: {
    width: LRC_FLOAT.srcDot,
    height: LRC_FLOAT.srcDot,
    borderRadius: LRC_FLOAT.srcDot / 2,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: LRC_FLOAT.srcGlow,
    elevation: LRC_FLOAT.srcGlowElevation,
  },
  /** .lf-line：12.5 / 700 / line-height 16.25 / max-width 160（单行省略） */
  line: {
    fontSize: LRC_FLOAT.lineSize,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LRC_FLOAT.lineHeight,
    maxWidth: LRC_FLOAT.lineMaxWidth,
  },
  /** .lf-close：19 全圆 / flex:none / opacity .6 */
  close: {
    width: LRC_FLOAT.closeSize,
    height: LRC_FLOAT.closeSize,
    borderRadius: LRC_FLOAT.closeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // 常驻透明度 .6 由渲染期那条补间给（0 档 = closeOpacity），这里不写死
  },
})
