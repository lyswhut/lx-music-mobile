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

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** 缓动曲线（与 Toast / Sheet 同一条） */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export interface LrcFloatProps {
  /** 是否示出；隐藏时不渲染内容，但保持挂载以跨显隐保留拖位 */
  visible: boolean
  /** 气泡文字：当前高亮歌词行；无歌词时容器已回落曲名 */
  text: string
  /** 来源圆点与光晕色：当前曲平台 tint（无平台时回落品牌色） */
  tint: string
  /** 点按（全过程位移 < 4px）→ 打开全屏播放页 */
  onOpenPlayer: () => void
  /** 关闭气泡 = 翻转浮窗开关（含 toast 与浮窗钮图标同步） */
  onClose: () => void
}

/**
 * 可拖动的歌词气泡：玻璃贴片底 + 平台色原点 + 单行歌词 + 关闭圆钮。
 * 按下即进入拖动态，拖动按屏幕边界夹取，松手复位；位移 < 4px 视为点按打开播放页。
 * 拖动手势走 PanResponder（不引 gesture-handler / reanimated），移动只用 gestureState.dx/dy
 * 做相对位移——Android move 事件坐标不可靠。
 * 纯展示组件：显隐 / 文字 / 颜色 / 动作由容器传入，本件只维护位置与拖动态。
 * 当前未挂载：浮窗入口已改为系统级悬浮窗。
 */
export const LrcFloat = memo(({ visible, text, tint, onOpenPlayer, onClose }: LrcFloatProps) => {
  const theme = useTheme()
  // scale 与 opacity 共用这条补间（opacity 常驻 .6 → 按下 1）
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
  /** 手势全过程 |dx|+|dy| 的峰值：< tapSlop 即点按 */
  const movedRef = useRef(0)
  /** 拖动态缩放，松手回 1 */
  const scale = useRef(new Animated.Value(1)).current

  // 手势对象只建一次，运行期走 ref 取最新回调
  const onOpenPlayerRef = useRef(onOpenPlayer)
  onOpenPlayerRef.current = onOpenPlayer

  /** 松手 / 手势被打断的同一条收尾 */
  const releaseDrag = useCallback(() => {
    // 撤拖动态：scale 回 1
    Animated.timing(scale, {
      toValue: 1,
      duration: LRC_FLOAT.scaleDuration,
      easing: EASE,
      useNativeDriver: true,
    }).start()
    // 位移小于 4px 视为点按 → 打开全屏播放页
    if (movedRef.current < LRC_FLOAT.tapSlop) onOpenPlayerRef.current()
  }, [scale])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 按下即进入拖动态。关闭钮是子层 Pressable，RN responder 竞标里最深层先响应，
        // 点它不会走到这里
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = { ...posRef.current }
          movedRef.current = 0
          // 缩放即时到位（先停上一次可能还在跑的回落动画）
          scale.stopAnimation()
          scale.setValue(LRC_FLOAT.dragScale)
        },
        onPanResponderMove: (_event, gesture) => {
          movedRef.current = Math.max(
            movedRef.current,
            Math.abs(gesture.dx) + Math.abs(gesture.dy),
          )
          // 拖动范围按屏幕边界夹取，右/下边界减气泡实测尺寸
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
        // 手势被系统 / 父层抢走：只撤拖动态，不打开播放页
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

  // 隐藏即不渲染；本件仍挂载，拖位跨显隐保留
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
      {/* 玻璃底：模糊 + 贴片，规格见 theme.GLASS.lrcFloat */}
      <BlurredContainer spec={GLASS.lrcFloat} />
      {/* 平台色圆点 + 同色光晕 */}
      <View style={[styles.src, { backgroundColor: tint, shadowColor: tint }]} />
      {/* 单行省略歌词 */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.line, { color: theme.colors.glassPatchInk }]}
      >
        {text}
      </Text>
      {/* 关闭圆钮：子层 Pressable 先中竞标，点它不触发拖动 */}
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
  /** 绝对定位、悬在内容层之上的气泡；层叠数见 Z_LAYER.lrcFloat */
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
  /** 平台色圆点；光晕 offset 0，颜色由 tint 动态注入 */
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
  /** 单行歌词 */
  line: {
    fontSize: LRC_FLOAT.lineSize,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LRC_FLOAT.lineHeight,
    maxWidth: LRC_FLOAT.lineMaxWidth,
  },
  /** 关闭圆钮；常驻透明度由渲染期的补间给出，这里不写死 */
  close: {
    width: LRC_FLOAT.closeSize,
    height: LRC_FLOAT.closeSize,
    borderRadius: LRC_FLOAT.closeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
})
