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
  /** .set-ic 左侧图标底（28×28 圆角 9） */
  icon: IconName
  /** .st-l b 主标题 */
  title: string
  /** .st-l em 一句话说明（原型单行、溢出省略） */
  hint?: string
  /** .st-r 右侧值文案（当前档位、缓存大小、版本号等）；不传则不渲染 */
  value?: string
  /** .st-r.hi：值用主色（「在用」这类选中回显） */
  valueHighlight?: boolean
  /** .set-row.on：图标底换 --grad-soft 渐变 + 主色图标（分组行家族自带的选中态） */
  selected?: boolean
  /**
   * 传入即成为可点行：右侧自动补 .st-r 尾部 chevron（原型 setRow 恒定带箭头）。
   * 不传则是纯展示行（不可点、无箭头），避免做出「点了没反应」的假行。
   */
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/** 图标底 .set-ic：常规 glass 底 text-2 图标；.on 态 grad-soft 渐变底主色图标 */
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
 * 设定页通用行（对应原型 .set-row，styles.css L442-456）：
 * 图标底 + 标题/说明 + 可选右侧值与箭头；设定家族里所有行（外观三档、清缓存、关于）共用。
 * 纯展示组件：选中态（selected）、值文案、点击行为全部由容器接线。
 * 行间分隔线归组容器 SettingsGroup（原型 .set-row border-top 由 .set-list 上下文决定首行无线）。
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
     * `.set-row:active{background:var(--fill-1)}`（styles.css L628），补间 `.18s var(--ease)`（L626）。
     * 行类只变底色、不缩放：底色淡入交给一层不动的蒙层 opacity（native driver），不做颜色插值。
     * 不可点的信息行（`.set-row.info`：原型 `:active{background:transparent}`，L642）走下面的纯 View 分支，
     * 这条 Value 虽在两种形态下都会建，但只有可点分支会把它喂给蒙层。
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
  /** .set-row：gap 11 / padding 13 14（按压底色走下面那层不动的蒙层） */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SETTINGS.rowGap,
    paddingVertical: SETTINGS.rowPaddingY,
    paddingHorizontal: SETTINGS.rowPaddingX,
  },
  /** 按下底色蒙层：铺满整行（圆角由 .set-list 的裁切层负责，行本身没有圆角） */
  pressBg: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SETTINGS.rowGap,
  },
  /** .set-ic：28×28 圆角 9 居中 */
  iconBox: {
    width: SETTINGS.iconBoxSize,
    height: SETTINGS.iconBoxSize,
    borderRadius: SETTINGS.iconBoxRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** .st-l：flex:1 竖排 gap 2 */
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
  /** .st-r：gap 4 */
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
