import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { BUTTON, FONT_SIZE, FONT_WEIGHT, RADIUS, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PillButtonProps {
  /** 文案；纯图标入口可不传 */
  label?: string
  /** 前置图标 */
  icon?: IconName
  onPress?: () => void
  /** 图标尺寸，默认 15；edit 档传 14 */
  iconSize?: number
  /**
   * 形态档：'open'（缺省）左右内衬同为 13、按压缩放 .95；
   * 'edit' 左内衬 11 / 右 13、按压缩放 .96。
   */
  variant?: 'open' | 'edit'
  style?: StyleProp<ViewStyle>
}

/**
 * 小胶囊按钮：两档规格仅左内衬与按压缩放不同。
 * 用于卡内 / 区段头的轻操作入口，不占满整行。
 */
export const PillButton = memo(
  ({ label, icon, onPress, iconSize = BUTTON.pillIcon, variant = 'open', style }: PillButtonProps) => {
    const theme = useTheme()
    const isEdit = variant === 'edit'
    // 底色常态 fill2 → 按下 fill3，故 from 必须给常态色，不能从透明淡出
    const pressFx = usePressFx({
      scale: isEdit ? BUTTON.pillPressScaleEdit : BUTTON.pillPressScale,
      background: { from: theme.colors.fill2, to: theme.colors.fill3 },
    })
    return (
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[
          styles.root,
          { borderColor: theme.colors.line },
          isEdit && { paddingLeft: BUTTON.pillPaddingLeftEdit },
          pressFx.animatedStyle,
          style,
        ]}
      >
        {icon != null && <Icon name={icon} size={iconSize} color={theme.colors.text2} />}
        {label != null && label.length > 0 && (
          <Text numberOfLines={1} style={[styles.label, { color: theme.colors.text2 }]}>
            {label}
          </Text>
        )}
      </AnimatedPressable>
    )
  },
)

PillButton.displayName = 'NewUIPillButton'

const styles = StyleSheet.create({
  root: {
    height: BUTTON.pillHeight,
    paddingHorizontal: BUTTON.pillPaddingX,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BUTTON.pillGap,
  },
  label: {
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
  },
})
