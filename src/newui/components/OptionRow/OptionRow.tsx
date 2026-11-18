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

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface OptionRowProps {
  /** .or-body b 主名（音源名 / 平台名 / 动作名） */
  name: string
  /** 名字旁的小字（原型 b small：v1.0.0 版本号） */
  version?: string
  /** .or-body em 一句话说明（「能播 N 个平台 · 音质列表」等） */
  sub?: string
  /** .or-state 尾部状态标签（文字 + tone 色点）；不传则不渲染 */
  stateLabel?: string
  /** 状态标签色（原型 --tone：ok / brand-3 / text-3 语义色，由容器传 theme 色值） */
  stateTone?: string
  /** .opt-row.on：brandSoft 渐变底 + 主色描边 + 实心单选圈 */
  active?: boolean
  /** .opt-row.off：整体 dimmed（原型 opacity .42） */
  dimmed?: boolean
  /**
   * .opt-ic 图标方块（styles.css L688-690，原型 actRow L770-774）：
   * 传入即渲染 30×30 圆角 10 图标底替代单选圈 —— 单曲操作面板等「动作行」用；
   * 不传保持音源浮层的单选圈（.radio）。与 active 互斥语义，同传时图标优先。
   */
  icon?: IconName
  /**
   * .opt-row.warn（styles.css L769，件 parts/common-control/opt-list.css L46）：
   * 只把图标位取色换成报错墨色 dangerInk（`_base.css` 两套主题各一档），行本体不动——
   * 「从本歌单移出」这类破坏性动作与「加入」那批一眼分开。仅在传 icon 时有意义。
   */
  warn?: boolean
  /**
   * 行尾移除钮 `.or-del`（styles.css L771-774，件 parts/common-control/opt-list.css L43-48；
   * 原型 scriptRow L2383-2386 那棵垃圾桶）：传入即在行尾挂一枚 28×28 圆角钮，
   * 按下只触发它自己（RN 里内层 Pressable 抢到 responder，行本体的 onPress 不会连带走——
   * 与原型 `e.stopPropagation()` 同一件事）。不传保持原样，既有调用方零影响。
   */
  onRemove?: () => void
  /** 移除钮的无障碍名（原型 `aria-label="移除音源 ${name}"`，件 opt-list.html 同句；文案由容器给） */
  removeAriaLabel?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/** 单选圈（原型 .radio，styles.css L733-735）：未选 inset 1.6px var(--hairline-strong)；
 * 选中 inset 6px 主色 + 同 token 的中心亮环。两环都随主题反相（浅底自动叠黑），
 * RN 用嵌套 View 表达。 */
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
 * 浮层单选列表行（对应原型 .opt-row，styles.css L672-687）：
 * 音源设置浮层「已安装音源 / 音乐平台」两组列表共用；纯展示组件，
 * 选中 / dimmed / 状态标签由容器接线（SourceSheet 容器）。
 * 近似点：未选圈是 CSS inset box-shadow（1.6px 内描边），RN 转外沿 borderWidth 视觉等价。
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
    // `.opt-row{transition:.2s var(--ease)}` / `.opt-row:active{transform:scale(.99)}`（styles.css L886-L890）
    const pressFx = usePressFx({ scale: OPTION_ROW.pressScale })
  // `.or-del:active{transform:scale(.9)}`（件 opt-list.css L48），过渡 `.2s var(--ease)`（L47）；
  // 同一条 :active 里还有字色转 dangerInk —— 那半仍是既有做法（`({ pressed })` 换色），不做颜色补间
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
          /* .or-del：常态 text-3 墨色，按下才转 dangerInk（件 opt-list.css L43-48，
             原型 :active{color:var(--danger-ink)} —— 不做常驻红钮，删除这件事只在按下的那一刻显形） */
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
  /** .opt-row：gap 11 / padding 11 12 / radius 15 */
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
  /** .opt-row.on：去默认 chip 底（由渐变铺），描边转主色 */
  active: {
    backgroundColor: 'transparent',
  },
  /** .opt-row.off */
  dimmed: { opacity: OPTION_ROW.offAlpha },
  /** .opt-ic：30×30 圆角 10 图标底（styles.css L688-690，动作行专用） */
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
  /** 选中中心：直径 18 - 6×2 = 6，1.6px 亮环（CSS inset 语义转 RN 近似） */
  radioCenter: {
    width: OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2,
    height: OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2,
    borderRadius: (OPTION_ROW.radioSize - OPTION_ROW.radioFill * 2) / 2,
    borderWidth: OPTION_ROW.radioCenterRingWidth,
  },
  /** .or-body：flex 1 / gap 3 */
  body: { flex: 1, minWidth: 0, gap: OPTION_ROW.bodyGap },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: OPTION_ROW.versionGap },
  /** .or-body b：14 / 700 */
  name: {
    flexShrink: 1,
    fontSize: FONT_SIZE.rank,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** .or-body b small：10.5 / 600 / text-3 / ui-monospace（styles.css L863 那一族字面就在规则里，
   *  不只字号——版本号「v1.0.0」这类标识符要跟数字位宽对齐，走 theme 的等宽档，两端各取其解） */
  version: {
    flexShrink: 0,
    fontFamily: MONO_FONT_FAMILY,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.semibold,
  },
  /** .or-body em：11 / text-3 / 单行省略 */
  sub: {
    fontSize: FONT_SIZE.caption,
  },
  /** .or-state：gap 5，前置 6px 圆点 */
  state: { flexDirection: 'row', alignItems: 'center', gap: OPTION_ROW.stateGap, flexShrink: 0 },
  stateDot: {
    width: OPTION_ROW.stateDotSize,
    height: OPTION_ROW.stateDotSize,
    borderRadius: OPTION_ROW.stateDotSize / 2,
  },
  /** .or-state 文字：10.5 / 800 */
  stateText: {
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  /** .or-del：28×28 圆角 9 居中，底色 fill-2 + 1px hairline 描边（CSS inset 转真实 border） */
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
