import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { NEW_UI_IMG_HTTP_HEADERS } from '@/newui/const'
import { ART_INK, GRADIENTS, MOTION, RADIUS, useTheme } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Icon, type IconName } from '../Icon'

import { ArtTexture, pickArtPalette } from './artTexture'

/** 无图占位的品牌默认渐变 */
const DEFAULT_PALETTE: readonly [string, string] = [GRADIENTS.art.colors[0], GRADIENTS.art.colors[1]]

/** 淡入缓动，与全站 MOTION.easing 同一曲线 */
const ART_FADE_EASE = Easing.bezier(
  MOTION.easing[0],
  MOTION.easing[1],
  MOTION.easing[2],
  MOTION.easing[3],
)

/**
 * 已淡入过的 uri 记账（模块级，不随组件卸载消失）：列表回收复用时同一张图只淡一次。
 * 条数封顶，超了清空重来（丢的只是「不再淡」这层记忆）。
 */
const ART_FADED_URIS = new Set<string>()
const ART_FADED_LIMIT = 512

export interface ArtProps {
  width: number
  height: number
  /** 圆角，默认 12 */
  radius?: number
  /** 程序化封面种子（如 'album:' + 专辑名）：由种子推导渐变与纹理，优先于 palette */
  seed?: string
  /** 无图时的对角渐变首尾色，默认品牌粉紫；有 seed 时被覆盖 */
  palette?: readonly [string, string]
  /** 封面图 URI；给定时渲染图片，否则为渐变底 */
  imageUri?: string
  /** 无图时的居中占位图标 */
  icon?: IconName
  /** 占位图标边长；不传时取短边 46% */
  iconSize?: number
  /** 图片底部压暗遮罩（仅随图渲染），图上叠文字时开启 */
  scrim?: boolean
  /** 覆盖层内容（角标 / 徽标 / 播放态等） */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 封面原语：渐变底 + 程序化纹理 + 可选图片 / 底部压暗 / 居中图标。
 * 全站封面统一走它，保证视觉一致。
 */
export const Art = memo(
  ({
    width,
    height,
    radius = RADIUS.s,
    seed,
    palette = DEFAULT_PALETTE,
    imageUri,
    icon,
    iconSize,
    scrim = false,
    children,
    style,
  }: ArtProps) => {
    const theme = useTheme()
    const hasImage = imageUri != null && imageUri.length > 0
    // 图片加载失败（CDN 403、断网、坏链）时按「无图」回落种子占位，不自动重试：一次挂载一次请求。
    const [loadFailed, setLoadFailed] = useState(false)
    // onLoadEnd 成功与失败都会回调，失败那一次不能记成「淡过」；state 异步，这里留一个同步的账。
    const failedRef = useRef(false)
    // 图片显影后底层渐变已不可见，整层卸掉；列表回收时以「已显影」起手。
    const [bgHidden, setBgHidden] = useState(
      imageUri != null && imageUri.length > 0 && ART_FADED_URIS.has(imageUri),
    )
    useEffect(() => {
      failedRef.current = false
      setLoadFailed(false)
      setBgHidden(imageUri != null && imageUri.length > 0 && ART_FADED_URIS.has(imageUri))
    }, [imageUri])
    const showImage = hasImage && !loadFailed
    // 有 seed：色板与纹理全部由种子决定（palette 仅供无 seed 的纯色场景）
    const triple = seed != null && seed.length > 0 ? pickArtPalette(seed) : null
    const c1 = triple ? triple[0] : palette[0]
    const c2 = triple ? triple[1] : palette[1]

    /**
     * 图片加载完成后的淡入（网络图解码完硬切会「啪」地换脸）。
     * 初值按这张 uri 是否淡过：新图从 0 起淡，淡过的直接落 1；底下渐变始终铺满，不会白闪。
     */
    const imageFade = useRef(new Animated.Value(
      imageUri != null && ART_FADED_URIS.has(imageUri) ? 1 : 0,
    )).current
    // 换封面 / 回收复用换了图：重新按新 uri 的那一档复位，别把上一张的 1 带过来
    useEffect(() => {
      imageFade.stopAnimation()
      imageFade.setValue(imageUri != null && ART_FADED_URIS.has(imageUri) ? 1 : 0)
      // 卸载时停掉补间
      return () => { imageFade.stopAnimation() }
    }, [imageFade, imageUri])

    const handleLoadEnd = useCallback(() => {
      if (imageUri == null || imageUri.length === 0) return
      if (failedRef.current) return
      // 同一张图可能同时挂在两处：另一处先淡完已记账，这里把自己的值补到 1，否则会停在 0（看不见图）
      if (ART_FADED_URIS.has(imageUri)) {
        imageFade.setValue(1)
        setBgHidden(true)
        return
      }
      if (ART_FADED_URIS.size >= ART_FADED_LIMIT) ART_FADED_URIS.clear()
      ART_FADED_URIS.add(imageUri)
      Animated.timing(imageFade, {
        toValue: 1,
        duration: MOTION.artFade,
        easing: ART_FADE_EASE,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // 显影完成才撤占位底；换图/卸载时 stopAnimation 会以 finished=false 收尾，不会误撤
        if (finished) setBgHidden(true)
      })
    }, [imageFade, imageUri])
    // 纹理与渐变都是占位底：纹理只在无图时挂，渐变在图片显影后卸掉（bgHidden）。
    return (
      <View
        style={[
          { width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: c1 },
          style,
        ]}
      >
        {(!bgHidden || !showImage) && (
          <LinearGradient
            colors={[c1, c2]}
            start={GRADIENTS.art.start}
            end={GRADIENTS.art.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        {!showImage && triple != null && seed != null && <ArtTexture seed={seed} palette={triple} />}
        {/* 图与压暗遮罩同一层淡入：遮罩跟着图一起现，不然图还半透时那层黑先糊上去 */}
        {showImage && (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: imageFade }]}>
            <Image
              source={{ uri: imageUri, headers: NEW_UI_IMG_HTTP_HEADERS }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoadEnd={handleLoadEnd}
              onError={() => {
                failedRef.current = true
                setLoadFailed(true)
                setBgHidden(false)
              }}
            />
            {scrim && (
              <LinearGradient
                // 渐隐终点用同一基色（veil 黑）的零透明，不用 'transparent'：
                // Android 会把 'transparent' 当纯黑，中间档插向纯黑会糊出黑块
                colors={[theme.colors.artScrim, withAlpha(ART_INK.veil, ART_INK.scrimMidAlpha), withAlpha(ART_INK.veil, 0)]}
                locations={[0, 0.46, 1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
          </Animated.View>
        )}
        {!showImage && icon != null && (
          <View style={styles.center}>
            <Icon
              name={icon}
              size={iconSize ?? Math.round(Math.min(width, height) * 0.46)}
              color={ART_INK.fg}
            />
          </View>
        )}
        {children}
      </View>
    )
  },
)

Art.displayName = 'NewUIArt'

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
