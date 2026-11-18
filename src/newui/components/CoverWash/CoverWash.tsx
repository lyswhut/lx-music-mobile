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
   * 铺底高度占整层的比例。缺省 1 = 整层铺底（原型 `.player-bg` inset:0，四边出血没有硬边可言）；
   * 小于 1 = 只铺顶部一段（原型 `.pl-bg` height:56%），此时下沿自动纵向渐隐到 0。
   */
  heightRatio?: number
  /** 整层铺底时的渐变方向（原型 140deg 的降级近似，由调用方给 PLAYER token）；局部铺底恒为纵向渐隐 */
  start?: { readonly x: number, readonly y: number }
  end?: { readonly x: number, readonly y: number }
}

/**
 * 封面氛围底纹（原型 `.pl-bg` styles.css L403 / `.player-bg` L513）。
 * 原型这层是「封面色渐变 + blur(64/70px) + saturate + scale(1.4/1.5)」，模糊天然把边界抹平；
 * 本机不引模糊依赖，降级为纯渐变铺底，于是必须补两件事，否则在真机上会被读成
 * 盖在内容上的一层蒙板（2026-10-12 走查现象 1「歌单详情上半部有顶层蒙板」）：
 * 1. **显式压在内容之下**：`zIndex` 走 `Z_LAYER.wash`（原型 z-index:0，与内容侧的
 *    `Z_LAYER.layerContent` 成对，对应 `.pl-layer > *` 的 z-index:1），不靠 JSX 声明顺序赌平台绘制顺序。
 * 2. **整层不吃触摸**：外层是普通 View 并标 `pointerEvents="none"`，由这层兜住命中；
 *    内部渐变体是第三方原生视图，其触摸透明不保证被平台转发（同轮走查现象 2「心钮点不动」的怀疑点）。
 * 3. **局部铺底时下沿渐隐**：三段衰减到 0（COVER_WASH.fadeLocations / fadeAlphaRatios），
 *    把「高度整齐的色块」变回原型那种无定形氛围底纹，保住封面氛围又不像蒙板。
 * 纯展示组件：种子取色与铺底比例由容器算好后传入。
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
  /** .pl-bg / .player-bg position:absolute（局部铺底时高度由 props 覆盖） */
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
