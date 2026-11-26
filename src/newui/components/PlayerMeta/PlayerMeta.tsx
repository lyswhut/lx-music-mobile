import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { PcButton } from '../PcButton'

export interface PlayerMetaProps {
  /** 曲名（无歌时传兜底句） */
  title: string
  /** 歌手行（有专辑「歌手 — 专辑」，无专辑只有歌手） */
  artist: string
  /** 已收藏（心形翻实心亮主色） */
  loved: boolean
  onToggleFav: () => void
}

/**
 * 播放页曲目信息行：左侧曲名 + 歌手行（均单行省略），右侧收藏心钮。纯展示。
 */
export const PlayerMeta = memo(({ title, artist, loved, onToggleFav }: PlayerMetaProps) => {
  const theme = useTheme()
  return (
    <View style={styles.meta}>
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: theme.colors.text2 }]}>
          {artist}
        </Text>
      </View>
      <PcButton kind="fav" name="heart" active={loved} onPress={onToggleFav} />
    </View>
  )
})

PlayerMeta.displayName = 'NewUIPlayerMeta'

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PLAYER.metaGap,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FONT_SIZE.playerTitle,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.normal,
  },
  artist: {
    marginTop: PLAYER.artistMarginTop,
    fontSize: FONT_SIZE.body,
  },
})
