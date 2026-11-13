/**
 * 按压反馈的缓动（原型三十来处 `:active` 全部带 `transition:.2s/.22s var(--ease)`）。
 *
 * RN 没有 transition，`Pressable` 的 `({ pressed })` 只能瞬时切换：按下那一刻样式直接落位、
 * 松手那一下直接跳回，原型里「按下去弹一下」的手感就没了。这里把按下/松手当成一条
 * 0..1 的 `Animated.Value` 来补间，档位与时长仍按原型逐条取：
 * - 缩放档（`.icon-btn` .9 / `.chip` .94 / `.subs-card` .96 / `.ghost-btn` .98 / `.opt-row` .99）；
 * - 底色档（`.pod-row` / `.ep-row` 的 `:active{background:var(--fill-1)}`、`.ghost-btn` 的 fill2→fill3）。
 *
 * **driver 的选择**：`transform.scale` 能走 native driver，`backgroundColor` 插值不能。
 * 同一条 Value 不许一半 native 一半 JS，所以「要底色变化」的调用点整条走 JS driver
 * （只有 200ms、几个插值帧）；只缩放的调用点默认走 native。
 * 列表行要的是「底色淡入」而不是缩放，那一档更省的做法是把 `progress` 喂给一层绝对定位的
 * 蒙层当 `opacity`（native driver 可用，见 `PodcastRow` / `EpisodeRow`），不必走颜色插值。
 *
 * 调用点怎么用（都是既有树的原地改造，不改布局）：
 * - 根就是 `Pressable` 的件：`Animated.createAnimatedComponent(Pressable)` + `animatedStyle` +
 *   `onPressIn/onPressOut`；`onPress`、`accessibilityRole`、`hitSlop`、`disabled` 一律照旧传。
 *   用 `AnimatedPressable` 而不是外面再套一层 `Animated.View`：多一层会动到 flex 布局与
 *   列表测量，而这层容器只是替 `Pressable` 解析样式值，元素树一个不多。
 * - 需要留住 `Pressable` 自己的 `({ pressed })`（例如实心档还要换渐变）时：拿 `progress` 去做
 *   自己的插值，与缩放共用同一条补间，两者不会各弹各的。
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing } from 'react-native'

import { MOTION } from '@/newui/theme'

/** 底色插值的两端：`from` 是常态色（控件本来就有底色时别让它从「无」淡出来） */
export interface PressFxBackground {
  from: string
  to: string
}

export interface PressFxOptions {
  /** 按下时缩到多少，1 = 不缩（行类原型只有底色变化） */
  scale?: number
  /** 按下时底色渐变（`.ghost-btn` 那一族） */
  background?: PressFxBackground
  /** 补间时长；缺省 `MOTION.fast`（200ms，原型 `.2s` 的绝大多数）。`.chip` 的 `.22s` 传 `MOTION.base` */
  duration?: number
}

export interface PressFx {
  /** 0 = 常态、1 = 按到底；给调用方复用到别的插值上（如蒙层 opacity、渐变亮度） */
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
  // 拆成两个字符串再进依赖：调用点每渲染都会现造那个对象，按对象引用做 memo 等于没 memo
  const bgFrom = background?.from
  const bgTo = background?.to
  // 有底色就要 JS driver（native 不支持 backgroundColor），没有则整条走 native
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

  // 离场时收掉在跑的补间：timing 每帧仍往视图写值，宿主已经拆了就是白写
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
