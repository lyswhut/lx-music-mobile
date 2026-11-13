import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_SIZE, FONT_WEIGHT, PL_CARD, RADIUS, useTheme } from '@/newui/theme'

import { Art } from '../Art'
import { PlayBadge } from '../PlayBadge'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PlCardProps {
  /** 单卡宽度（封面为 1:1，由容器用 gridItemWidth 算出） */
  width: number
  /** 歌单名（.pt，最多两行） */
  title: string
  /** 封面种子（决定无图时的渐变与纹理） */
  artSeed: string
  /** 封面图地址 */
  artUri?: string
  /** 元信息行文案（.ps，如「128.4万 播放 · 30 首」）；空则不渲染 */
  meta?: string
  /** 元信息前小圆点颜色（平台 tint）；不传则不渲染圆点 */
  tint?: string
  /**
   * 封面播放角标（.play-badge），默认 true（原型 plCard / plCardCollected 都带）。
   * 自建歌单卡不带（原型 plCardMine app.js L1276：内置版式封面上不叠角标）。
   */
  badge?: boolean
  onPress?: () => void
}

/**
 * 歌单卡（对应原型 .pl-card，styles.css L232-239）：封面 + 播放角标 + 两行标题 + 元信息。
 * 纯展示组件，摆位由 CardGrid 负责；「推荐歌单 / 我的歌单 / 榜单卡池」共用。
 */
export const PlCard = memo(({ width, title, artSeed, artUri, meta, tint, badge = true, onPress }: PlCardProps) => {
  const theme = useTheme()
  // `.pl-card:active{transform:scale(.96)}`（styles.css L262），过渡 `.2s` 即 MOTION.fast
  const pressFx = usePressFx({ scale: PL_CARD.pressScale })
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.root, { width }, pressFx.animatedStyle]}
    >
      <Art width={width} height={width} radius={RADIUS.s} seed={artSeed} imageUri={artUri} scrim>
        {badge ? <PlayBadge /> : null}
      </Art>
      <Text
        numberOfLines={PL_CARD.titleLines}
        style={[styles.title, { color: theme.colors.text }]}
      >
        {title}
      </Text>
      {meta ? (
        <View style={styles.metaRow}>
          {tint ? <View style={[styles.dot, { backgroundColor: tint }]} /> : null}
          <Text numberOfLines={1} style={[styles.meta, { color: theme.colors.text3 }]}>
            {meta}
          </Text>
        </View>
      ) : null}
    </AnimatedPressable>
  )
})

PlCard.displayName = 'NewUIPlCard'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
  },
  /** .pt 13px / 700 / line-height 1.35 / 预留两行高度。
   * QA 2026-10-14 首页 D-05：原型卡片本体是 <button>（app.js L335），标题视觉居中；
   * .ps 行原型是 display:flex（text-align 对它无效，计算值靠左），meta 保持左对齐不动 */
  title: {
    marginTop: PL_CARD.titleMarginTop,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE.body * PL_CARD.titleLineHeightRatio,
    minHeight: FONT_SIZE.body * PL_CARD.titleLineHeightRatio * PL_CARD.titleLines,
    textAlign: 'center',
  },
  /** .ps 行：11px / text-3，前置 5px tint 圆点 */
  metaRow: {
    marginTop: PL_CARD.metaMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PL_CARD.metaGap,
  },
  meta: {
    flexShrink: 1,
    fontSize: FONT_SIZE.caption,
  },
  dot: {
    width: PL_CARD.dotSize,
    height: PL_CARD.dotSize,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
})
