import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { QTag } from '../QTag'
import { SrcBadge } from '../SongRow'

export interface PlayerSourceProps {
  /** 平台简称（.src-badge label）；没有平台坐标的曲目（本地曲）不传，角标与其前段整颗不渲染 */
  sourceLabel?: string
  /** 平台 tint；缺省用三级文字色（同 Minibar 口径） */
  sourceTint?: string
  /** 当前生效音质档标签（.q-tag，与顶排面包屑同一颗） */
  qualityLabel: string
  /** 「来自 X 音源」说明句（.ps-from，容器拼好） */
  text: string
}

/**
 * 播放页来源行（对应原型 `.player-source`，index.html L332 / styles.css L628-629，
 * parts/player/player-source.{html,css}，U56）：平台角标 + 音质 .q-tag + 「来自 X 音源」句，
 * 一行 11px text-3 可换行；`margin-top 10` 属于本行自身（原型 `.player-source` 的写法，跟着件走）。
 * 原型是空壳 div、由 paintPlayer 逐段填内容；无平台坐标时不填角标，本件同口径不渲染它。
 * 纯展示组件：文本与 tint 由容器传入。
 */
export const PlayerSource = memo(({ sourceLabel, sourceTint, qualityLabel, text }: PlayerSourceProps) => {
  const theme = useTheme()
  return (
    <View style={styles.row}>
      {sourceLabel != null && (
        <SrcBadge label={sourceLabel} tint={sourceTint ?? theme.colors.text3} />
      )}
      <QTag label={qualityLabel} />
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{text}</Text>
    </View>
  )
})

PlayerSource.displayName = 'NewUIPlayerSource'

const styles = StyleSheet.create({
  /** .player-source：margin-top 10 / gap 7 / 11px / 可换行 */
  row: {
    marginTop: PLAYER.sourceMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PLAYER.sourceGap,
  },
  /** .ps-from：letter-spacing .3 */
  text: {
    fontSize: FONT_SIZE.caption,
    letterSpacing: LETTER_SPACING.normal,
  },
})
