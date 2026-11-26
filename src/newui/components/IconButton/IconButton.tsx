import { memo, useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { BUTTON, CONTROL, MOTION, RADIUS, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压缩放 .9，过渡 .2s */
const ICON_BTN_PRESS_SCALE = 0.9

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface IconButtonProps {
  /** 图标名 */
  name: IconName
  onPress?: () => void
  /** 边长，默认 34；.pl-actions 规格传 BUTTON.iconSizeLg */
  size?: number
  /** 图标尺寸，默认 18；42 规格传 BUTTON.iconIconLg */
  iconSize?: number
  /** 圆角，默认全圆；方形变体（.pl-actions）传 RADIUS.control */
  radius?: number
  /** 选中态：brand 图标 + brandWash 底 */
  active?: boolean
  /** 加强底（.pl-top / .player-top 的 rgba(255,255,255,.08)） */
  strong?: boolean
  /**
   * 破坏性动作（删除等）：图标改用 err 色，与收藏 / 常规钮一眼分开；
   * 底色档位不变，仍按 strong / active 走。
   */
  danger?: boolean
  /**
   * 状态圆点，仅「warn」一档（琥珀告警）：表示「有事没办完」。
   * 不传则整颗不渲染。
   */
  dot?: 'warn'
  /** 图标变换（表达朝向，如返回 rotate(180deg)、收起 rotate(90deg)） */
  iconStyle?: StyleProp<ViewStyle>
  /** 无障碍标签 */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/**
 * .pulse-dot 呼吸扩散环：CSS 用 box-shadow spread 扩散，
 * RN 无动画 box-shadow，改为同心圆环放大同时淡出，全程 useNativeDriver。
 * 只在 warn 点渲染期间挂载，不留空转循环。
 */
const DotPulse = memo(({ color }: { color: string }) => {
  const phase = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: MOTION.pulse,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [phase])
  const ringSize = BUTTON.dotSize + BUTTON.dotRingSpread * 2
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dotRing,
        {
          top: BUTTON.dotOffset - BUTTON.dotRingSpread,
          right: BUTTON.dotOffset - BUTTON.dotRingSpread,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: color,
          opacity: phase.interpolate({
            inputRange: [0, BUTTON.dotRingPhase, 1],
            outputRange: [BUTTON.dotRingAlpha, 0, 0],
          }),
          transform: [
            {
              scale: phase.interpolate({
                inputRange: [0, BUTTON.dotRingPhase, 1],
                outputRange: [BUTTON.dotSize / ringSize, 1, 1],
              }),
            },
          ],
        },
      ]}
    />
  )
})

DotPulse.displayName = 'NewUIIconButtonDotPulse'

/**
 * 图标按钮：顶栏音源入口、歌单详情返回 / 收藏、播放页收起等处复用。
 * 纯展示组件：选中态与状态点由容器传入。
 */
export const IconButton = memo(
  ({
    name,
    onPress,
    size = BUTTON.iconSize,
    iconSize = BUTTON.iconIcon,
    radius = RADIUS.full,
    active = false,
    strong = false,
    danger = false,
    dot,
    iconStyle,
    accessibilityLabel,
    style,
  }: IconButtonProps) => {
    const theme = useTheme()
    // 按压缩到 .9，过渡 200ms
    const pressFx = usePressFx({ scale: ICON_BTN_PRESS_SCALE })
    /**
     * 触区补到 44：原型视觉边只有 34 / 42，手指按不满。
     * **只加热区**，宽高 / 圆角 / 相邻排布一个像素不动。
     */
    const hitSlop = Math.max(0, Math.ceil((CONTROL.hitTarget - size) / 2))
    // 底色三档：brandWash > fill3（加强）> fill2（默认）
    const backgroundColor = active
      ? theme.colors.brandWash
      : strong
        ? theme.colors.fill3
        : theme.colors.fill2
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlop}
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[
          styles.root,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor,
            borderColor: theme.colors.hairline,
          },
          pressFx.animatedStyle,
          style,
        ]}
      >
        <Icon
          name={name}
          size={iconSize}
          color={danger ? theme.colors.dangerInk : active ? theme.colors.brand : theme.colors.text2}
          style={iconStyle}
        />
        {dot === 'warn' && (
          <>
            {/* 呼吸环垫在实心点之下：先挂环再挂点 */}
            <DotPulse color={theme.colors.brand3} />
            <View pointerEvents="none" style={[styles.dot, { backgroundColor: theme.colors.brand3 }]} />
          </>
        )}
      </AnimatedPressable>
    )
  },
)

IconButton.displayName = 'NewUIIconButton'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  /** 状态圆点：右上偏移 */
  dot: {
    position: 'absolute',
    top: BUTTON.dotOffset,
    right: BUTTON.dotOffset,
    width: BUTTON.dotSize,
    height: BUTTON.dotSize,
    borderRadius: BUTTON.dotSize / 2,
  },
  /** 呼吸环：与点同心，尺寸由 DotPulse 计算 */
  dotRing: {
    position: 'absolute',
  },
})
