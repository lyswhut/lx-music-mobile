import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { IconButton } from '../IconButton'
import { QTag } from '../QTag'

export interface PlayerTopProps {
  /** 收起钮回调（原型 #playerClose → 播放层收起） */
  onClose: () => void
  /** 收起钮无障碍标签（图标钮只有图形，需口头说明用途） */
  closeLabel: string
  /** 面包屑文字（原型「正在播放」，容器传 const NEW_UI_PLAYER_CRUMB） */
  crumbText: string
  /** 当前生效音质档标签（面包屑末尾的 .q-tag） */
  qualityLabel: string
}

/**
 * 播放页顶排（对应原型 `.player-top` + `.player-crumb`，index.html L312-315 / styles.css L587-589，
 * parts/player/player-top.{html,css}，U51）：左侧一颗收起圆钮（加强底 + 图标 rotate(90deg)）、
 * 中间面包屑（「正在播放」+ 当前音质 .q-tag）、右侧一个 34px 空槽（原型 grid 34/1fr/34 的第三列，
 * 无元素、只为让面包屑保持居中）。
 * `.player-crumb` 的样式定义与歌单详情层 `.pl-top` 的面包屑共用（_base.css 一份），本件只承接播放页这一处。
 * 纯展示组件：文案与回调由容器传入，不读任何状态。
 */
export const PlayerTop = memo(({ onClose, closeLabel, crumbText, qualityLabel }: PlayerTopProps) => {
  const theme = useTheme()
  return (
    <View style={styles.top}>
      <IconButton
        name="chevron"
        strong
        onPress={onClose}
        iconStyle={styles.closeIcon}
        accessibilityLabel={closeLabel}
      />
      <View style={styles.crumb}>
        <Text style={[styles.crumbText, { color: theme.colors.text2 }]}>{crumbText}</Text>
        <QTag label={qualityLabel} />
      </View>
      <View style={styles.topSlot} />
    </View>
  )
})

PlayerTop.displayName = 'NewUIPlayerTop'

const styles = StyleSheet.create({
  /** .player-top grid 34px 1fr 34px */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** 第三列空槽（宽度与左侧圆钮同档） */
  topSlot: {
    width: PLAYER.topRightSlot,
  },
  /** #playerClose .ic{transform:rotate(90deg)}（chevron 朝下 = 收起） */
  closeIcon: {
    transform: [{ rotate: '90deg' }],
  },
  /** .player-crumb：居中 gap 8 / 12px / text-2 / letter-spacing .4 */
  crumb: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.crumbGap,
  },
  crumbText: {
    fontSize: FONT_SIZE.small,
    letterSpacing: LETTER_SPACING.wide,
  },
})
