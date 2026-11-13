import { memo } from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { PLAYER } from '@/newui/theme'

export interface PlayerBgProps {
  /** 封面种子取到的两色（容器用 `pickArtPalette` 算好，同舞台唱片同一颗种子） */
  colors: readonly [string, string]
}

/**
 * 播放页氛围底（对应原型 `.player-bg`，index.html L311 / styles.css L585，
 * parts/player/player-bg.{html,css}，U50）：封面种子两色铺满整层、× .45 透明度。
 * 原型这层是「140deg 渐变 + blur(70px) + saturate(150%) + scale(1.4)」，本机不引模糊依赖，
 * 自 2026-10-12 起降级为纯渐变（README「已知近似点」原话，与 `.pl-bg` 的 CoverWash 降级同源）。
 * 本件是整层铺底、四边出血，没有局部铺底的下沿渐隐需求，故独立成件、不走 CoverWash。
 * 纯展示组件：只接两色；渐变方向与透明度取 PLAYER token，不吃触摸。
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
