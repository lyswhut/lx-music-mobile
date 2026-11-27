import { memo } from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { PLAYER } from '@/newui/theme'

export interface PlayerBgProps {
  /** 封面种子取到的两色（容器用 `pickArtPalette` 算好，同舞台唱片同一颗种子） */
  colors: readonly [string, string]
}

/**
 * 播放页氛围底：封面种子两色铺满整层、×.45 透明度。
 * 原型带模糊 + 饱和提升，本机未引模糊依赖，降级为纯渐变；纯展示，不吃触摸。
 */
export const PlayerBg = memo(({ colors: [c1, c2] }: PlayerBgProps) => (
  <LinearGradient
    colors={[c1, c2]}
    start={PLAYER.bgStart}
    end={PLAYER.bgEnd}
    style={[StyleSheet.absoluteFill, { opacity: PLAYER.bgOpacity }]}
    pointerEvents="none"
  />
))

PlayerBg.displayName = 'NewUIPlayerBg'
