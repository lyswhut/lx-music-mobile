/**
 * 进度条的「每秒一步 → 300ms 线性补间」（U57 `.seek` / U05 `.mini-progress` 共用）。
 *
 * 原型两处都是 CSS transition：`.mini-progress i{transition:width .3s linear}`（styles.css L671）
 * 与 `.seek i{...transition:width .3s linear}` / `.seek em{transition:left .3s linear}`（L769-L770）。
 * RN 没有 transition，每秒把宽度直写一次就是硬跳，所以这里把「目标值」与「显示值」分开：
 * 一个 0..1 的 `Animated.Value` 供填充与旋钮共用 —— 两者因此天然同步，也不会各自补间出偏差；
 * 目标值每拍只变一次，重定向同一条 timing，**不重建动画对象**。
 *
 * **什么时候不做补间**（原型 `.seek.drag i,.seek.drag em{transition:none}` L772 是同一口径）：
 * - 目标值没变或变小（换曲回零、拖回退、播放器位置被纠正）——回跳不能演成一段动画；
 * - 单拍跨度超过 `PROGRESS_SNAP_DELTA`（换曲、点进度、拖完提交）——那是跳转，不是推进。
 * 拖拽期间显示值由调用方接管（`enabled: false`），外部 1Hz 值只记账、不落屏。
 *
 * 走 JS driver：动的是 width / left 这类布局属性，native driver 不支持；1Hz 的 300ms 补间
 * 每拍最多十几帧，代价远小于让整条进度每秒回跳一次。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

import { MOTION } from '@/newui/theme'

/** 原型两处都是 .3s，与 MOTION.slow 同值；缓动是 linear（不是 --ease），照原样 */
export const PROGRESS_SMOOTH_MS = MOTION.slow
/** 一拍之内算「正常推进」的跨度上限；超过它就是跳转，立即落位不补间 */
export const PROGRESS_SNAP_DELTA = 0.02

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export interface SmoothProgress {
  /** 0..1 的显示值：直接插值成百分比 / 像素喂给填充与旋钮 */
  value: Animated.Value
  /** 立即落位（停掉在跑的补间）：拖拽接管、松手提交、换曲这类「该立刻到」的场合 */
  setImmediate: (next: number) => void
}

export interface SmoothProgressOptions {
  /** false = 显示值由调用方接管（拖拽中），此时外部 ratio 变化只记账不落屏。默认 true */
  enabled?: boolean
}

export const useSmoothProgress = (
  ratio: number,
  options: SmoothProgressOptions = {},
): SmoothProgress => {
  const enabled = options.enabled ?? true
  const [value] = useState(() => new Animated.Value(clamp01(ratio)))
  /** 上一拍的目标值（不是屏幕上的显示值）：只用来判定这一拍该补间还是该落位 */
  const targetRef = useRef(clamp01(ratio))
  const enabledRef = useRef(enabled)
  // 与下面的 ratio effect 同一渲染批次里先跑，保证判据读到的开关是这一帧的
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  useEffect(() => {
    const next = clamp01(ratio)
    const prev = targetRef.current
    targetRef.current = next
    // 拖拽中：屏幕上是手指位置，外部值只记账（松手那一拍由调用点的 setImmediate 落位）
    if (!enabledRef.current) return
    if (next <= prev || next - prev > PROGRESS_SNAP_DELTA) {
      value.stopAnimation()
      value.setValue(next)
      return
    }
    Animated.timing(value, {
      toValue: next,
      duration: PROGRESS_SMOOTH_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()
  }, [ratio, value])

  const setImmediate = useCallback((next: number) => {
    const clamped = clamp01(next)
    targetRef.current = clamped
    value.stopAnimation()
    value.setValue(clamped)
  }, [value])

  // 离场时收掉在跑的补间：timing 每帧仍往视图写值，宿主已经拆了就是白写
  useEffect(() => () => { value.stopAnimation() }, [value])

  return { value, setImmediate }
}
