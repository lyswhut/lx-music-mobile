import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, PL_CARD, RADIUS, useTheme } from '@/newui/theme'

import { Art } from '../Art'
import { PlayBadge } from '../PlayBadge'

export interface PlCardProps {
  /** 单卡宽度（封面为 1:1，由容器算出） */
  width: number
  /** 歌单名（最多两行） */
  title: string
  /** 封面种子（决定无图时的渐变与纹理） */
  artSeed: string
  /** 封面图地址 */
  artUri?: string
  /** 元信息行文案（如「128.4万 播放 · 30 首」）；空则不渲染 */
  meta?: string
  /** 元信息前小圆点颜色（平台 tint）；不传则不渲染圆点 */
  tint?: string
  /** 封面播放角标，默认 true；自建歌单卡不叠角标 */
  badge?: boolean
  onPress?: () => void
}

/**
 * 歌单卡：封面 + 播放角标 + 两行标题 + 元信息。
 * 纯展示组件，摆位由 CardGrid 负责。
 */
export const PlCard = memo(({ width, title, artSeed, artUri, meta, tint, badge = true, onPress }: PlCardProps) => {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[styles.root, { width }]}
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
    </Pressable>
  )
})

PlCard.displayName = 'NewUIPlCard'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
  },
  /** 标题预留两行高度，避免长短标题把下列行挤歪；水平居中 */
  title: {
    marginTop: PL_CARD.titleMarginTop,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE.body * PL_CARD.titleLineHeightRatio,
    minHeight: FONT_SIZE.body * PL_CARD.titleLineHeightRatio * PL_CARD.titleLines,
    textAlign: 'center',
  },
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
