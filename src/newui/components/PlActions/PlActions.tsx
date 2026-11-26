import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { BUTTON, PL_LAYER, RADIUS } from '@/newui/theme'

import { GhostButton } from '../GhostButton'
import { IconButton } from '../IconButton'

export interface PlActionsProps {
  /** 「播放全部」钮文案（计数由容器拼好） */
  playAllLabel: string
  onPlayAll: () => void
  /** 随机钮无障碍文案 */
  shuffleLabel: string
  onShuffle: () => void
}

/**
 * 歌单详情层操作排：「播放全部」ghost 钮占满剩余宽 + 42 方形随机钮。
 * 「播放全部」走实心品牌渐变档，随机钮留次级控件底。纯展示，文案与回调由容器传入。
 */
export const PlActions = memo(({ playAllLabel, onPlayAll, shuffleLabel, onShuffle }: PlActionsProps) => (
  <View style={styles.row}>
    <GhostButton
      label={playAllLabel}
      icon="play"
      fill={false}
      solid
      style={styles.playAll}
      onPress={onPlayAll}
    />
    <IconButton
      name="shuffle"
      size={BUTTON.iconSizeLg}
      iconSize={BUTTON.iconIconLg}
      radius={RADIUS.control}
      onPress={onShuffle}
      accessibilityLabel={shuffleLabel}
    />
  </View>
))

PlActions.displayName = 'NewUIPlActions'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PL_LAYER.actionsGap,
    marginTop: PL_LAYER.actionsMarginTop,
    marginBottom: PL_LAYER.actionsMarginBottom,
  },
  playAll: {
    flex: 1,
    minWidth: 0,
  },
})
