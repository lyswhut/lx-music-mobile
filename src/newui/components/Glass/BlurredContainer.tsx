import { memo } from 'react'
import { Platform, StyleSheet, UIManager, View } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import LinearGradient from 'react-native-linear-gradient'

import { GLASS_PERF, useTheme, type GlassLayerSpec } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

/**
 * 原生模糊模块是否已注册（降级判定之一，模块加载期探测一次即可）：
 * Android 视图名 AndroidBlurView（oldarch ViewManager），iOS 为 BlurView。
 * 为 false 的场景：JS bundle 跑在尚未集成该原生模块的旧安装包、或某端 autolink 失效。
 * 此时所有玻璃位退回「不透明表面色底层」= 2026-10-12 已验收的分层形态，
 * 不崩、不空白、不与背后内容糊成一片（尤其 Minibar 的旧修复不回退）。
 * 2026-10-14 第 14 轮起导出复用：Sheet 遮罩直挂 BlurView（降级形态是纯半透明黑而非
 * 不透明底，与本组件的降级语义不同，故不走 BlurredContainer 本体，只共用这颗探测位）。
 */
export const blurNativeRegistered = (() => {
  try {
    return UIManager.getViewManagerConfig(Platform.OS === 'android' ? 'AndroidBlurView' : 'BlurView') != null
  } catch {
    return false
  }
})()

export interface BlurredContainerProps {
  /** 本位点的玻璃规格（blur 半径 / tint 基色与 alpha 档 / 方向 / 降级底色），一律取自 theme.GLASS */
  spec: GlassLayerSpec
  /**
   * 真模糊总开关（降级判定之二）：默认跟随原生模块探测结果；
   * 设备验收若证实 Android 滚动掉帧等 BlurView 已知坑，位点侧传 false 即可单点退回，不动其它玻璃位。
   */
  enabled?: boolean
}

/**
 * 毛玻璃背景层（共通件，对应原型各浮层的 backdrop-filter + background rgba/gradient）：
 * 渲染在宿主表面（TabBar / TopBar / Minibar）内部最底层，作为 absoluteFill 铺底：
 *  1. 优先真模糊：BlurView 出「窗后内容」的模糊像（iOS 按主题选 dark/light 材质，
 *     Android 关 overlay 染色、autoUpdate 跟随滚动刷新）；
 *  2. 其上统一叠「半透明染色渐变层」，参数即 CSS background 的 alpha 档（两平台同构）；
 *  3. 真模糊不可用时只换第 1 步为不透明表面底色，染色层与其余结构不变 —— 视觉退回旧形态。
 * 整层 pointerEvents="none"：只做背景，不抢任何点击命中（层叠关系由各宿主保持 Z_LAYER 原值）。
 */
export const BlurredContainer = memo(({ spec, enabled = true }: BlurredContainerProps) => {
  const theme = useTheme()
  const fallbackColor = theme.colors[spec.fallbackBase]
  const useBlur = enabled && blurNativeRegistered

  // CSS background 的 rgba 档 → 「色板基色 × alpha」序列（浅深两套自动跟随，无写死色值）；
  // spec 省略 tintAlphas 时染色直取 colors[tintBase] 原值（token 自带主题各自的 alpha，如 glassPatch）。
  // 该染色层在「真模糊」与「降级实底」两条路径下是同一个 View 序列，token 天然同源。
  const tintColors =
    spec.tintAlphas == null
      ? [theme.colors[spec.tintBase]]
      : spec.tintAlphas.map(alpha => withAlpha(theme.colors[spec.tintBase], alpha))
  const gradientColors =
    tintColors.length === 1 ? [tintColors[0] as string, tintColors[0] as string] : tintColors

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {useBlur ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurAmount={spec.intensity}
          blurType={theme.scheme}
          // Android：染色完全交给下面的 tint 层，关掉库自带的 overlay；
          // 是否逐帧重采样身后内容由 theme.GLASS_PERF.androidAutoUpdate 统一决定
          // （2026-10-15 性能轮：常驻三块玻璃位每帧重采样是 Android 滚动掉帧的头号来源，
          //   开关口径与注释见 tokens.ts GLASS_PERF，要回到「实时模糊」只改那一处）
          // iOS：系统「降低透明度」时原生自动落到的纯色兜底
          {...(Platform.OS === 'android'
            ? { overlayColor: 'transparent', autoUpdate: GLASS_PERF.androidAutoUpdate }
            : { reducedTransparencyFallbackColor: fallbackColor })}
        />
      ) : (
        // 降级保险：不透明表面底（与内容分层，不糊成一片）
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackColor }]} />
      )}
      <LinearGradient
        colors={gradientColors}
        locations={spec.tintLocations == null ? undefined : [...spec.tintLocations]}
        start={spec.start}
        end={spec.end}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
})

BlurredContainer.displayName = 'NewUIBlurredContainer'
