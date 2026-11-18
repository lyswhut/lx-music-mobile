import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_SIZE, FONT_WEIGHT, RECENT_CARD, useTheme } from '@/newui/theme'

import { Art } from '../Art'
import { PlayBadge } from '../PlayBadge'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface RecentCardProps {
  /** 曲名（.rt 单行省略） */
  title: string
  /** 歌手（.rs 单行省略，三级字色） */
  subtitle: string
  /** 封面种子（无图时决定渐变与纹理） */
  artSeed: string
  /** 封面图地址 */
  artUri?: string
  /** 卡宽，默认 RECENT_CARD.width（112）；「我的歌单」等其他横滑排可覆盖 */
  width?: number
  onPress?: () => void
}

/**
 * 继续收听卡（对应原型 .recent-card，styles.css L203-207）：方封面 + 播放角标 + 曲名 / 歌手。
 * 纯展示组件；「再次播放」的副作用由容器接线（原型 c.onclick = () => play(s, recentIds())）。
 */
export const RecentCard = memo(
  ({ title, subtitle, artSeed, artUri, width = RECENT_CARD.width, onPress }: RecentCardProps) => {
    const theme = useTheme()
    // `.recent-card:active{transform:scale(.95)}`（styles.css L232），过渡 `.2s` 即 MOTION.fast
    const pressFx = usePressFx({ scale: RECENT_CARD.pressScale })
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[styles.root, { width }, pressFx.animatedStyle]}
      >
        <Art width={width} height={width} seed={artSeed} imageUri={artUri} scrim>
          <PlayBadge />
        </Art>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.text3 }]}>
          {subtitle}
        </Text>
      </AnimatedPressable>
    )
  },
)

RecentCard.displayName = 'NewUIRecentCard'

const styles = StyleSheet.create({
  /** 宽度由 props 决定（.recent-card width:112px），保证标题不会把卡撑宽 */
  root: {
    flexShrink: 0,
  },
  /** .rt 12.5px / 700，上边距 8（原型无字距）。
   * QA 2026-10-14 首页 D-05：原型卡片本体是 <button>（app.js L272），
   * 浏览器默认 text-align:center——.rt/.rs 两行视觉居中，RN Text 默认左对齐要显式补 */
  title: {
    marginTop: RECENT_CARD.titleMarginTop,
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  /** .rs 11px / text-3，上边距 2（同样吃 button 默认居中，见上） */
  subtitle: {
    marginTop: RECENT_CARD.subMarginTop,
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
  },
})
