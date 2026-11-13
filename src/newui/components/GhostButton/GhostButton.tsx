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

/** .ghost-btn.solid:active 的 filter:brightness(.9)（_base L204）——RN 无滤镜，直接压渐变本身 */
const SOLID_PRESS_BRIGHTNESS = 0.9
/** `.ghost-btn:active{transform:scale(.98)}`（styles.css L329） */
const GHOST_PRESS_SCALE = 0.98
/** 实心档常态 / 按压态的品牌渐变三端点（GRADIENTS.brand 的 shade 派生，不另立色） */
const SOLID_COLORS = [...GRADIENTS.brand.colors] as string[]
const SOLID_COLORS_PRESSED = SOLID_COLORS.map(color => shade(color, SOLID_PRESS_BRIGHTNESS))

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface GhostButtonProps {
  /** 文案（.ghost-btn 内文字） */
  label: string
  /** 前置图标，如「播放全部」「随机播放」 */
  icon?: IconName
  onPress?: () => void
  disabled?: boolean
  /** 是否占满交叉轴，默认 true（.ghost-btn width:100%）；.pl-actions 里传 false 并配 style={{ flex: 1 }} */
  fill?: boolean
  /**
   * .ghost-btn.solid（原型 _base.css L202 / L204，源 styles.css L330-L331）：
   * 这一页唯一的主动作铺实心品牌渐变 + onBrand 墨色字 + 主色光晕，按下压暗一档；
   * 缺省 false，原子档（--fill-2 灰底 + 描边）不变。
   */
  solid?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 幽灵按钮（对应原型 .ghost-btn）：首页「播放全部」、歌单详情操作排等次级主操作。
 * 纯展示组件，外边距（原型 margin-top:12px）交由容器布局控制。
 * 实心档（solid，歌单详情「播放全部」）见上面 props 注释：与「我喜欢」卡的实心块
 * 同一套写法（GRADIENTS.brand + theme.colors.onBrand，色板 token，无硬编码十六进制）。
 */
export const GhostButton = memo(
  ({ label, icon, onPress, disabled, fill = true, solid = false, style }: GhostButtonProps) => {
    const theme = useTheme()
    /**
     * `.ghost-btn{transition:.2s var(--ease)}`：原子档按压缩 .98 且底 fill-2 → fill-3，
     * 实心档按压缩 .98 且渐变整条 brightness(.9)。两档共用同一条 200ms 补间。
     *
     * `solid` 是调用点上的静止档位（同一颗钮不会在运行期翻档），所以这条 Value 的 driver
     * 一经确定就不再变：实心档只动 transform / opacity（native），原子档带底色插值（JS）。
     */
    const pressFx = usePressFx({
      scale: GHOST_PRESS_SCALE,
      background: solid ? undefined : { from: theme.colors.fill2, to: theme.colors.fill3 },
    })

    // .ghost-btn.solid：品牌渐变铺底、深色墨、主色光晕；按压 = scale(.98) + brightness(.9)
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
          {/* .ghost-btn.solid:active 的 brightness(.9)：常态渐变不动，盖一层压暗的渐变淡入（同一条补间） */}
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
   * .ghost-btn.solid：box-shadow 被主色光晕整条替换（原型 L330 覆盖 L322 的 inset 描边），
   * 所以实心档去掉 1px 描边；overflow 让渐变裁到 14 圆角上。
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
