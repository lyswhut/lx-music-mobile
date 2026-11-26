import { memo } from 'react'
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  FONT_WEIGHT,
  GRADIENTS,
  LETTER_SPACING,
  PLAYER,
  SHADOW,
  useTheme,
} from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

export type PcButtonKind = 'ghost' | 'main' | 'tool' | 'fav'

export interface PcButtonProps {
  /**
   * 变体：ghost = 上/下曲（透明圆钮 + 亮图标）；main = 播/停（渐变底 + 深色图标 + 光晕）；
   * tool = 图标 + 小字竖排钮；fav = 收藏心钮。
   */
  kind: PcButtonKind
  name: IconName
  /** tool 变体的下标签（其余变体忽略） */
  label?: string
  /** 选中态（tool 转主色；fav 显示实心） */
  active?: boolean
  onPress?: () => void
  /** 无障碍标签 */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/**
 * 播放页主控制行按钮。纯展示组件，按压缩放用 Pressable pressed 态表达。
 */
export const PcButton = memo(
  ({ kind, name, label, active, onPress, accessibilityLabel, style }: PcButtonProps) => {
  const theme = useTheme()

  if (kind === 'main') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? '播放/暂停'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.main,
          SHADOW.playerMain,
          pressed && { transform: [{ scale: PLAYER.pcPressScale }] },
          style,
        ]}
      >
        <LinearGradient
          colors={[...GRADIENTS.brand.colors]}
          start={GRADIENTS.brand.start}
          end={GRADIENTS.brand.end}
          style={StyleSheet.absoluteFill}
        />
        <Icon name={name} size={PLAYER.mainIcon} color={theme.colors.onBrand} />
      </Pressable>
    )
  }

  if (kind === 'tool') {
    const tint = active ? theme.colors.brand : theme.colors.text
    const labelColor = active ? theme.colors.brand : theme.colors.text3
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.tool,
          pressed && { transform: [{ scale: PLAYER.pcPressScale }] },
          style,
        ]}
      >
        <Icon name={name} size={PLAYER.pcToolIcon} color={tint} style={styles.toolIcon} />
        {label != null && (
          <Text style={[styles.toolLabel, { color: labelColor }]}>{label}</Text>
        )}
      </Pressable>
    )
  }

  if (kind === 'fav') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? '收藏'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.fav,
          pressed && { transform: [{ scale: PLAYER.favPressScale }] },
          style,
        ]}
      >
        <Icon
          name={active ? 'heartFill' : 'heart'}
          size={PLAYER.favIcon}
          color={active ? theme.colors.brand : theme.colors.text2}
        />
      </Pressable>
    )
  }

  // ghost（默认）：上/下曲
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.ghost,
        pressed && { transform: [{ scale: PLAYER.pcPressScale }] },
        style,
      ]}
    >
      <Icon name={name} size={PLAYER.pcGhostIcon} color={theme.colors.text} />
    </Pressable>
  )
})

PcButton.displayName = 'NewUIPcButton'

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ghost: {
    width: PLAYER.pcSize,
    height: PLAYER.pcSize,
    borderRadius: PLAYER.pcSize / 2,
  },
  main: {
    width: PLAYER.mainSize,
    height: PLAYER.mainSize,
    borderRadius: PLAYER.mainSize / 2,
  },
  tool: {
    width: PLAYER.pcSize,
    height: PLAYER.pcSize,
    borderRadius: PLAYER.pcSize / 2,
    gap: PLAYER.pcToolGap,
  },
  /**
   * 图标 + 标签整体沉底，使图标中心与 ghost / main 对齐；
   * 若改 marginBottom:'auto' 会把图标顶到盒顶，五钮错位。
   */
  toolIcon: {
    marginTop: 'auto',
  },
  /**
   * 标签字号小、字重粗。不写等值于字号的 lineHeight：Android 上会把 CJK 字形削半，
   * 且 base 带固定高 + overflow hidden，削完还会被盒边再裁一次。
   */
  toolLabel: {
    fontSize: PLAYER.pcToolLabelSize,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.normal,
  },
  fav: {
    width: PLAYER.favSize,
    height: PLAYER.favSize,
    borderRadius: PLAYER.favSize / 2,
  },
})
