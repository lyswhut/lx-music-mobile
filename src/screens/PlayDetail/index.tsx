import { useEffect, useMemo, useState } from 'react'
import { Image as RNImage, View } from 'react-native'
import { useHorizontalMode, useWindowSize } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import SizeView from '@/components/SizeView'
import StatusBar from '@/components/common/StatusBar'
import ImageBackground from '@/components/common/ImageBackground'
import LinearGradient from '@/components/common/LinearGradient'
import { defaultHeaders } from '@/components/common/Image'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { getCoverColor } from '@/utils/nativeModules/coverColor'

// 封面背景模式下，页面从上到下分为：顶部封面取色 10%、封面图 70%、底部取色渐变 20%
const COVER_TOP_COLOR_RATIO = 0.1
const COVER_IMAGE_HEIGHT_RATIO = 0.7
const COVER_BOTTOM_COLOR_RATIO = 0.2
// 封面图底部渐变过渡高度：颜色由透明渐变到不透明覆盖在封面图底部，避免图片与颜色背景之间出现生硬分界
const COVER_FADE_RATIO = 0.1

const hexToRgb = (hex: string): [number, number, number] => {
  const value = parseInt(hex.replace('#', ''), 16)
  return [(value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]
}

const mixColor = (hex: string, target: [number, number, number], ratio: number): string => {
  const rgb = hexToRgb(hex)
  return '#' + rgb.map((value, i) => Math.round(value + (target[i] - value) * ratio).toString(16).padStart(2, '0')).join('')
}

// 在 #RRGGBB 颜色前附加 alpha 通道（如 '00' 全透明、'FF' 不透明）
const withAlpha = (hex: string, alpha: string): string => {
  return `#${alpha}${hex.replace('#', '')}`
}

// 亮度过低（接近纯黑）的颜色混入白色提亮，避免封面主色过暗时详情页背景看起来是黑屏
const normalizeLuminance = (hex: string, minLuminance: number): string => {
  const rgb = hexToRgb(hex)
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
  if (luminance >= minLuminance) return hex
  const ratio = (minLuminance - luminance) / (1 - luminance)
  return mixColor(hex, [255, 255, 255], ratio)
}

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()
  const bgMode = useSettingValue('playDetail.bgMode')
  const musicInfo = usePlayerMusicInfo()
  const pic = musicInfo?.pic
  const theme = useTheme()
  const windowSize = useWindowSize()
  const [coverColor, setCoverColor] = useState('')
  // 纯色渐变模式：封面图加载完成后才进行取色，保证背景色与当前展示的封面一致
  const [coverReady, setCoverReady] = useState(false)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 切歌时立即重置取色：新封面取色完成前，各颜色区域统一使用默认色，
    // 避免残留上一首的颜色导致底部渐变区域出现深色/黑色
    setCoverColor('')
    setCoverReady(false)
  }, [pic])

  useEffect(() => {
    let cancelled = false
    if ((bgMode !== 'gradient' && bgMode !== 'cover') || !pic) {
      setCoverColor('')
      return
    }
    // 纯色渐变模式需等封面加载完成后再取色；封面背景模式由页面自身展示封面，直接取色
    if (bgMode === 'gradient' && !coverReady) return
    void getCoverColor(pic, defaultHeaders).then(color => {
      if (!cancelled) setCoverColor(color)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [bgMode, pic, coverReady])

  const children = useMemo(() => {
    return isHorizontalMode
      ? <Horizontal componentId={componentId} />
      : <Vertical componentId={componentId} />
  }, [isHorizontalMode, componentId])

  // 以封面主色调为基础，上浅下深的纯色渐变；两种派生颜色都做亮度下限归一化，主色过暗时不会呈现黑屏
  const gradientColors = useMemo(() => {
    if (!coverColor) return null
    return {
      startColor: normalizeLuminance(mixColor(coverColor, [0, 0, 0], 0.1), 0.3),
      endColor: normalizeLuminance(mixColor(coverColor, [0, 0, 0], 0.55), 0.2),
    }
  }, [coverColor])

  const fallbackColor = theme['c-content-background']

  // 无背景模式使用默认 PageContent
  // 注意：其余模式必须保持视图树结构稳定（封面加载/取色结果只更新颜色属性），
  // 否则在页面打开动画期间结构变化会导致 RNN 共享元素转场崩溃
  if (bgMode === 'none') {
    return (
      <PageContent>
        <StatusBar />
        {children}
      </PageContent>
    )
  }

  // 纯色渐变模式：先加载歌曲封面，加载完成后取封面主色，页面背景为以上浅下深的渐变呈现
  // 取色完成前使用默认色；预载图仅用于感知封面加载完成，无视觉呈现
  if (bgMode === 'gradient') {
    return (
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: fallbackColor }}>
        <SizeView />
        <LinearGradient
          startColor={gradientColors?.startColor ?? fallbackColor}
          endColor={gradientColors?.endColor ?? fallbackColor}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: windowSize.height,
            width: windowSize.width,
          }}
        />
        <RNImage
          source={pic ? { uri: pic, headers: defaultHeaders } : undefined}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          onLoad={() => { setCoverReady(true) }}
        />
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <StatusBar />
          {children}
        </View>
      </View>
    )
  }

  // 封面背景模式：顶部为封面取色，中部为封面图（底部渐变过渡），底部为封面颜色的渐变
  const topColorHeight = windowSize.height * COVER_TOP_COLOR_RATIO
  const coverImageHeight = windowSize.height * COVER_IMAGE_HEIGHT_RATIO
  const bottomColorHeight = windowSize.height * COVER_BOTTOM_COLOR_RATIO
  const coverImageTop = topColorHeight
  const bottomColorTop = topColorHeight + coverImageHeight
  const topColor = gradientColors?.startColor ?? fallbackColor
  // 渐变过渡层：覆盖在封面图底部，颜色由透明过渡到不透明，实现图片到颜色背景的柔和衔接
  const fadeHeight = windowSize.height * COVER_FADE_RATIO
  const fadeTop = bottomColorTop - fadeHeight
  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: topColor }}>
      <SizeView />
      <ImageBackground
        style={{
          position: 'absolute',
          left: 0,
          top: coverImageTop,
          width: windowSize.width,
          height: coverImageHeight,
          backgroundColor: fallbackColor,
        }}
        source={pic ? { uri: pic, headers: defaultHeaders } : undefined}
        resizeMode="cover"
      />
      <LinearGradient
        startColor={withAlpha(topColor, '00')}
        endColor={topColor}
        style={{
          position: 'absolute',
          left: 0,
          top: fadeTop,
          width: windowSize.width,
          height: fadeHeight,
        }}
      />
      <LinearGradient
        startColor={gradientColors?.startColor ?? fallbackColor}
        endColor={gradientColors?.endColor ?? fallbackColor}
        style={{
          position: 'absolute',
          left: 0,
          top: bottomColorTop,
          width: windowSize.width,
          height: bottomColorHeight,
        }}
      />
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <StatusBar />
        {children}
      </View>
    </View>
  )
}
