import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

import { MOTION, SONG_ROW, useTheme } from '@/newui/theme'

/** 三根条的启动相位 0 / .2s / .4s（.eq i:nth-child(n) 的 animation-delay） */
const EQ_DELAY_RATIOS = [0, 0.2, 0.4] as const

interface EqBarProps {
  /** 首次启动前的延迟占周期比例（0 / 0.2 / 0.4） */
  delayRatio: number
  color: string
  /** 条高（原型 .eq 11px；磁吸圆点正中那枚状态标同高，见 MinibarSnapped） */
  height: number
}

/** 单根均衡条：延迟一次后进入 1s 常驻循环（3px ↔ 11px，ease-in-out）
 *
 * 2026-10-15 性能轮：驱动方式从「JS 驱动 height」换成「原生驱动 scaleY + translateY」。
 * 原实现每根条一条 `useNativeDriver: false` 的无限循环，三根 = 常驻 3 条 60fps JS 帧回调，
 * 而且每帧都要把新 height 通过 setNativeProps 送回原生 —— 播放中首页/详情页始终有一条
 * 在跟滚动抢 JS 线程（onScroll 也是 16ms 一次进 JS），是「滑动页面卡顿」的确定来源之一。
 * 视觉等价改写：条子固定 11dp 高，用 scaleY 在 [3/11, 1] 间缩放；RN 的缩放以盒子中心为轴，
 * 而原型 `.eq{align-items:flex-end}` 是**底对齐**生长，故同步补一段 translateY=(11-3)/2→0
 * 把缩掉的半截位移回底部，起跳线与 CSS 一致。
 */
const EqBar = memo(({ delayRatio, color, height }: EqBarProps) => {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 与 CSS「animation-delay + infinite」等价：延迟只在首次生效，之后循环无额外停顿
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
 * 正在播放的均衡条（对应原型 .eq）：三根条错相位跳动。
 * 2026-10-22 起有两处消费：歌曲行内用品牌色（默认形态）；磁吸圆点正中那枚 22 状态标
 * 用「状态标墨色」（`.mini-dock-mark .eq i{background:currentColor}`），所以颜色与条高
 * 开成可选参数，缺省仍是行内那一档（SONG_ROW 的 11 高 + 品牌色）。
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
    /** 2026-10-15 性能轮：高度不再逐帧改（原生驱动不了 height），固定满高后由 scaleY 表达 3↔11 的伸缩 */
    height: SONG_ROW.eqHeight,
    borderRadius: SONG_ROW.eqWidth / 2,
  },
})
