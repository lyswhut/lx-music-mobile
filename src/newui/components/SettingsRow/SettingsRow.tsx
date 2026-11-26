import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_WEIGHT, GRADIENTS, SETTINGS, useTheme } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Icon, type IconName } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface SettingsRowProps {
  /** 左侧图标底（28×28 圆角 9） */
  icon: IconName
  /** 主标题 */
  title: string
  /** 一句话说明（单行、溢出省略） */
  hint?: string
  /** 右侧值文案（当前档位、缓存大小、版本号等）；不传则不渲染 */
  value?: string
  /** 值用主色（「在用」这类选中回显） */
  valueHighlight?: boolean
  /** 选中态：图标底换渐变 + 主色图标 */
  selected?: boolean
  /**
   * 传入即成为可点行：右侧自动补 chevron。
   * 不传则是纯展示行（不可点、无箭头），避免做出「点了没反应」的假行。
   */
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/** 图标底：常规玻璃底 text-2 图标；选中态渐变底主色图标 */
const SettingsIconBox = memo(({ icon, selected }: { icon: IconName; selected: boolean }) => {
  const theme = useTheme()
  const glyph = (
    <Icon
      name={icon}
      size={SETTINGS.iconGlyphSize}
      color={selected ? theme.colors.brand : theme.colors.text2}
    />
  )
  if (selected) {
    return (
      <LinearGradient
        colors={[...GRADIENTS.brandSoft.colors]}
        start={GRADIENTS.brandSoft.start}
        end={GRADIENTS.brandSoft.end}
        style={styles.iconBox}
      >
        {glyph}
      </LinearGradient>
    )
  }
  return (
    <View style={[styles.iconBox, { backgroundColor: theme.colors.fill2 }]}>{glyph}</View>
  )
})
SettingsIconBox.displayName = 'NewUISettingsIconBox'

/**
 * 设定页通用行：图标底 + 标题/说明 + 可选右侧值与箭头；设定家族所有行共用。
 * 纯展示组件：选中态、值文案、点击行为全部由容器接线；行间分隔线归 SettingsGroup。
 */
export const SettingsRow = memo(
  ({
    icon,
    title,
    hint,
    value,
    valueHighlight = false,
    selected = false,
    onPress,
    style,
  }: SettingsRowProps) => {
    const theme = useTheme()
    /**
     * 按压只变底色、不缩放：底色淡入交给不动蒙层的 opacity（native driver），不做颜色插值。
     * 不可点信息行走下面的纯 View 分支，这条 Value 只喂给可点分支的蒙层。
     */
    const pressFx = usePressFx({ duration: SETTINGS.rowPressMs })
    const showValue = value != null || onPress != null
    const body = (
      <View style={styles.inner} pointerEvents="none">
        <SettingsIconBox icon={icon} selected={selected} />
        <View style={styles.body}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          {hint != null && (
            <Text
              numberOfLines={1}
              style={[styles.hint, { color: theme.colors.text3 }]}
            >
              {hint}
            </Text>
          )}
        </View>
        {showValue && (
          <View style={styles.value}>
            {value != null && (
              <Text
                numberOfLines={1}
                style={[
                  styles.valueText,
                  { color: valueHighlight ? theme.colors.brand : theme.colors.text3 },
                ]}
              >
                {value}
              </Text>
            )}
            {onPress != null && (
              <Icon
                name="chevron"
                size={SETTINGS.valueIconSize}
                color={withAlpha(theme.colors.text3, SETTINGS.valueIconAlpha)}
              />
            )}
          </View>
        )}
      </View>
    )
    if (onPress == null) {
      return <View style={[styles.row, style]}>{body}</View>
    }
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[styles.row, style]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.pressBg, { backgroundColor: theme.colors.fill1, opacity: pressFx.progress }]}
        />
        {body}
      </AnimatedPressable>
    )
  },
)

SettingsRow.displayName = 'NewUISettingsRow'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SETTINGS.rowGap,
    paddingVertical: SETTINGS.rowPaddingY,
    paddingHorizontal: SETTINGS.rowPaddingX,
  },
  /** 按下底色蒙层：铺满整行（圆角由列表卡裁切） */
  pressBg: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SETTINGS.rowGap,
  },
  iconBox: {
    width: SETTINGS.iconBoxSize,
    height: SETTINGS.iconBoxSize,
    borderRadius: SETTINGS.iconBoxRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    gap: SETTINGS.bodyGap,
  },
  title: {
    fontSize: SETTINGS.titleSize,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: SETTINGS.titleLetterSpacing,
  },
  hint: {
    fontSize: SETTINGS.hintSize,
    lineHeight: SETTINGS.hintLineHeight,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SETTINGS.valueGap,
  },
  valueText: {
    fontSize: SETTINGS.valueSize,
    fontWeight: FONT_WEIGHT.semibold,
  },
})
