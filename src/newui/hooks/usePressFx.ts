/**
 * 按压反馈的补间：按下/松手驱动一条 0..1 的 Animated.Value，替代 RN 没有的 transition。
 * `transform.scale` 可走 native driver；底色插值不行，需要底色变化的调用点整条走 JS driver。
 * 根是 Pressable 的件用 AnimatedPressable + animatedStyle，不要外再套 Animated.View（会动到 flex 布局）。
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing } from 'react-native'

import { MOTION } from '@/newui/theme'

/** 底色插值两端：from 是常态色（控件本来就有底色时别让它从「无」淡出来） */
export interface PressFxBackground {
  from: string
  to: string
}

export interface PressFxOptions {
  /** 按下时缩到多少，1 = 不缩（行类只有底色变化） */
  scale?: number
  /** 按下时底色渐变 */
  background?: PressFxBackground
  /** 补间时长；缺省 MOTION.fast（200ms） */
  duration?: number
}

export interface PressFx {
  /** 0 = 常态、1 = 按到底，可复用到其它插值 */
  progress: Animated.Value
  /** 直接摊进 `AnimatedPressable` / `Animated.View` 的 style 数组 */
  animatedStyle: {
    transform?: [{ scale: Animated.AnimatedInterpolation<number> }]
    backgroundColor?: Animated.AnimatedInterpolation<string | number>
  }
  onPressIn: () => void
  onPressOut: () => void
}

const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

export const usePressFx = (options: PressFxOptions = {}): PressFx => {
  const { scale = 1, background, duration = MOTION.fast } = options
  // 拆成两个字符串进依赖：调用点每次渲染都会现造对象，按引用做 memo 等于没 memo
  const bgFrom = background?.from
  const bgTo = background?.to
  // 底色插值不支持 native driver，有底色就整条走 JS
  const useNativeDriver = bgFrom == null || bgTo == null
  const progress = useRef(new Animated.Value(0)).current

  const animate = useCallback((toValue: number) => {
    Animated.timing(progress, {
      toValue,
      duration,
      easing: EASE,
      useNativeDriver,
    }).start()
  }, [duration, progress, useNativeDriver])

  const onPressIn = useCallback(() => { animate(1) }, [animate])
  const onPressOut = useCallback(() => { animate(0) }, [animate])

  // 离场时收掉在跑的补间，避免对已拆的宿主白写值
  useEffect(() => () => { progress.stopAnimation() }, [progress])

  const animatedStyle = useMemo<PressFx['animatedStyle']>(() => {
    const style: PressFx['animatedStyle'] = {}
    if (scale !== 1) {
      style.transform = [{
        scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }),
      }]
    }
    if (bgFrom != null && bgTo != null) {
      style.backgroundColor = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [bgFrom, bgTo],
      })
    }
    return style
  }, [bgFrom, bgTo, progress, scale])

  return { progress, animatedStyle, onPressIn, onPressOut }
}
