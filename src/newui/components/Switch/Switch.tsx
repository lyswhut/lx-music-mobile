import { memo, useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { MOTION, RADIUS, SHADOW, SWITCH, useTheme } from '@/newui/theme'

/** 开关过渡缓动（时长见 MOTION.toggle） */
const EASE = Easing.bezier(MOTION.easing[0], MOTION.easing[1], MOTION.easing[2], MOTION.easing[3])

export interface SwitchProps {
  /** 受控状态 */
  value: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 开关（设定页各开关行、播放页浮层开关行共用）。
 * on 态底色用叠层透明度而非颜色插值，规避平台差异，位移与透明度可走原生驱动。
 */
export const Switch = memo(({ value, onValueChange, disabled, style }: SwitchProps) => {
  const theme = useTheme()
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: MOTION.toggle,
      easing: EASE,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [progress, value])

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SWITCH.travel],
  })

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabled ?? false }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={[
        styles.track,
        { backgroundColor: theme.colors.fill4, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.onLayer, { backgroundColor: theme.colors.brand, opacity: progress }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.knob,
          { backgroundColor: theme.colors.switchKnob },
          { transform: [{ translateX }] },
        ]}
      />
    </Pressable>
  )
})

Switch.displayName = 'NewUISwitch'

const styles = StyleSheet.create({
  track: {
    flexShrink: 0,
    width: SWITCH.width,
    height: SWITCH.height,
    borderRadius: SWITCH.radius,
  },
  /** on 态轨道底色，靠透明度从 off 底过渡 */
  onLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SWITCH.radius,
  },
  knob: {
    position: 'absolute',
    top: SWITCH.inset,
    left: SWITCH.inset,
    width: SWITCH.knob,
    height: SWITCH.knob,
    borderRadius: RADIUS.full,
    ...SHADOW.knob,
  },
})
