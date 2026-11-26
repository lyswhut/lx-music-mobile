import { memo } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  GRADIENTS,
  MONO_FONT_FAMILY,
  OPTION_ROW,
  OR_DEL,
  useTheme,
} from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface OptionRowProps {
  /** 主名（音源名 / 平台名 / 动作名） */
  name: string
  /** 名字旁的小字（版本号） */
  version?: string
  /** 一句话说明 */
  sub?: string
  /** 尾部状态标签（文字 + 色点）；不传则不渲染 */
  stateLabel?: string
  /** 状态标签色（由容器传 theme 色值） */
  stateTone?: string
  /** 选中态：brandSoft 渐变底 + 主色描边 + 实心单选圈 */
  active?: boolean
  /** 不可用态：整体压暗 */
  dimmed?: boolean
  /**
   * 图标方块：传入即渲染图标底替代单选圈，供动作行用；
   * 与 active 互斥语义，同传时图标优先。
   */
  icon?: IconName
  /**
   * 破坏性动作：只把图标位取色换成 dangerInk，行本体不动。仅在传 icon 时有意义。
   */
  warn?: boolean
  /**
   * 行尾移除钮：按下只触发它自己（内层 Pressable 抢到 responder），不传保持原样。
   */
  onRemove?: () => void
  /** 移除钮的无障碍名（文案由容器给） */
  removeAriaLabel?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/** 单选圈：未选为发丝内圈，选中为主色填充 + 中心亮环；RN 用嵌套 View 表达 */
const Radio = memo(({ active }: { active: boolean }) => {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.radio,
        {
          borderColor: active ? theme.colors.brand : theme.colors.hairlineStrong,
          backgroundColor: active ? theme.colors.brand : 'transparent',
        },
      ]}
    >
      {active && (
        <View style={[styles.radioCenter, { borderColor: theme.colors.hairlineStrong }]} />
      )}
    </View>
  )
})
Radio.displayName = 'NewUIOptionRowRadio'

/**
 * 浮层单选列表行：音源设置等列表共用。纯展示，选中 / dimmed / 状态标签由容器接线。
 * 未选圈是 CSS inset 内描边，RN 改用外沿 borderWidth 近似。
 */
export const OptionRow = memo(
  ({
    name,
    version,
    sub,
    stateLabel,
    stateTone,
    active = false,
    dimmed = false,
    icon,
    warn = false,
    onRemove,
    removeAriaLabel,
    onPress,
    style,
  }: OptionRowProps) => {
    const theme = useTheme()
    const tone = stateTone ?? theme.colors.text3
    // 行按压缩放
    const pressFx = usePressFx({ scale: OPTION_ROW.pressScale })
    // 移除钮按压缩放；字色转 dangerInk 仍走 pressed 分支，不做颜色补间
  const delFx = usePressFx({ scale: OR_DEL.pressScale })
    return (
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.fill2,
            borderColor: theme.colors.line,
          },
          active && [
            styles.active,
            { borderColor: OPTION_ROW.onBorderColor },
          ],
          dimmed && styles.dimmed,
          pressFx.animatedStyle,
          style,
        ]}
      >
        {active && (
          <LinearGradient
            colors={[...GRADIENTS.brandSoft.colors]}
            start={GRADIENTS.brandSoft.start}
            end={GRADIENTS.brandSoft.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        {icon != null ? (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.colors.fill2, borderColor: theme.colors.line },
            ]}
          >
            <Icon
              name={icon}
              size={OPTION_ROW.iconBoxIcon}
              color={warn ? theme.colors.dangerInk : theme.colors.text2}
            />
          </View>
        ) : (
          <Radio active={active} />
        )}
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {version ? (
              <Text style={[styles.version, { color: theme.colors.text3 }]}>{version}</Text>
            ) : null}
          </View>
          {sub ? (
            <Text
              style={[styles.sub, { color: theme.colors.text3 }]}
              numberOfLines={1}
            >
              {sub}
            </Text>
          ) : null}
        </View>
        {stateLabel ? (
          <View style={styles.state}>
            <View style={[styles.stateDot, { backgroundColor: tone }]} />
            <Text style={[styles.stateText, { color: tone }]}>{stateLabel}</Text>
          </View>
        ) : null}
        {onRemove ? (
          /* 移除钮常态 text-3，按下才转 dangerInk，不做常驻红钮 */
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={removeAriaLabel}
            onPress={onRemove}
            onPressIn={delFx.onPressIn}
            onPressOut={delFx.onPressOut}
            hitSlop={OR_DEL.hitSlop}
            style={[
              styles.del,
              { backgroundColor: theme.colors.fill2, borderColor: theme.colors.hairline },
              delFx.animatedStyle,
            ]}
          >
            {({ pressed }) => (
              <Icon
                name="trash"
                size={OR_DEL.iconSize}
                color={pressed ? theme.colors.dangerInk : theme.colors.text3}
              />
            )}
          </AnimatedPressable>
        ) : null}
      </AnimatedPressable>
    )
  },
)

OptionRow.displayName = 'NewUIOptionRow'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OPTION_ROW.gap,
    paddingVertical: OPTION_ROW.paddingY,
    paddingHorizontal: OPTION_ROW.paddingX,
    borderRadius: OPTION_ROW.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  /** 选中态去默认 chip 底，由渐变铺 */
  active: {
    backgroundColor: 'transparent',
  },
  dimmed: { opacity: OPTION_ROW.offAlpha },
  /** 图标底（动作行专用） */
  iconBox: {
    width: OPTION_ROW.iconBoxSize,
    height: OPTION_ROW.iconBoxSize,
    borderRadius: OPTION_ROW.iconBoxRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  radio: {
    width: OPTION_ROW.radioSize,
    height: OPTION_ROW.radioSize,
    borderRadius: OPTION_ROW.radioSize / 2,
    borderWidth: OPTION_ROW.radioRingWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 选中中心亮环 */
  radioCenter: {
    width: OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2,
    height: OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2,
    borderRadius: (OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2) / 2,
    borderWidth: OPTION_ROW.radioCenterRingWidth,
  },
  body: { flex: 1, minWidth: 0, gap: OPTION_ROW.bodyGap },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: OPTION_ROW.versionGap },
  name: {
    flexShrink: 1,
    fontSize: FONT_SIZE.rank,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** 版本号等标识符走等宽档，保证数字位宽对齐 */
  version: {
    flexShrink: 0,
    fontFamily: MONO_FONT_FAMILY,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.semibold,
  },
  sub: {
    fontSize: FONT_SIZE.caption,
  },
  /** 状态标签：前置色点 */
  state: { flexDirection: 'row', alignItems: 'center', gap: OPTION_ROW.stateGap, flexShrink: 0 },
  stateDot: {
    width: OPTION_ROW.stateDotSize,
    height: OPTION_ROW.stateDotSize,
    borderRadius: OPTION_ROW.stateDotSize / 2,
  },
  stateText: {
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  /** 移除钮 */
  del: {
    width: OR_DEL.size,
    height: OR_DEL.size,
    borderRadius: OR_DEL.radius,
    borderWidth: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
