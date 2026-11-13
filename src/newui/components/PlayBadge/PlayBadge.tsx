import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { ART_INK, PLAY_BADGE, RADIUS } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Icon, type IconName } from '../Icon'

export interface PlayBadgeProps {
  /** 图标，默认播放三角（原型也用于「继续收听」等再次触发的语义） */
  icon?: IconName
}

/**
 * 封面播放角标（对应原型 .play-badge）：24px 半透明黑圆 + 1px 高光描边。
 * 作为 Art 的 children 使用（封面容器 overflow 会裁掉越界部分）。
 */
export const PlayBadge = memo(({ icon = 'play' }: PlayBadgeProps) => (
  <View style={styles.root}>
    <Icon name={icon} size={PLAY_BADGE.icon} color={ART_INK.fg} style={styles.icon} />
  </View>
))

PlayBadge.displayName = 'NewUIPlayBadge'

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: PLAY_BADGE.offset,
    bottom: PLAY_BADGE.offset,
    width: PLAY_BADGE.size,
    height: PLAY_BADGE.size,
    borderRadius: RADIUS.full,
    backgroundColor: withAlpha(ART_INK.veil, ART_INK.badgeAlpha),
    borderWidth: 1,
    borderColor: withAlpha(ART_INK.fg, ART_INK.chipAlpha),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 三角形视觉居中补偿（原型 .play-badge .ic margin-left:1px） */
  icon: {
    marginLeft: PLAY_BADGE.iconOffset,
  },
})
