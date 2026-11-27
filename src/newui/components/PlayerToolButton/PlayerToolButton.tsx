import { memo } from 'react'
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { PLAYER, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PlayerToolButtonProps {
  /** 图标名；开启态由容器换成另一枚轮廓 */
  name: IconName
  /** 无障碍标签：工具行只剩图形，状态文案一律走这里 */
  accessibilityLabel: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 播放页次级工具行按钮：一行四颗等分的纯图标钮，无选中底色、无文字标签，
 * 开关状态只由图标表达。纯展示，只做按压缩放。
 */
export const PlayerToolButton = memo(
  ({ name, accessibilityLabel, onPress, style }: PlayerToolButtonProps) => {
    const theme = useTheme()
    // 按压缩放
    const pressFx = usePressFx({ scale: PLAYER.ptPressScale })
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[styles.root, pressFx.animatedStyle, style]}
      >
        <Icon name={name} size={PLAYER.ptIcon} color={theme.colors.text2} />
      </AnimatedPressable>
    )
  },
)

PlayerToolButton.displayName = 'NewUIPlayerToolButton'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PLAYER.ptPaddingY,
    paddingHorizontal: PLAYER.ptPaddingX,
  },
})
