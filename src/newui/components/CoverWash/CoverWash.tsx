import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { COVER_WASH, Z_LAYER } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

export interface CoverWashProps {
  /** 封面种子取到的两色（`pickArtPalette` 的结果） */
  colors: readonly [string, string]
  /** 峰值透明度（`PL_LAYER.bgAlpha` / `PLAYER.bgOpacity`） */
  alpha: number
  /**
   * 铺底高度占整层比例。缺省 1 = 整层铺底（四边出血）；
   * 小于 1 = 只铺顶部一段，此时下沿自动纵向渐隐到 0。
   */
  heightRatio?: number
  /** 整层铺底时的渐变方向（由调用方给 PLAYER token）；局部铺底恒为纵向渐隐 */
  start?: { readonly x: number, readonly y: number }
  end?: { readonly x: number, readonly y: number }
}

/**
 * 封面氛围底纹：纯渐变铺底（不引模糊依赖），显式压在内容之下且不吃触摸；
 * 局部铺底时下沿渐隐，避免「高度整齐的色块」被读成蒙板。纯展示组件。
 */
export const CoverWash = memo(({
  colors: [c1, c2],
  alpha,
  heightRatio = 1,
  start = COVER_WASH.artStart,
  end = COVER_WASH.artEnd,
}: CoverWashProps) => {
  const partial = heightRatio < 1
  // 局部铺底：纵向三段衰减（峰值 → 中段 → 0），消除色块硬边；整层铺底：两色对角平铺
  const washColors = partial
    ? [
      withAlpha(c1, alpha * COVER_WASH.fadeAlphaRatios[0]),
      withAlpha(c2, alpha * COVER_WASH.fadeAlphaRatios[1]),
      withAlpha(c2, alpha * COVER_WASH.fadeAlphaRatios[2]),
    ]
    : [withAlpha(c1, alpha), withAlpha(c2, alpha)]
  // 渐变的 locations 要可变数组（token 块整体 as const，这里是唯一的取值转换点）
  const locations = partial ? [...COVER_WASH.fadeLocations] : undefined

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        { zIndex: Z_LAYER.wash },
        partial ? { height: `${Math.round(heightRatio * 100)}%` } : undefined,
      ]}
    >
      <LinearGradient
        colors={washColors}
        locations={locations}
        start={partial ? COVER_WASH.fadeStart : start}
        end={partial ? COVER_WASH.fadeEnd : end}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
})

CoverWash.displayName = 'NewUICoverWash'

const styles = StyleSheet.create({
  /** 绝对定位铺满（局部铺底时高度由 props 覆盖） */
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
