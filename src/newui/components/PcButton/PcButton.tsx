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
   * 变体（对应原型 .pc 的四类）：
   * ghost = 上/下曲（透明圆钮 + 27px 亮图标）；
   * main  = 播/停（64px 渐变底 + 深色图标 + 主色光晕）；
   * tool  = 收藏以外带标签的竖排钮（图标 + 小字，选中 brand 色）；
   * fav   = 收藏心钮（40px / 24 图标，已收藏 brand 色）。
   */
  kind: PcButtonKind
  name: IconName
  /** tool 变体的下标签（其余变体忽略） */
  label?: string
  /** 选中态（tool 变体：.pc.tool.on 主色；fav：已收藏） */
  active?: boolean
  onPress?: () => void
  /** 无障碍标签（原型 aria-label：上一曲 / 下一曲 / 播放暂停 / 定时…） */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/**
 * 播放页主控制行按钮（对应原型 .pc，styles.css L570-579）。
 * 纯展示组件：按压缩放用 Pressable pressed 态表达（原型 :active scale(.93)）。
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
   * .pc.tool .ic align-self:end（styles.css L575-576：grid 两行 1fr/auto，
   * 图标行吃掉余量且图标贴行底，图标中心落在盒内 ~24px 处）：
   * RN 里用 marginTop:'auto' 把余量吸到图标上方，图标+标签整体沉底、
   * 图标与 ghost/main 的图标中心线水平对齐（marginBottom:'auto' 方向相反，
   * 会把图标顶到盒顶导致五钮错位）。
   */
  toolIcon: {
    marginTop: 'auto',
  },
  /** .pc.tool em：9.5px / 700 / letter-spacing .3。
   *  原型那句 `line-height:1` **不直译**（与 Chip.tsx 同一颗雷，见其注释）：等值于字号的 `lineHeight`
   *  在 Android 上把 CJK 字形削半，而 `base` 还带固定高 + `overflow:'hidden'`，削完再被盒边裁一次。
   *  竖排居中的活由 `base` 的 `alignItems/justifyContent:'center'` 与 `toolIcon` 的 `marginTop:'auto'` 承担。 */
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
