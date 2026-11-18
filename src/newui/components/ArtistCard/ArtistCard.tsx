import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { ARTIST_CARD, FONT_SIZE, FONT_WEIGHT, useTheme } from '@/newui/theme'

import { Art } from '../Art'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface ArtistCardProps {
  /** 歌手名（.artist-card span，单行省略） */
  name: string
  /** 头像种子：决定无图时的渐变与纹理 */
  artSeed: string
  /** 头像图地址；无图时由种子画程序化底 */
  artUri?: string
  onPress?: () => void
}

/**
 * 歌手卡（对应原型 .artist-card，styles.css L285-288）：圆形头像 + 下方名字。
 * 纯展示组件；「点这个歌手做什么」由容器接线（原型是播该歌手在库的那批歌）。
 */
export const ArtistCard = memo(({ name, artSeed, artUri, onPress }: ArtistCardProps) => {
  const theme = useTheme()
  // `.artist-card:active{transform:scale(.93)}`（styles.css L339），过渡 `.2s` 即 MOTION.fast
  const pressFx = usePressFx({ scale: ARTIST_CARD.pressScale })
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.root, pressFx.animatedStyle]}
    >
      <Art
        width={ARTIST_CARD.artSize}
        height={ARTIST_CARD.artSize}
        radius={ARTIST_CARD.artSize / 2}
        seed={artSeed}
        imageUri={artUri}
        icon="user"
      />
      <Text numberOfLines={1} style={[styles.label, { color: theme.colors.text2 }]}>
        {name}
      </Text>
    </AnimatedPressable>
  )
})

ArtistCard.displayName = 'NewUIArtistCard'

const styles = StyleSheet.create({
  /** .artist-card flex:none / width:76px，列排布居中，gap 8 */
  root: {
    width: ARTIST_CARD.width,
    flexShrink: 0,
    alignItems: 'center',
    gap: ARTIST_CARD.gap,
  },
  /** span 11.5px / 600，单行省略（宽度受 .artist-card 限制，原型无字距） */
  label: {
    maxWidth: '100%',
    fontSize: FONT_SIZE.captionLg,
    fontWeight: FONT_WEIGHT.semibold,
  },
})
