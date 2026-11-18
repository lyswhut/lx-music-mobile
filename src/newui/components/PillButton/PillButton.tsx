import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { BUTTON, FONT_SIZE, FONT_WEIGHT, RADIUS, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PillButtonProps {
  /** 文案（.pl-open-btn / .mh-edit 内文字）；纯图标入口（如「打开歌单」）可不传 */
  label?: string
  /** 前置图标，如「打开歌单 ID」「改昵称」「管理」 */
  icon?: IconName
  onPress?: () => void
  /** 图标尺寸，默认 15（.pl-open-btn）；.mh-edit 传 14 */
  iconSize?: number
  /**
   * 原型形态档（QA D85）：这两件规格几乎一致但差在两处细节——
   * - 'open'（缺省，= .pl-open-btn）：左右内衬同 13，按压缩放 .95；
   * - 'edit'（= .mh-edit）：左内衬 11 / 右 13，按压缩放 .96。
   */
  variant?: 'open' | 'edit'
  style?: StyleProp<ViewStyle>
}

/**
 * 小胶囊按钮（对应原型 .pl-open-btn / .mh-edit，两者规格几乎一致故合并为一件，
 * 差异走 variant 档位：左内衬与按压缩放各一档，见 PillButtonProps.variant）。
 * 用于卡内 / 区段头的轻操作入口，不占满整行。
 */
export const PillButton = memo(
  ({ label, icon, onPress, iconSize = BUTTON.pillIcon, variant = 'open', style }: PillButtonProps) => {
    const theme = useTheme()
    const isEdit = variant === 'edit'
    /**
     * `.pl-open-btn:active{transform:scale(.95);background:var(--fill-3)}`（styles.css L470）/
     * `.mh-edit:active{transform:scale(.96);background:var(--fill-3)}`（L535）；
     * 两条的 transition 都是 `.2s var(--ease)`（L469 / L533），即 MOTION.fast 缺省档。
     * 底色是「常态 fill-2 → 按下 fill-3」，故 from 必须给常态色，不能从透明淡出来。
     */
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
