import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

// 复用旧 UI 的拖拽计算：grant 时按 locationX 定一次位，之后只用 gestureState.dx 做相对位移
// （Android move 事件里的 locationX 不可靠）。
import { useDrag } from '@/utils/hooks/useDrag'

import { useSmoothProgress } from '@/newui/hooks/useSmoothProgress'
import { GRADIENTS, PLAYER, SHADOW, useTheme } from '@/newui/theme'

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))
/** 旋钮是全圆：边长的一半 */
const THUMB_RADIUS = PLAYER.seekThumb / 2
/** 触区总高 = 条高 + 上下外扩；横向不外扩，保证拖拽宽度与视觉条等宽、落位准确 */
const HIT_HEIGHT = PLAYER.seekHitPadY * 2 + PLAYER.seekHeight

export interface SeekControlProps {
  /** 播放进度 0..1 */
  ratio: number
  /** 松手时提交一次跳转（0..1） */
  onCommit: (ratio: number) => void
  style?: StyleProp<ViewStyle>
}

interface PressLayerProps {
  onDragState: (dragging: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
  onWidthChange: (width: number) => void
}

/**
 * 拖拽/点按层：绝对铺满整条进度条 + 上下触区，手势在 capture 阶段抢下 responder，
 * 保证 grant/move/release 一定回到这一层，不被父层横滑手势截走（漏提交）。
 */
const PressLayer = memo(({ onDragState, setDragProgress, onSetProgress, onWidthChange }: PressLayerProps) => {
  const { onLayout, onDragStart, onDragEnd, onDrag } = useDrag(onSetProgress, onDragState, setDragProgress)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    onLayout(e)
    onWidthChange(e.nativeEvent.layout.width)
  }, [onLayout, onWidthChange])

  // useState 惰性初始化：只创建一次，避免每次渲染重建 PanResponder
  const [panResponder] = useState(() =>
    PanResponder.create({
      // Capture 通道优先接管手势
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // 不让其它视图抢走 responder
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderMove: (_evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
    }),
  )

  return <View onLayout={handleLayout} style={styles.press} {...panResponder.panHandlers} />
})
PressLayer.displayName = 'NewUISeekPressLayer'

/**
 * 播放进度条：渐变填充 + 白色旋钮（主色光晕），视觉条 5px，靠触区层撑出 33px 点击高度。
 * 拖拽期间只显示本地 dragProgress（外部轮询值不参与），因此无回跳；点按与拖拽同一条路径，
 * 松手即提交并立即落位；正常播放推进由 useSmoothProgress 做 300ms 线性补间。
 */
export const SeekControl = memo(({ ratio, onCommit, style }: SeekControlProps) => {
  const theme = useTheme()
  const [dragging, setDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  // 只有布局尺寸真的变了才重渲染（渐变需要确定像素宽度，不能按百分比铺）
  const [trackWidth, setTrackWidth] = useState(0)

  // onCommit 每换歌就是新引用，手势层只建一次：用 ref 取最新值，避免松手调到上一首的 duration
  const commitRef = useRef(onCommit)
  useEffect(() => {
    commitRef.current = onCommit
  }, [onCommit])

  // 显示值：拖拽中由本组件接管（enabled:false），其余时候 300ms 线性补间把每秒一步抹平
  const { value: shown, setImmediate } = useSmoothProgress(ratio, { enabled: !dragging })

  /** 松手那一刻提交的 0..1：落位用它，不等外部 ratio 晚一拍才回来 */
  const committedRef = useRef(0)

  const handleCommit = useCallback((progress: number) => {
    committedRef.current = progress
    commitRef.current(progress)
  }, [])

  const handleDragState = useCallback((next: boolean) => {
    // 松手即真值；按下那一下由下面那条 effect 把显示值接到手指位置
    if (!next) setImmediate(committedRef.current)
    setDragging(next)
  }, [setImmediate])

  // 拖拽中显示手指位置：外部 1Hz 值不参与显示，因此无回跳
  useEffect(() => {
    if (!dragging) return
    shown.stopAnimation()
    shown.setValue(clamp01(dragProgress))
  }, [dragProgress, dragging, shown])

  // 填充宽度与旋钮位置共用这一条插值：同一时刻取同一个数，不会各跑各的
  const shownPct = useMemo(
    () => shown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    [shown],
  )

  return (
    <View style={[styles.hit, style]}>
      <View style={[styles.track, { backgroundColor: theme.colors.fill4 }]}>
        {/* 外层按百分比裁切宽度，内层渐变固定为整条像素宽，配色不随进度伸缩 */}
        {trackWidth > 0 && (
          <Animated.View style={[styles.fill, { width: shownPct }]}>
            <LinearGradient
              colors={[...GRADIENTS.brand.colors]}
              start={GRADIENTS.brand.start}
              end={GRADIENTS.brand.end}
              style={{ width: trackWidth, height: '100%' }}
            />
          </Animated.View>
        )}
        {/* 旋钮圆心对齐进度点：left 走百分比，再静态左移半个旋钮 */}
        <Animated.View
          style={[
            styles.thumb,
            SHADOW.glow,
            // 旋钮恒为白（与开关旋钮同色键）
            { backgroundColor: theme.colors.switchKnob, left: shownPct },
          ]}
        />
      </View>
      <PressLayer
        onDragState={handleDragState}
        setDragProgress={setDragProgress}
        onSetProgress={handleCommit}
        onWidthChange={setTrackWidth}
      />
    </View>
  )
})

SeekControl.displayName = 'NewUISeekControl'

const styles = StyleSheet.create({
  /** 触区容器：撑出 33px 的可点高度 */
  hit: {
    height: HIT_HEIGHT,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PLAYER.seekHitPadY,
    height: PLAYER.seekHeight,
    borderRadius: PLAYER.seekRadius,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: PLAYER.seekRadius,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    width: PLAYER.seekThumb,
    height: PLAYER.seekThumb,
    borderRadius: THUMB_RADIUS,
    top: (PLAYER.seekHeight - PLAYER.seekThumb) / 2,
    marginLeft: -THUMB_RADIUS,
  },
  /** 等宽于视觉条、纵向铺满触区、层级最高 */
  press: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: HIT_HEIGHT,
    zIndex: 6,
  },
})
