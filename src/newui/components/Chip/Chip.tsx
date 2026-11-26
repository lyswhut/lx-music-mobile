import { memo } from 'react'
import { Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  CONTROL,
  FONT_SIZE,
  FONT_WEIGHT,
  GRADIENTS,
  LETTER_SPACING,
  MOTION,
  RADIUS,
  SPACING,
  useTheme,
} from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 胶囊内图标尺寸 */
const ICON_SIZE = 14
/** 等宽字族（跨平台近似） */
const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' })
/** 按压缩放与时长 */
const CHIP_PRESS_SCALE = 0.94
const CHIP_PRESS_MS = MOTION.base

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface ChipProps {
  /** 文字标签 */
  label: string
  /**
   * 第二段等宽文字，用于「平台短名 + 歌单 ID」这类样本胶囊；不传即单段。
   */
  monoLabel?: string
  /** 选中态：品牌渐变底 + 深色字 */
  active?: boolean
  /**
   * 不可选态：降显但仍可点击，点击说明由容器给出，视觉禁用不等于死按钮。
   */
  disabled?: boolean
  /** 可选的前置图标 */
  icon?: IconName
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 胶囊筛选件：榜单 tabs / 音质选择 / 分类 / 热搜等复用。
 * 选中态为品牌渐变底 + 深色字，未选中为 chips 覆盖色 + 1px 描边。
 */
export const Chip = memo(({ label, monoLabel, active = false, disabled = false, icon, onPress, style }: ChipProps) => {
  const theme = useTheme()
  const pressFx = usePressFx({ scale: CHIP_PRESS_SCALE, duration: CHIP_PRESS_MS })
  const contentColor = active && !disabled ? theme.colors.onBrand : disabled ? theme.colors.text3 : theme.colors.text2
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[
        styles.root,
        // 选中档透明底，由内层品牌渐变铺满；禁用档 fill1，常规档 fill2
        {
          backgroundColor: active && !disabled
            ? 'transparent'
            : disabled
              ? theme.colors.fill1
              : theme.colors.fill2,
        },
        pressFx.animatedStyle,
        style,
      ]}
    >
      {active && !disabled && (
        <LinearGradient
          colors={[...GRADIENTS.brand.colors]}
          start={GRADIENTS.brand.start}
          end={GRADIENTS.brand.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* 1px 描边用绝对定位盖层：borderWidth 会把盒子撑大，导致选中前后尺寸跳动 */}
      {active && !disabled ? null : (
        <View pointerEvents="none" style={[styles.ring, { borderColor: theme.colors.hairline }]} />
      )}
      {icon != null && <Icon name={icon} size={ICON_SIZE} color={contentColor} style={styles.icon} />}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: contentColor,
            // 禁用 500 / 常规 600 / 选中 700
            fontWeight: active && !disabled
              ? FONT_WEIGHT.bold
              : disabled
                ? FONT_WEIGHT.medium
                : FONT_WEIGHT.semibold,
          },
        ]}
      >
        {label}
      </Text>
      {monoLabel != null && (
        <Text numberOfLines={1} style={[styles.mono, { color: contentColor }]}>
          {monoLabel}
        </Text>
      )}
    </AnimatedPressable>
  )
})

Chip.displayName = 'NewUIChip'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTROL.chipHeight,
    paddingHorizontal: CONTROL.chipPaddingX,
    borderRadius: RADIUS.control,
    overflow: 'hidden',
  },
  /** 只挂在图标右沿，不写在 root 上（避免 gap 计入绝对定位覆盖层） */
  icon: {
    marginRight: SPACING.s,
  },
  /** 不占地的 1px 描边盖，圆角与本体同一档 */
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: RADIUS.control,
  },
  /**
   * 不设等值 lineHeight：Android 上会削掉 CJK 字形上半截；
   * 垂直居中交给盒模型交叉轴对齐。
   */
  label: {
    fontSize: FONT_SIZE.smallLg,
    letterSpacing: LETTER_SPACING.tight,
    textAlign: 'center',
  },
  /** 等宽第二段 */
  mono: {
    fontFamily: MONO_FONT,
    fontSize: FONT_SIZE.captionLg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
})
