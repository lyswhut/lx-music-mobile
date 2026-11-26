import { memo, useCallback, useMemo, useRef, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { MOTION, PLAYER } from '@/newui/theme'

/** 横滑方向：right 右滑进歌词，left 左滑回唱片 */
export type StageSwipeDirection = 'right' | 'left'

/** 舞台形态，与容器的 `lyricOn` 一一对应 */
export type StagePhase = 'disc' | 'lyric'

/**
 * 判定一次舞台横滑并给出方向，否则 null：
 * 水平位移 ≥ stageSwipeMinDx，且 ≥ 垂直位移 × stageSwipeSlope（纵向占优让给歌词滚动）。
 */
export const resolveStageSwipe = (dx: number, dy: number): StageSwipeDirection | null => {
  const absX = Math.abs(dx)
  if (absX < PLAYER.stageSwipeMinDx) return null
  if (absX < Math.abs(dy) * PLAYER.stageSwipeSlope) return null
  return dx > 0 ? 'right' : 'left'
}

export const stagePhaseForDirection = (direction: StageSwipeDirection): StagePhase =>
  direction === 'right' ? 'lyric' : 'disc'

export interface PlayerStageSwipeProps {
  /** 当前舞台形态 */
  phase: StagePhase
  /** 切页动画走到终点、旧层完全滑出后回调一次，容器在这里翻 lyricOn */
  onSwipe: (direction: StageSwipeDirection) => void
  /** 关掉手势（浮层打开时置 false，避免与浮层拖拽抢手势） */
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

/**
 * 播放页舞台横滑容器：复用 PanResponder，按下不抢响应器，判定明显横向位移才接管；
 * 松手后决定「滑出 → 换层 → 滑入」或回弹。
 */
export const PlayerStageSwipe = memo(({
  phase,
  onSwipe,
  enabled = true,
  style,
  children,
}: PlayerStageSwipeProps) => {
  /** 跟手平移量（px，右为正）；release 后由动画接管，不再受手指影响 */
  const shift = useRef(new Animated.Value(0)).current
  const widthRef = useRef(0)
  // 手势对象只建一次，运行期一律走 ref 取值，避免每次重渲染打断进行中的手势
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  const panResponder = useMemo(() => {
    /** 回弹：位移不足 / 方向与当前形态一致 / 手势被打断，都平滑归位 */
    const retreat = () => {
      shift.stopAnimation()
      Animated.timing(shift, {
        toValue: 0,
        duration: MOTION.fast,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    }
    /** 两段切页：本层滑出到该侧边缘 → 容器换层 → 新层从对侧滑回中线 */
    const switchStage = (direction: StageSwipeDirection) => {
      const width = widthRef.current > 0 ? widthRef.current : 1
      shift.stopAnimation()
      Animated.timing(shift, {
        toValue: direction === 'right' ? width : -width,
        duration: MOTION.fast,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        // 换层的瞬间先把新层摆到对侧边缘，再放动画滑回来
        shift.stopAnimation()
        shift.setValue(direction === 'right' ? -width : width)
        onSwipeRef.current(direction)
        Animated.timing(shift, {
          toValue: 0,
          duration: MOTION.fast,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start()
      })
    }

    return PanResponder.create({
      // 按下不接管：点按、以及交给子层（歌词 ScrollView）的手势都不受影响
      onStartShouldSetPanResponder: () => false,
      // 只在「明显横向位移」时接管；纵向位移一律放行
      onMoveShouldSetPanResponder: (_event, gesture) =>
        enabledRef.current && resolveStageSwipe(gesture.dx, gesture.dy) !== null,
      // 上一次切换的动画可能还在跑：接手指前先把它停下，避免两路动画抢同一值
      onPanResponderGrant: () => {
        shift.stopAnimation()
      },
      onPanResponderMove: (_event, gesture) => {
        shift.setValue(gesture.dx)
      },
      onPanResponderRelease: (_event, gesture) => {
        const direction = resolveStageSwipe(gesture.dx, gesture.dy)
        if (direction === null || !enabledRef.current) {
          retreat()
          return
        }
        // 已经在目标形态（例如歌词页继续右滑）：不空转切页动画，直接回弹
        if (stagePhaseForDirection(direction) === phaseRef.current) {
          retreat()
          return
        }
        switchStage(direction)
      },
      // 手势被系统/子层抢走：回位，不切层
      onPanResponderTerminate: () => retreat(),
      onPanResponderTerminationRequest: () => true,
    })
  }, [shift])

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    widthRef.current = nativeEvent.layout.width
  }, [])

  return (
    <View
      style={[styles.root, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.content, { transform: [{ translateX: shift }] }]}>
        {children}
      </Animated.View>
    </View>
  )
})

PlayerStageSwipe.displayName = 'NewUIPlayerStageSwipe'

const styles = StyleSheet.create({
  /** 铺满舞台可用区（需要全宽全高） */
  root: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
