import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

import { MOTION, SONG_ROW, useTheme } from '@/newui/theme'

/** 三根条的启动相位 0 / .2s / .4s */
const EQ_DELAY_RATIOS = [0, 0.2, 0.4] as const

interface EqBarProps {
  /** 首次启动前的延迟占周期比例（0 / 0.2 / 0.4） */
  delayRatio: number
  color: string
  /** 条高（磁吸圆点状态标同高） */
  height: number
}

/** 单根均衡条：延迟一次后进入常驻循环（3px ↔ 11px）
 *
 * 用原生驱动 scaleY + translateY，而非 JS 驱动 height：后者每帧回传原生、与滚动抢 JS 线程。
 * 条子固定满高，scaleY 在 [3/11, 1] 间缩放；RN 缩放以盒中心为轴，
 * 补一段 translateY 把缩掉的半截移回底部，起跳线与 CSS 底对齐一致。
 */
const EqBar = memo(({ delayRatio, color, height }: EqBarProps) => {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 延迟只在首次生效，之后循环无额外停顿
    const animation = Animated.sequence([
      Animated.delay(delayRatio * MOTION.eq),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: MOTION.eq / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true, // transform 全程原生驱动，JS 线程不参与逐帧
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: MOTION.eq / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ])
    animation.start()
    return () => animation.stop()
  }, [progress, delayRatio])

  const scaleY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SONG_ROW.eqMinHeight / SONG_ROW.eqHeight, 1],
  })
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [(height - SONG_ROW.eqMinHeight * height / SONG_ROW.eqHeight) / 2, 0],
  })

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, height, transform: [{ translateY }, { scaleY }] },
      ]}
    />
  )
})

EqBar.displayName = 'NewUIEqBar'

/**
 * 正在播放的均衡条：三根条错相位跳动。
 * 颜色与条高可选，缺省行内品牌色 + 11 高（磁吸圆点状态标另传墨色与同高）。
 */
export interface EqBarsProps {
  /** 条色，缺省品牌主色（行内口径） */
  color?: string
  /** 条高，缺省 SONG_ROW.eqHeight（11） */
  height?: number
}

export const EqBars = memo(({ color, height = SONG_ROW.eqHeight }: EqBarsProps) => {
  const theme = useTheme()
  const barColor = color ?? theme.colors.brand
  return (
    <View style={[styles.root, { height }]}>
      {EQ_DELAY_RATIOS.map(ratio => (
        <EqBar key={ratio} delayRatio={ratio} color={barColor} height={height} />
      ))}
    </View>
  )
})

EqBars.displayName = 'NewUIEqBars'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SONG_ROW.eqGap,
    height: SONG_ROW.eqHeight,
  },
  bar: {
    width: SONG_ROW.eqWidth,
    /** 固定满高，伸缩由 scaleY 表达（height 无法原生驱动） */
    height: SONG_ROW.eqHeight,
    borderRadius: SONG_ROW.eqWidth / 2,
  },
})
