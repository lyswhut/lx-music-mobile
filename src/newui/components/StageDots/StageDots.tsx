import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { PLAYER, useTheme } from '@/newui/theme'

export interface StageDotsProps {
  /** 当前是否处于歌词态：假 = 唱片态，第 1 枚为胶囊 */
  lyricOn: boolean
}

/**
 * 舞台下方两枚指示点：唱片 ↔ 歌词横滑翻页的纯视觉提示，不挂点击。
 * 横屏 / Pad 会隐藏（同屏不翻页），RN 固定竖屏故常显。纯展示组件。
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
  row: {
    marginTop: PLAYER.stageDotsMarginTop,
    marginBottom: PLAYER.stageDotsMarginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.stageDotsGap,
  },
  /** 当前态只改宽度 */
  dot: {
    height: PLAYER.stageDotSize,
    borderRadius: PLAYER.stageDotSize / 2,
  },
})
