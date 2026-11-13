import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { NEW_UI_IMG_HTTP_HEADERS } from '@/newui/const'
import { ART_INK, GRADIENTS, MOTION, RADIUS, useTheme } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Icon, type IconName } from '../Icon'

import { ArtTexture, pickArtPalette } from './artTexture'

/** 无图占位的品牌默认渐变（对应 .art 的 --c1/--c2 缺省值） */
const DEFAULT_PALETTE: readonly [string, string] = [GRADIENTS.art.colors[0], GRADIENTS.art.colors[1]]

/** 淡入缓动与全站 `--ease` 同一条（MOTION.easing） */
const ART_FADE_EASE = Easing.bezier(
  MOTION.easing[0],
  MOTION.easing[1],
  MOTION.easing[2],
  MOTION.easing[3],
)

/**
 * 已经淡入过的 uri（模块级，不随组件卸载消失）。
 * 列表回收复用时同一张图会被反复挂到新单元上，只凭组件内 ref 判不出来——那会变成「每滚一次
 * 就重新淡一次」；按 uri 记账，同一张图这一趟会话里只淡一次，滚回来是「本来就在」。
 * 条数封顶：长会话会攒到几千个 uri，超了就清空重来（丢的只是「不再淡」这一层记忆）。
 */
const ART_FADED_URIS = new Set<string>()
const ART_FADED_LIMIT = 512

export interface ArtProps {
  width: number
  height: number
  /** 圆角，默认 --r-s（12） */
  radius?: number
  /** 程序化封面种子（如 'album:' + 专辑名）：由种子推导渐变与纹理，优先于 palette */
  seed?: string
  /** 无图时的对角渐变首尾色（--c1/--c2），默认品牌粉紫；有 seed 时被覆盖 */
  palette?: readonly [string, string]
  /** 封面图 URI；给定时渲染图片（.art-img），否则为渐变底 */
  imageUri?: string
  /** 无图时的居中占位图标（.ic-center） */
  icon?: IconName
  /** 占位图标边长；不传时按原型的 46%（.art .ic-center .ic）取短边比例 */
  iconSize?: number
  /** 图片底部压暗遮罩（.art-scrim，仅随图渲染），图上叠文字时开启 */
  scrim?: boolean
  /** 覆盖层内容（角标 / 徽标 / 播放态等） */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 封面原语（对应原型 .art）：渐变底 + 程序化纹理 + 可选图片 + 可选底部压暗 + 可选居中图标。
 * 全站封面（歌单卡 / 歌曲行 / 播放页）一律走它，保证视觉一致。
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
    // 2026-10-15 歌单封面走查：网络图加载失败（CDN 防热链 403、断网、坏链）时按「无图」口径
    // 回落种子占位（对齐旧 UI common/Image 的 onError→EmptyPic 与换 url 复位逻辑），
    // 而不是留一块「有图坑位却没图」的素渐变。失败不自动重试：一次挂载一次请求，不轰炸。
    const [loadFailed, setLoadFailed] = useState(false)
    // onLoadEnd 在成功与失败两种收尾都会来（RN 的口径）：失败那一次不许记成「淡过」，
    // 否则同一张图下次挂载若真加载成功就不淡了。state 是异步的，这里留一个同步的账。
    const failedRef = useRef(false)
    useEffect(() => {
      failedRef.current = false
      setLoadFailed(false)
    }, [imageUri])
    const showImage = hasImage && !loadFailed
    // 有 seed：色板与纹理全部由种子决定（palette 仅供无 seed 的纯色场景）
    const triple = seed != null && seed.length > 0 ? pickArtPalette(seed) : null
    const c1 = triple ? triple[0] : palette[0]
    const c2 = triple ? triple[1] : palette[1]

    /**
     * 图片加载完成那一下的淡入（原型是硬切，真机网络图解码完会「啪」地换脸）。
     * 初值按「这张 uri 是否淡过」定：新图从 0 起淡，淡过的直接落 1（列表滚回来不再重放）。
     * 底下的渐变一直铺满，所以 0 透明度这一段是占位底而不是白块，失败时也不会有亮闪。
     */
    const imageFade = useRef(new Animated.Value(
      imageUri != null && ART_FADED_URIS.has(imageUri) ? 1 : 0,
    )).current
    // 换封面 / 回收复用换了图：重新按新 uri 的那一档复位，别把上一张的 1 带过来
    useEffect(() => {
      imageFade.stopAnimation()
      imageFade.setValue(imageUri != null && ART_FADED_URIS.has(imageUri) ? 1 : 0)
      // 卸载时收掉在跑的补间（同 usePressFx：宿主已拆还每帧写值就是白写）
      return () => { imageFade.stopAnimation() }
    }, [imageFade, imageUri])

    const handleLoadEnd = useCallback(() => {
      if (imageUri == null || imageUri.length === 0) return
      if (failedRef.current) return
      // 同一张图可能同时挂在两处（行 + 播放页）：另一处先淡完就记账了，
      // 这里必须把自己的值补到 1，否则这一处会停在 0（看不见图）
      if (ART_FADED_URIS.has(imageUri)) {
        imageFade.setValue(1)
        return
      }
      if (ART_FADED_URIS.size >= ART_FADED_LIMIT) ART_FADED_URIS.clear()
      ART_FADED_URIS.add(imageUri)
      Animated.timing(imageFade, {
        toValue: 1,
        duration: MOTION.artFade,
        easing: ART_FADE_EASE,
        useNativeDriver: true,
      }).start()
    }, [imageFade, imageUri])
    // 2026-10-15 性能轮：纹理层只在「无图」时挂。
    // 原型 CSS 里 .art 的 background（渐变 + svgArt 纹理）本就是**占位底**，
    // .art img 是 absolute inset:0 + object-fit:cover 铺满整个盒子 —— 有真图时纹理一个像素都看不见。
    // RN 侧此前无论有没有图都挂 ArtTexture（一个 react-native-svg 原生视图，点阵变体 25 个 Circle），
    // 而全站封面（歌曲行 / 卡片）绝大多数是有图的：每张卡都白付一个 SVG 视图的挂载 + 绘制成本，
    // 一屏十几行 / 一个列表几十行累计起来就是滚动与切页的帧预算大头。
    // 渐变底仍保留（图片解码完成前它是占位底，图挂了也靠它兜底），只撤掉自绘纹理。
    return (
      <View style={[{ width, height, borderRadius: radius, overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={[c1, c2]}
          start={GRADIENTS.art.start}
          end={GRADIENTS.art.end}
          style={StyleSheet.absoluteFill}
        />
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
              }}
            />
            {scrim && (
              <LinearGradient
                // 渐隐终点写「同一基色（veil 黑）的零透明」而非 CSS 'transparent'：
                // Android LinearGradient 把 'transparent' 当 rgba(0,0,0,0)，中间档已是黑基色半透明，
                // 插向纯黑会糊出黑块（同 LyricList 2026-10-11 真机踩坑结论）
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
