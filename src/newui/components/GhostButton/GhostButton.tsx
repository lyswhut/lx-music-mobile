import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  BUTTON,
  FONT_SIZE,
  FONT_WEIGHT,
  GRADIENTS,
  RADIUS,
  SHADOW,
  useTheme,
} from '@/newui/theme'
import { shade } from '@/newui/utils'

import { Icon, type IconName } from '../Icon'

/** 实心档按压亮度（RN 无滤镜，直接压渐变本身） */
const SOLID_PRESS_BRIGHTNESS = 0.9
/** 按压缩放 */
const GHOST_PRESS_SCALE = 0.98
/** 实心档常态 / 按压态品牌渐变（由 GRADIENTS.brand 派生） */
const SOLID_COLORS = [...GRADIENTS.brand.colors] as string[]
const SOLID_COLORS_PRESSED = SOLID_COLORS.map(color => shade(color, SOLID_PRESS_BRIGHTNESS))

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface GhostButtonProps {
  label: string
  /** 前置图标，如「播放全部」「随机播放」 */
  icon?: IconName
  onPress?: () => void
  disabled?: boolean
  /** 是否占满交叉轴，默认 true；.pl-actions 传 false 并配 style={{ flex: 1 }} */
  fill?: boolean
  /**
   * 实心档：品牌渐变 + onBrand 墨色字 + 主色光晕，按下压暗一档；
   * 缺省 false，原子档（灰底 + 描边）不变。
   */
  solid?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 幽灵按钮：首页「播放全部」、歌单详情操作排等次级主操作。
 * 纯展示组件，外边距交由容器布局控制。
 */
export const GhostButton = memo(
  ({ label, icon, onPress, disabled, fill = true, solid = false, style }: GhostButtonProps) => {
    const theme = useTheme()
    /**
     * 两档共用 200ms 补间：原子档底色 fill2 → fill3，实心档渐变整条压暗。
     * `solid` 是调用点的静止档位，driver 一经确定不再变：实心档只动 native，
     * 原子档带底色插值（JS）。
     */
    const pressFx = usePressFx({
      scale: GHOST_PRESS_SCALE,
      background: solid ? undefined : { from: theme.colors.fill2, to: theme.colors.fill3 },
    })

    // 实心档：品牌渐变铺底、深色墨、主色光晕；按压 = scale(.98) + 压暗
    if (solid) {
      const ink = theme.colors.onBrand
      return (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled ?? false }}
          disabled={disabled}
          onPress={onPress}
          onPressIn={pressFx.onPressIn}
          onPressOut={pressFx.onPressOut}
          style={[
            styles.root,
            styles.solid,
            fill ? styles.fill : null,
            SHADOW.ghostSolid,
            pressFx.animatedStyle,
            disabled && styles.disabled,
            style,
          ]}
        >
          <LinearGradient
            colors={SOLID_COLORS}
            start={GRADIENTS.brand.start}
            end={GRADIENTS.brand.end}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          {/* 压暗渐变淡入，与按压同一条补间 */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: pressFx.progress }]}
          >
            <LinearGradient
              colors={SOLID_COLORS_PRESSED}
              start={GRADIENTS.brand.start}
              end={GRADIENTS.brand.end}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {icon != null && <Icon name={icon} size={BUTTON.ghostIcon} color={ink} />}
          <Text numberOfLines={1} style={[styles.label, { color: ink }]}>
            {label}
          </Text>
        </AnimatedPressable>
      )
    }

    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled ?? false }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[
          styles.root,
          fill ? styles.fill : null,
          { borderColor: theme.colors.line },
          pressFx.animatedStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon != null && <Icon name={icon} size={BUTTON.ghostIcon} color={theme.colors.text2} />}
        <Text numberOfLines={1} style={[styles.label, { color: theme.colors.text2 }]}>
          {label}
        </Text>
      </AnimatedPressable>
    )
  },
)

GhostButton.displayName = 'NewUIGhostButton'

const styles = StyleSheet.create({
  root: {
    height: BUTTON.ghostHeight,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BUTTON.ghostGap,
  },
  fill: {
    width: '100%',
  },
  /**
   * 实心档去掉 1px 描边（被主色光晕替换）；overflow 让渐变裁到圆角上。
   */
  solid: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  label: {
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  disabled: {
    opacity: 0.45,
  },
})
