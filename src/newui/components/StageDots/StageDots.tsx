import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { PLAYER, useTheme } from '@/newui/theme'

export interface StageDotsProps {
  /** 当前是否处于歌词态（对应原型 .player-layer.lyric-on）：假 = 唱片态，第 1 枚为胶囊 */
  lyricOn: boolean
}

/**
 * 舞台下方两枚指示点（对应原型 .stage-dots，index.html L323 / styles.css L634-638）：
 * 唱片 ↔ 歌词横滑翻页的纯视觉提示（原型 aria-hidden，不挂点击）。
 * 原型带 width/opacity .25s 过渡，RN 侧未引入动画依赖，暂为即时切换。
 * 原型横屏/Pad 隐藏是「唱片与歌词同屏、不存在翻页」，RN 固定竖屏 → 常显。
 * 纯展示组件：只接 lyricOn，颜色取 currentColor 语义 = theme.colors.text。
 */
export const StageDots = memo(({ lyricOn }: StageDotsProps) => {
  const theme = useTheme()
  const dot = (active: boolean) => (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: theme.colors.text,
          opacity: active ? 1 : PLAYER.stageDotIdleOpacity,
          width: active ? PLAYER.stageDotActiveWidth : PLAYER.stageDotSize,
        },
      ]}
    />
  )
  return (
    <View style={styles.row} pointerEvents="none">
      {dot(!lyricOn)}
      {dot(lyricOn)}
    </View>
  )
})

StageDots.displayName = 'NewUIStageDots'

const styles = StyleSheet.create({
  /** .stage-dots：居中 gap 6 / margin -4 0 2 */
  row: {
    marginTop: PLAYER.stageDotsMarginTop,
    marginBottom: PLAYER.stageDotsMarginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.stageDotsGap,
  },
  /** .stage-dots i：5×5 胶囊底（border-radius 999），当前态只改宽度 */
  dot: {
    height: PLAYER.stageDotSize,
    borderRadius: PLAYER.stageDotSize / 2,
  },
})
