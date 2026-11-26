import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, GLASS, MOTION, TOAST, Z_LAYER, useTheme } from '@/newui/theme'
import { subscribeNewUiToast, type NewUiToastDuration } from '@/newui/utils/newUiToast'

import { BlurredContainer } from '../Glass'

export interface NewUiToastHostProps {
  /** 底部安全区（与 TOAST.bottomGap 相加成实际底边距） */
  bottomInset?: number
}

/** 与 Sheet 骨架共用同一条缓动曲线 */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

/**
 * 提示胶囊的屏幕根层挂载件：--glass 底 + blur(18px)（走 BlurredContainer，规格 GLASS.toast）、
 * glass 墨色字、1px 描边、圆角 14、padding 10/16、字号 12.5/600、max-width 78%；
 * 进出场 opacity + 下潜位移 .32s，停留 2000ms（长句档 3500ms）。
 * 连发覆盖：新提示直接换文案并重新计时。
 * 层叠压在浮层(80)之上，必须挂在所在屏幕根 View 的最后一个子视图，pointerEvents="none" 不吃点击。
 * 订阅型展示容器：只订阅 utils/newUiToast 投递总线，各 newui 屏幕根层各挂一台。
 * Android 侧 BlurView 对父层圆角裁切支持有限，降级路径不受影响；直角穿帮时可传 enabled=false 退回贴片染色。
 */
export const NewUiToastHost = ({ bottomInset = 0 }: NewUiToastHostProps) => {
  const theme = useTheme()
  const progress = useMemo(() => new Animated.Value(0), [])
  const [message, setMessage] = useState<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const handleToast = useCallback((next: string, duration: NewUiToastDuration) => {
    setMessage(next)
    clearHideTimer()
    Animated.timing(progress, {
      toValue: 1,
      duration: TOAST.animDuration,
      easing: EASE,
      // opacity + translateY 都是 native 可驱动属性，走原生驱动避免 JS 帧抖动
      useNativeDriver: true,
    }).start()
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: TOAST.animDuration,
        easing: EASE,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // 退场播完且期间没有新提示覆盖时才清内容（finished=false = 被新的进场打断，不清）
        if (finished) setMessage(null)
      })
    }, duration === 'long' ? TOAST.visibleMsLong : TOAST.visibleMs)
  }, [clearHideTimer, progress])

  useEffect(() => subscribeNewUiToast(handleToast), [handleToast])
  useEffect(() => clearHideTimer, [clearHideTimer])

  if (message == null) return null

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    // transform:translate(-50%,14px) → .show translate(-50%,0)（水平居中由外层 alignItems 承担）
    outputRange: [TOAST.riseOffset, 0],
  })

  return (
    <View pointerEvents="none" style={[styles.layer, { bottom: TOAST.bottomGap + bottomInset }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          styles.capsule,
          {
            opacity: progress,
            transform: [{ translateY }],
            borderColor: theme.colors.lineStrong,
          },
        ]}
      >
        {/* .toast background:var(--glass) + backdrop-filter:blur(18px)：共通玻璃件铺底（绝对铺满、不吃点击） */}
        <BlurredContainer spec={GLASS.toast} />
        <Text style={[styles.text, { color: theme.colors.glassPatchInk }]}>{message}</Text>
      </Animated.View>
    </View>
  )
}

NewUiToastHost.displayName = 'NewUIToastHost'

const styles = StyleSheet.create({
  /** 整行铺宽 + 水平居中（等价 left:50% + translateX(-50%)） */
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // 压在 .sheet 之上：必须在屏幕根层最后挂载
    zIndex: Z_LAYER.toast,
  },
  /** padding / radius / 1px 描边 / max-width 78% / box-shadow；描边基色 lineStrong 随主题 */
  capsule: {
    maxWidth: `${TOAST.maxWidthRatio * 100}%`,
    borderRadius: TOAST.radius,
    borderWidth: 1,
    paddingVertical: TOAST.paddingY,
    paddingHorizontal: TOAST.paddingHorizontal,
    overflow: 'hidden',
    shadowColor: TOAST.shadowColor,
    shadowOffset: { width: 0, height: TOAST.shadowOffsetY },
    shadowOpacity: TOAST.shadowOpacity,
    shadowRadius: TOAST.shadowRadius,
    elevation: TOAST.elevation,
  },
  text: {
    fontSize: FONT_SIZE.smallLg,
    fontWeight: TOAST.fontWeight,
    textAlign: 'center',
  },
})
