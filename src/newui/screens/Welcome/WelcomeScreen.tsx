import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { NEW_UI_WELCOME_TEXT } from '@/newui/const'
import { FONT_SIZE, FONT_WEIGHT, MOTION, useTheme } from '@/newui/theme'

export interface WelcomeScreenProps {
  componentId: string
}

const EASE = Easing.bezier(
  MOTION.easing[0],
  MOTION.easing[1],
  MOTION.easing[2],
  MOTION.easing[3],
)
/** 欢迎屏停留时长（产品口径：约 1 秒） */
const HOLD_MS = 1000

/**
 * 冷启动欢迎屏（RNN overlay）：跟随主题的纯色底 + 居中「你好，我的朋友」（浅色白底深字 / 深色黑底白字），
 * 停留 1 秒后 300ms 淡出，结束自行 dismissOverlay 露出首页。失败也不阻塞启动。
 */
export const WelcomeScreen = ({ componentId }: WelcomeScreenProps) => {
  const theme = useTheme()
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      void Navigation.dismissOverlay(componentId).catch(() => {})
    }
    const anim = Animated.sequence([
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: MOTION.slow,
        easing: EASE,
        useNativeDriver: true,
      }),
    ])
    anim.start(({ finished }) => { if (finished) dismiss() })
    return () => {
      anim.stop()
      dismiss()
    }
  }, [componentId, opacity])

  return (
    <Animated.View style={[styles.root, { backgroundColor: theme.colors.bg, opacity }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>{NEW_UI_WELCOME_TEXT}</Text>
    </Animated.View>
  )
}

WelcomeScreen.displayName = 'NewUIWelcomeScreen'

const styles = StyleSheet.create({
  /** 满屏含状态栏那一条；底色走 theme.colors.bg（浅色近白 / 深色近黑） */
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 文字色走 theme.colors.text，随主题反相 */
  text: {
    fontSize: FONT_SIZE.displayLg,
    fontWeight: FONT_WEIGHT.black,
  },
})
