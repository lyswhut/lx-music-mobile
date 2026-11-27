import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { QTag } from '../QTag'
import { SrcBadge } from '../SongRow'

export interface PlayerSourceProps {
  /** 平台简称；无平台坐标的本地曲不传，角标整颗不渲染 */
  sourceLabel?: string
  /** 平台 tint；缺省用三级文字色 */
  sourceTint?: string
  /** 当前生效音质档标签 */
  qualityLabel: string
  /** 「来自 X 音源」说明句（容器拼好） */
  text: string
}

/**
 * 播放页来源行：平台角标 + 音质标签 + 来源说明句，11px 三级文字色，可换行。纯展示。
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
  row: {
    marginTop: PLAYER.sourceMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PLAYER.sourceGap,
  },
  text: {
    fontSize: FONT_SIZE.caption,
    letterSpacing: LETTER_SPACING.normal,
  },
})
