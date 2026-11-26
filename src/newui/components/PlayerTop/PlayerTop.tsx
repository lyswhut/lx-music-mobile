import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, LETTER_SPACING, PLAYER, useTheme } from '@/newui/theme'

import { IconButton } from '../IconButton'
import { QTag } from '../QTag'

export interface PlayerTopProps {
  /** 收起钮回调 */
  onClose: () => void
  /** 收起钮无障碍标签（图标钮只有图形，需口头说明用途） */
  closeLabel: string
  /** 面包屑文字（「正在播放」） */
  crumbText: string
  /** 当前生效音质档标签（面包屑末尾） */
  qualityLabel: string
}

/**
 * 播放页顶排：收起圆钮 + 「正在播放 · 音质」面包屑 + 右侧同宽空槽（保持面包屑居中）。
 * 纯展示组件，文案与回调由容器传入。
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
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** 第三列空槽（宽度与左侧圆钮同档） */
  topSlot: {
    width: PLAYER.topRightSlot,
  },
  /** chevron 转 90° 朝下 = 收起 */
  closeIcon: {
    transform: [{ rotate: '90deg' }],
  },
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
