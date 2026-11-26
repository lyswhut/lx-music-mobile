import { memo } from 'react'
import { Image, StyleSheet } from 'react-native'

import { RANK_COVER_ASSETS } from './coverAssets'

export interface RankCoverProps {
  /** 封面 key（= new_design/rank-covers/ 的文件名） */
  coverKey: string
  /** 宿主盒的宽高（ChartArt 算好后原样传入） */
  width: number
  height: number
}

/**
 * 真实榜单封面：铺满宿主卡的一整张图。
 * 尺寸必须显式传入——用 absoluteFill 时 Image 会按位图原始尺寸出图，卡比图小就只露左上角。
 * 封面由生成脚本压成 WebP 经 require 打进 APK；key 命中与 default 兜底由外层 ChartArt 决定。
 * 纯展示组件：不查榜名、不画文字。
 */
export const RankCover = memo(({ coverKey, width, height }: RankCoverProps) => {
  const source = RANK_COVER_ASSETS[coverKey]
  if (source == null) return null
  return (
    <Image
      resizeMode="stretch"
      source={source}
      style={[styles.root, { height, width }]}
    />
  )
})

RankCover.displayName = 'NewUIRankCover'

const styles = StyleSheet.create({
  /** 左上角钉住 + 显式宽高，等价铺满宿主 */
  root: { left: 0, position: 'absolute', top: 0 },
})
