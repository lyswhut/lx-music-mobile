import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { PcButton } from '../PcButton'

export interface PlayerMetaProps {
  /** 曲名（容器传曲目名，无歌时传兜底句） */
  title: string
  /** 歌手行（容器拼好：有专辑「歌手 — 专辑」，无专辑只有歌手） */
  artist: string
  /** 已收藏（`.pc.fav.on`：心形翻实心亮主色） */
  loved: boolean
  onToggleFav: () => void
}

/**
 * 播放页曲目信息行（对应原型 `.player-meta`，index.html L325-331 / styles.css L619-627，
 * parts/player/player-meta.{html,css}，U55）：左侧 `.player-info` 两行（曲名 21px/900、
 * 歌手行 13px text-2，均单行省略），右侧 `.pc.fav` 收藏心钮（40px 盒 / 24px 图标，
 * 已收藏亮主色，按压 scale(.93) 由 PcButton 承担；原型 `.pc.fav.on .ic` 的 pop 动画 RN 侧未做，维持现状）。
 * 纯展示组件：曲名 / 歌手 / 收藏态与回调由容器传入，收藏读的仍是既有喜欢列表链路。
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
  /** .player-meta gap 12 */
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PLAYER.metaGap,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  /** .player-info h3：21 / 900 / letter-spacing .3（字号令牌 FONT_SIZE.playerTitle） */
  title: {
    fontSize: FONT_SIZE.playerTitle,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.normal,
  },
  /** .player-artist：13 / text-2 / margin-top 5 */
  artist: {
    marginTop: PLAYER.artistMarginTop,
    fontSize: FONT_SIZE.body,
  },
})
