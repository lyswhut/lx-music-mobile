import { memo } from 'react'
import { Image, StyleSheet } from 'react-native'

import { RANK_COVER_ASSETS } from './coverAssets'

export interface RankCoverProps {
  /** 封面 key（= new_design/rank-covers/ 的文件名，由 const 的 rankCoverKey 那张判据表按榜名命中） */
  coverKey: string
  /** 宿主盒的宽高（ChartArt 算好的那两值，原样传下来） */
  width: number
  height: number
}

/**
 * 真实榜单封面（原型 app.js chartFace 的 `<img class="rk-emblem">` 那一支）：
 * 铺满宿主卡的一整张图，几何与 `.rk-emblem`（position:absolute / inset:0 / 100%×100%）同款。
 * 尺寸**显式传进来**而不是靠 `StyleSheet.absoluteFill` 四条 inset 反推：装机上那样 `Image` 会按位图
 * 原始尺寸（512）出图，卡比图小就只露出封面左上角那一块（2026-10-22 用户装机反馈）。
 * ./covers/<key>.webp 由生成脚本从原型那侧的无损 PNG 母图压出来（q85；母图 49 张合计 17.03 MB，
 * 原样进包会把 APK 从 13.9 MB 顶到 32 MB）。require 经 Metro 打进 APK —— 装了就能看，不连 dev server，
 * 也不引 react-native-svg 的位图分支。
 * resizeMode 用 stretch 对齐浏览器 `<img>` 缺省的 `object-fit: fill`（卡是正方、图也是正方，等比不变形）。
 * 纯展示组件：不查榜名（key 由外层给）、不画文字（那两行白字在 ChartArt 里）。
 * key 从哪来（判据命中 / 命不中落 RANK_COVER_DEFAULT 兜底那张）都由外层 ChartArt 定，这里只管按 key 铺图。
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
  /** .rk-emblem 的 inset:0 —— 左上角钉住 + 上面那两个显式尺寸，等价铺满 */
  root: { left: 0, position: 'absolute', top: 0 },
})
