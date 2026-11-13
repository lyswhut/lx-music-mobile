import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, GLASS, MOTION, TOAST, Z_LAYER, useTheme } from '@/newui/theme'
import { subscribeNewUiToast, type NewUiToastDuration } from '@/newui/utils/newUiToast'

import { BlurredContainer } from '../Glass'

export interface NewUiToastHostProps {
  /** 底部安全区（与 TOAST.bottomGap——原型净高——相加成实际底边距） */
  bottomInset?: number
}

/** 原型 --ease: cubic-bezier(.22,.61,.36,1)（与 Sheet 骨架同一条曲线） */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

/**
 * 提示胶囊的屏幕根层挂载件（QA 2026-10-14 D-09 观感：系统白框 toast → 原型深色贴片胶囊）。
 * 视觉逐段对照 styles.css L795-803：--glass 底 + blur(18px)（走共通件 BlurredContainer，
 * 规格 GLASS.toast）、--glass-ink 字、1px --line-strong 描边、圆角 14、padding 10/16、
 * 字号 12.5/600、max-width 78%、底边距净高 168 + 安全区；进出场 opacity + 14px 下潜位移
 * .32s（原型 .show 态的等价），停留 2000ms（长句档 3500ms，见 theme/TOAST）。
 * 交互对照 app.js L102-107：连发覆盖——新提示直接换文案并重新计时（clearTimeout 同语义）。
 * 层叠：原型 .toast z-index:90 压在浮层(80)之上（全站最高 JS 层），所以本件必须挂在
 * 所在屏幕根 View 的**最后一个子视图**（各屏接线处已保证），pointer-events:none 不吃任何点击。
 * 本件是「订阅型展示容器」：只订阅 utils/newUiToast 投递总线并渲染，不读任何业务状态；
 * 各 newui 屏幕（主屏 / 播放页 / 详情层 / 搜索层）根层各挂一台，投递交由 showNewUiToast()。
 * 已知近似：Android 侧 BlurView 对父层圆角裁切支持有限，降级路径（无模糊注册）不受影响；
 * 设备验收若直角穿帮，单点传 BlurredContainer enabled=false 即可退回贴片染色。
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
      // opacity + translateY 共用这条 JS 驱动的 progress（与 Sheet 骨架同口径，不混用 native driver）
      useNativeDriver: false,
    }).start()
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: TOAST.animDuration,
        easing: EASE,
        useNativeDriver: false,
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
  /** .toast position:absolute left:50% + translateX(-50%) 的等价：整行铺宽 + 水平居中 */
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // 原型 z-index:90（高于 .sheet 80）：必须在屏幕根层最后挂载，见组件头注
    zIndex: Z_LAYER.toast,
  },
  /** padding / radius / 1px 描边 / max-width 78% / box-shadow 逐项对照 styles.css L796-801；
   *  描边基色 lineStrong 随主题（组件侧传入） */
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
  /** font-size:12.5px;font-weight:600;text-align:center（L798） */
  text: {
    fontSize: FONT_SIZE.smallLg,
    fontWeight: TOAST.fontWeight,
    textAlign: 'center',
  },
})
