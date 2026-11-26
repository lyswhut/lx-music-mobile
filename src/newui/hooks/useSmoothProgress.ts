/**
 * 进度条的「每秒一步 → 300ms 线性补间」：目标值与显示值分离，共用一条 Animated.Value，
 * 填充与旋钮天然同步；目标值每拍只变一次，重定向同一条 timing，不重建动画。
 *
 * 不做补间的场合：目标值没变或变小（回跳不能演成动画）、单拍跨度超过 PROGRESS_SNAP_DELTA
 * （那是跳转）。走 JS driver：动的是 width / left 这类布局属性。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

import { MOTION } from '@/newui/theme'

/** 与 MOTION.slow 同值；缓动是 linear */
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
    // 拖拽中：外部值只记账，松手由调用点 setImmediate 落位
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

  // 离场时收掉在跑的补间，避免对已拆的宿主白写值
  useEffect(() => () => { value.stopAnimation() }, [value])

  return { value, setImmediate }
}
