import { memo } from 'react'
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { PLAYER, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PlayerToolButtonProps {
  /** 图标名；开启态由容器换成另一枚轮廓（timer/timerOn、float/floatOn，循环五态五轮廓） */
  name: IconName
  /** 无障碍标签：工具行只剩图形，状态文案一律走 aria-label（原型 index.html L346 注释） */
  accessibilityLabel: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 播放页次级工具行按钮（对应原型 .pt-btn，styles.css L649-653）：
 * 一行四颗等分（flex:1）的纯图标钮，无选中底色、无文字标签——
 * 开关状态只由图标本身表达（容器按状态换 name），这里只做按压缩放。
 * 纯展示组件：图标与文案由容器传入，不读任何状态。
 */
export const PlayerToolButton = memo(
  ({ name, accessibilityLabel, onPress, style }: PlayerToolButtonProps) => {
    const theme = useTheme()
    // `.pt-btn:active{transform:scale(.94)}`（styles.css L797）。原型这条只给 color 写了 transition
    // （`.pt-btn{transition:color .25s}`，L796），缩放本身没有时长 —— 与 `.pc` 同族，这里按家族缺省 200ms 补间
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
  /** .pt-btn flex:1 / min-width:0 / padding 9px 2px（原型 place-items:center，RN 用居中） */
  root: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PLAYER.ptPaddingY,
    paddingHorizontal: PLAYER.ptPaddingX,
  },
})
