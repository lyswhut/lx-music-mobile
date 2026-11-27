import { memo } from 'react'
import { Platform, StyleSheet, UIManager, View } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import LinearGradient from 'react-native-linear-gradient'

import { GLASS_PERF, useTheme, type GlassLayerSpec } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

/**
 * 原生模糊模块是否已注册（Android 视图名 AndroidBlurView，iOS 为 BlurView）。
 * 为 false 时所有玻璃位退回不透明表面色底层，不崩、不空白。
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
   * 真模糊总开关，默认跟随原生模块探测结果；
   * 位点侧可传 false 单点降级，不动其它玻璃位。
   */
  enabled?: boolean
}

/**
 * 毛玻璃背景层：真模糊（BlurView）+ 半透明染色渐变；无原生模块时降级为不透明表面底。
 * 渲染在宿主内部最底层，整层 pointerEvents="none"，不抢点击。
 */
export const BlurredContainer = memo(({ spec, enabled = true }: BlurredContainerProps) => {
  const theme = useTheme()
  const fallbackColor = theme.colors[spec.fallbackBase]
  const useBlur = enabled && blurNativeRegistered

  // 染色层 = 色板基色 × alpha；真模糊与降级两条路径共用同一 View 序列。
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
          // Android：染色交给下面的 tint 层，关掉库自带 overlay；
          // 逐帧重采样由 GLASS_PERF.androidAutoUpdate 统一决定。iOS：系统「降低透明度」时的兜底色。
          {...(Platform.OS === 'android'
            ? { overlayColor: 'transparent', autoUpdate: GLASS_PERF.androidAutoUpdate }
            : { reducedTransparencyFallbackColor: fallbackColor })}
        />
      ) : (
        // 降级：不透明表面底
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
