import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { BUTTON, PL_LAYER, RADIUS } from '@/newui/theme'

import { GhostButton } from '../GhostButton'
import { IconButton } from '../IconButton'

export interface PlActionsProps {
  /** 「播放全部」钮文案（容器拼好：原型 `播放全部 N 首`，首批未取回时的计数口径在容器） */
  playAllLabel: string
  onPlayAll: () => void
  /** 随机钮无障碍文案（容器传 NEW_UI_PLD_LABELS.shuffle） */
  shuffleLabel: string
  onShuffle: () => void
}

/**
 * 歌单详情层操作排（对应原型 `.pl-actions`，index.html L383 / styles.css L478-482，
 * parts/songlist-detail/pl-actions.{html,css}，U69）：「播放全部」ghost 钮占满剩余宽
 *（.pl-actions .ghost-btn flex:1，margin-top 归零）+ 42 方形随机钮（.icon-btn 42×42 /
 * 圆角 14 / 图标 19，底色走 IconButton 缺省档）。
 * 原型里本排是空壳 div 由 openPlaylist 现填（app.js L985-1000）：文案在 PLD_LABELS.playAll
 *（「播放全部」+ 可播数），固定文案与计数口径由容器传入。
 * 结构自 screens/SonglistDetail/SonglistDetailScreen 内联抽出（2026-10-15 拆件转正轮）：
 * 样式逐值照搬原内联定义（边距 18/16、gap 8 全在 PL_LAYER 令牌），渲染零变化。
 * 「播放全部」走实心档（.ghost-btn.solid，parts/_base.css L202 / L204，源 styles.css
 * L330-L331）：这一页唯一的主动作铺品牌渐变，旁边随机钮仍留次级控件底；
 * `.ghost-btn` 原子默认档不动（首页与榜单页那两枚仍是灰底）。
 * 纯展示组件：文案与回调由容器传入，不读任何状态。
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
  /** .pl-actions gap:8 margin:18px 0 16px */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PL_LAYER.actionsGap,
    marginTop: PL_LAYER.actionsMarginTop,
    marginBottom: PL_LAYER.actionsMarginBottom,
  },
  /** .pl-actions .ghost-btn flex:1 */
  playAll: {
    flex: 1,
    minWidth: 0,
  },
})
