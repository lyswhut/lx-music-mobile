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

/** `.icon-btn:active{transform:scale(.9)}`（styles.css L135），过渡 `.2s` 即 `MOTION.fast` */
const ICON_BTN_PRESS_SCALE = 0.9

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface IconButtonProps {
  /** 图标名（对应原型 .icon-btn 内的 .ic） */
  name: IconName
  onPress?: () => void
  /** 边长，默认 34（.icon-btn）；.pl-actions 规格传 BUTTON.iconSizeLg */
  size?: number
  /** 图标尺寸，默认 18；42 规格传 BUTTON.iconIconLg */
  iconSize?: number
  /** 圆角，默认全圆；方形变体（.pl-actions）传 RADIUS.control */
  radius?: number
  /** 选中态（.icon-btn.on / .pl-actions .icon-btn.on）：brand 图标 + brandWash 底 */
  active?: boolean
  /** 加强底（.pl-top / .player-top .icon-btn 的 rgba(255,255,255,.08)） */
  strong?: boolean
  /**
   * 破坏性动作（删除等，2026-10-13 本地歌单删除入口）：图标改用 err 色
   * （与 .op-err 报错行同一颗色），和收藏 / 常规钮一眼分开；底色档位不变，仍按 strong / active 走。
   */
  danger?: boolean
  /**
   * 状态圆点（.pulse-dot）：只有「warn」一档（琥珀告警）。
   * 原型 app.js renderNav L2451-2459 + styles.css L138-144 的口径：
   * 这颗点只表示「有事没办完」，没有常驻绿灯——配好了调用方根本不传这个 prop，整颗不渲染。
   */
  dot?: 'warn'
  /** 图标变换（原型用 .ic transform 表达朝向，如返回 rotate(180deg)、收起 rotate(90deg)） */
  iconStyle?: StyleProp<ViewStyle>
  /** 无障碍标签（图标钮只有图标，需口头说明用途） */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/**
 * .pulse-dot 呼吸扩散环（原型 styles.css L139-146 @keyframes pulse，周期 MOTION.pulse=2200ms）：
 * CSS 用 box-shadow spread 0→7px、alpha .5→0（0%→70%，后 30% 全隐）；RN 无动画 box-shadow，
 * 等价改为一枚同心圆环从点位置放大到终径（dotSize + 2×spread）同时淡出，70% 后停住隐没段。
 * 仓库无 reanimated，沿用 DiscArt / .eq 的既有做法：RN Animated 链式循环，
 * opacity + transform 全程 useNativeDriver。只在 warn 点渲染期间挂载（配好即整颗撤，不留空转循环）。
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
 * 图标按钮（对应原型 .icon-btn）。顶栏音源入口、歌单详情返回 / 收藏、播放页收起等处复用。
 * 纯展示组件：选中态与状态点由容器传入，不发请求、不读 store。
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
    // .icon-btn:active 缩到 .9 并把这段过渡补成 200ms（原型 `.icon-btn{transition:.2s var(--ease)}`）
    const pressFx = usePressFx({ scale: ICON_BTN_PRESS_SCALE })
    /**
     * 触区补到 44：原型只有视觉边（34 / 42），手指按不满。外扩量按缺口一半算
     * （34 → 每边 5、42 → 每边 1），**只加热区**，width/height/圆角与相邻排布一个像素不动。
     * 顶栏那排 gap 是 10、`.pl-actions` 是 8，都比最大外扩 5 宽，不会与邻钮抢点击。
     */
    const hitSlop = Math.max(0, Math.ceil((CONTROL.hitTarget - size) / 2))
    // 底色三档：选中 brandWash > 加强 fill3（.pl-top / .player-top）> 默认 fill2（原型 .icon-btn）
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
            {/* 呼吸环垫在实心点之下：先挂环、再挂点，点始终压在环心（原型 box-shadow 在点外围） */}
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
  /** .pulse-dot：7px 圆点，右上偏移 4px（@keyframes pulse 呼吸扩散见 DotPulse） */
  dot: {
    position: 'absolute',
    top: BUTTON.dotOffset,
    right: BUTTON.dotOffset,
    width: BUTTON.dotSize,
    height: BUTTON.dotSize,
    borderRadius: BUTTON.dotSize / 2,
  },
  /** 呼吸环：与点同心，尺寸/半径/偏移由 DotPulse 按 BUTTON.dotRing* 计算 */
  dotRing: {
    position: 'absolute',
  },
})
