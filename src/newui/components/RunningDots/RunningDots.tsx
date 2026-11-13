import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { GRADIENTS, RUNNING_DOTS } from '@/newui/theme'

export interface RunningDotsProps {
  /** 外层定位/对齐样式（自身尺寸由三点+间距撑出） */
  style?: StyleProp<ViewStyle>
}

/** 单颗点的相位窗口 = 周期的 1/3：三窗 [0,1/3) [1/3,2/3) [2/3,1] 恰好铺满一轮，循环处无缝 */
const WINDOW = 1 / 3

/**
 * 分页「正在获取」动画标识（2026-10-15 同事清单：静态转圈存在感弱，要动画方式）。
 * 三颗品牌渐变色的点按接力顺序依次「起跳-落地」——奔跑感的简笔等价物，
 * 接在 PagingStatus 文案前，请求在途的整个窗口里循环跳动。
 * 实现：一条共享 Animated.Value 0→1 线性循环（useNativeDriver，不占 JS 线程、
 * 不与列表滚动抢帧），每颗点在自己的 1/3 窗口里做 translateY / opacity 插值，
 * 窗口外钳位在静息值。纯核心 Animated，零新依赖。
 */
const Dot = memo(({ progress, index }: { progress: Animated.Value; index: number }) => {
  const start = index * WINDOW
  const mid = start + WINDOW / 2
  const end = Math.min(start + WINDOW, 1)
  // index 0 的窗口从 0 起跳：起点即首段，去掉重合的 [0,0] 段保持 inputRange 严格递增
  const inputRange = index === 0 ? [0, mid, end] : [0, start, mid, end]
  const translateY = inputRange.map((_, i) => {
    if (index === 0) return [0, -RUNNING_DOTS.hopHeight, 0][i]
    return [0, 0, -RUNNING_DOTS.hopHeight, 0][i]
  })
  const opacity = inputRange.map((_, i) => {
    const pattern = index === 0
      ? [RUNNING_DOTS.idleAlpha, 1, RUNNING_DOTS.idleAlpha]
      : [RUNNING_DOTS.idleAlpha, RUNNING_DOTS.idleAlpha, 1, RUNNING_DOTS.idleAlpha]
    return pattern[i]
  })
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: GRADIENTS.brand.colors[index % GRADIENTS.brand.colors.length],
          transform: [{ translateY: progress.interpolate({ inputRange, outputRange: translateY }) }],
          opacity: progress.interpolate({ inputRange, outputRange: opacity }),
        },
      ]}
    />
  )
})

Dot.displayName = 'NewUIRunningDotsDot'

export const RunningDots = memo(({ style }: RunningDotsProps) => {
  const progress = useRef(new Animated.Value(0)).current
  useEffect(() => {
    progress.setValue(0)
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: RUNNING_DOTS.cycleMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [progress])
  return (
    <View style={[styles.root, style]} accessibilityLabel="正在获取">
      {[0, 1, 2].map(index => (
        <Dot key={index} progress={progress} index={index} />
      ))}
    </View>
  )
})

RunningDots.displayName = 'NewUIRunningDots'

const styles = StyleSheet.create({
  /** 高度给足「起跳峰值 + 点径」，位移不会裁进相邻行；宽度 = 3×dot + 2×gap 由 gap 撑出 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RUNNING_DOTS.dotGap,
    height: RUNNING_DOTS.dotSize + RUNNING_DOTS.hopHeight,
  },
  dot: {
    width: RUNNING_DOTS.dotSize,
    height: RUNNING_DOTS.dotSize,
    borderRadius: RUNNING_DOTS.dotSize / 2,
  },
})
