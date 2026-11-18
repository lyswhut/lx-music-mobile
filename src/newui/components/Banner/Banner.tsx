import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  ART_INK,
  BANNER,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  RADIUS,
  SHADOW,
  bannerItemWidth,
  useTheme,
} from '@/newui/theme'
import { withAlpha } from '@/newui/utils'
// 直连具体 hook（不走 @/newui/hooks 桶口），与 PageViewport / TabBar 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { Art } from '../Art'

export interface BannerItem {
  /** 业务 key，容器据此分派点击动作（原型按 tag / title 猜测，这里显式化） */
  key: string
  /** 左上角标签（.b-tag），如「音源公告」 */
  tag: string
  /** 主标题（h3） */
  title: string
  /** 说明行（p） */
  sub: string
  /** 封面种子：取不到真图时决定底图渐变与程序化纹理 */
  artSeed: string
  /** 封面图地址（.bgart 的真图，原型 COVER() 的位置）；给定时铺真图，种子底仅作兜底 */
  imageUri?: string
}

export interface BannerProps {
  /** 轮播条目；0 条时整块不渲染，1 条时不出切换点 */
  items: BannerItem[]
  onPress: (key: string) => void
}

/**
 * 卡片投影的平台分派（QA 2026-10-14 第 15 轮：真机反馈「圆角弧线到长方形边框之间有可见的灰色」）。
 * 原型 .banner 的 box-shadow 是 var(--shadow)=0 18px 44px -18px（styles.css L39/L203）——
 * 负 spread 把影盘收进轮廓内侧，浏览器只画「底部的落影」，圆角弧外的角部楔形区不带灰。
 * Android 侧 RN 只认 elevation：全周均匀光晕、无法表达负 spread，且本卡刻意无 backgroundColor
 * （封面 Art 铺满，原型 .banner 也无背景），弧线与外包矩形之间的楔形区像素是透空的，
 * elevation 投影正好从透空处显影 → 四角灰楔。故 Android 降级为不投影；
 * iOS 的 shadow* 组带 offset 16 向下，落影集中在下沿，与原型口径一致，维持 SHADOW.card。
 */
const BANNER_CARD_SHADOW = Platform.OS === 'ios' ? SHADOW.card : null

/**
 * 首页轮播（对应原型 .banner-wrap / .banner-track / .banner / .banner-dots，styles.css L174-190）。
 * 逐卡满宽横滑 + 吸附，并按 app.js renderBanners 的节奏每 4.2s 自动换一张，末张回第一张。
 * 纯展示组件：条目内容与点击动作由容器（首页）从真实状态推导，不内置任何 mock 文案。
 */
export const Banner = memo(({ items, onPress }: BannerProps) => {
  const theme = useTheme()
  const { width: windowWidth } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const indexRef = useRef(0)
  const draggingRef = useRef(false)
  const [active, setActive] = useState(0)

  /* 卡高按档覆盖：原型 `.wide .banner{height:112px}`（styles.css:1324，112 取继续收听那一行的现成卡宽），
     compact 回 BANNER.height 的 150 基线；判据只在 useWideLayout 一处。
     宽度侧（bannerItemWidth）本就先收内容盒宽再算，限宽 620 后轮播不会比内容盒还宽。 */
  const { wide } = useWideLayout()
  const bannerHeight = wide?.bannerHeight ?? BANNER.height

  const itemWidth = bannerItemWidth(windowWidth)
  const stride = itemWidth + BANNER.trackGap
  const count = items.length

  // 自动换播：拖拽中不打断；滑到最后一张时回到第一张
  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(() => {
      if (draggingRef.current) return
      const next = indexRef.current >= count - 1 ? 0 : indexRef.current + 1
      indexRef.current = next
      setActive(next)
      scrollRef.current?.scrollTo({ x: stride * next, animated: true })
    }, BANNER.autoSwap)
    return () => {
      clearInterval(timer)
    }
  }, [count, stride])

  // 切换点跟随滚动位置（原型 idx = round(scrollLeft / (clientWidth + 12))）
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / stride)
      if (next === indexRef.current) return
      indexRef.current = next
      setActive(next)
    },
    [stride],
  )

  if (!count) return null

  // .banner-dots i 未选中项底色：原型锁白 rgba(255,255,255,.22)（styles.css L213，index.html L209 同口径
  // ——轮播恒压在固定暗色封面氛围上，不随主题反相，浅色档下换成墨色会在暗底上看不见）。
  // 此前用 theme.colors.text 派生，alpha 对上了但颜色族不对（QA D82）
  const idleDot = withAlpha(ART_INK.fg, BANNER.dotIdleAlpha)

  return (
    <View style={styles.root}>
      {/* QA 第 17 轮（2026-10-15）：切换动画中「方角→圆角」可见的修法落点——
          常驻轨道裁切层，细杠说明见 StyleSheet 的 trackClip。 */}
      <View style={Platform.OS === 'android' ? styles.trackClip : undefined}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={stride}
          decelerationRate="fast"
          contentContainerStyle={styles.track}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={() => {
            draggingRef.current = true
          }}
          onScrollEndDrag={() => {
            draggingRef.current = false
          }}
        >
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => onPress(item.key)}
              style={({ pressed }) => [
                styles.card,
                { width: itemWidth, height: bannerHeight },
                BANNER_CARD_SHADOW,
                pressed && styles.pressed,
              ]}
            >
              {/* .bgart：封面原语铺满卡片；有真图铺真图，没有才退回种子渐变纹理。
                  QA 第 16 轮（2026-10-20，本条真机仍报「圆角弧到长方形边框之间有可见灰色」）：
                  弧线改由「内容叶子层自裁」——Art 传 RADIUS.l、veil 同半径。理由：Android 侧
                  RN 父层 borderRadius+overflow:hidden 的裁切是 canvas.clipPath，非抗锯齿，且
                  LinearGradient / SVG 这类自绘子视图在部分机型上会从弧线外的楔形区渗色，
                  楔形区（弧线与外包矩形之间）本应全透只剩页面底，却被 veil/纹理的边角糊成灰。
                  原型 .banner 的 CSS border-radius+overflow:hidden 对全部子层统一抗锯齿裁切，
                  RN 无等价物；全站封面（歌单卡/歌曲行）一直走 Art 自带圆角且从无灰边反馈，
                  即叶子层自裁是本 App 已验证的干净路径。卡层不再 overflow:hidden，只保留
                  borderRadius 供 iOS shadowPath 取圆角形状（卡层无背景色，Android 上不绘制）。 */}
              <Art
                width={itemWidth}
                height={bannerHeight}
                radius={RADIUS.l}
                seed={item.artSeed}
                imageUri={item.imageUri}
                style={styles.art}
              />
              <LinearGradient
                colors={BANNER.veilAlphas.map((alpha) => withAlpha(ART_INK.veil, alpha))}
                locations={[...BANNER.veilStops]}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.veil}
              />
              <View style={styles.tagWrap}>
                <Text style={[styles.tag, { color: theme.colors.onGradient }]}>{item.tag}</Text>
              </View>
              <View style={styles.bottom}>
                <Text numberOfLines={1} style={[styles.title, { color: theme.colors.onGradient }]}>
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.sub, { color: withAlpha(theme.colors.onGradient, BANNER.subAlpha) }]}
                >
                  {item.sub}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {count > 1 && (
        <View style={styles.dots}>
          {items.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.dot,
                index === active ? styles.dotActive : null,
                { backgroundColor: index === active ? theme.colors.brand : idleDot },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
})

Banner.displayName = 'NewUIBanner'

const styles = StyleSheet.create({
  /** .banner-wrap margin-top:14px */
  root: {
    marginTop: BANNER.marginTop,
  },
  /**
   * 轨道视口圆角裁切（QA 2026-10-15 第 17 轮：真机反馈「轮播切换时能看见从无圆角到有圆角的变化过程」）。
   * 根因：圆角此前只活在卡内叶子层（Art / veil 自裁，第 16 轮灰缝修法），而横滑轨道视口（ScrollView）
   * 对内容做的是**直角** bounds 裁切——原型 styles.css L198 `.banner-track` 除 overflow-x:auto 外
   * 还带 `border-radius:var(--r-l)`，浏览器把切换途中的内容也裁进圆角视口，任何一帧入屏都带圆弧；
   * RN 落地漏了这层轨道裁切，新页滑入时贴视口右缘的一侧被切成直角矩形，落位后才显出卡自己的圆角
   * → 全程可见「方角 → 圆角」。
   * 修法：ScrollView 外套这层常驻裁切容器（与卡同半径 RADIUS.l，随 Banner 挂载一次、
   * 不随切换重建、无 key 抖动），圆角从入屏第一帧起始终存在。
   * 落位后视口弧与叶子弧同半径重合，只裁透明楔形区，不回退第 15/16 轮的静态灰缝修法。
   * 仅 Android 生效：iOS 若同加视口裁切，会把第 15 轮特意保留的 SHADOW.card 落影
   * （画在卡下沿、轨道 bounds 之外）一并切掉，iOS 维持 shadowPath 圆角轮廓原状。
   */
  trackClip: {
    borderRadius: RADIUS.l,
    overflow: 'hidden',
  },
  /** .banner-track gap:12px */
  track: {
    gap: BANNER.trackGap,
  },
  /**
   * .banner 高 150 / 圆角 --r-l。
   * QA 第 16 轮：去掉 overflow:hidden——不再由卡层做圆角裁切（Android clipPath 非抗锯齿，
   * 且 LinearGradient/SVG 自绘子层会从弧外楔形渗色成灰）；圆角改由内容叶子层 Art / veil
   * 各自同半径自裁。保留 borderRadius 仅为 iOS shadowPath 与按压态取圆角轮廓（卡无背景色，
   * Android 上去 overflow 后无副作用）。
   */
  /** 高按档在渲染期给（宽屏 112 / 竖屏 150），见组件里 bannerHeight */
  card: {
    borderRadius: RADIUS.l,
    flexShrink: 0,
  },
  /** .banner:active 缩放反馈（原型靠 transition .2s var(--ease)） */
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  art: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  /**
   * .veil：与 Art 同半径自裁（QA 第 16 轮）——半透明黑遮罩若铺满直角矩形，
   * 圆角弧外的楔形区会被它糊上一层暗灰；radius 传常量 RADIUS.l，与叶子封面共用同一弧线。
   */
  veil: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.l,
    overflow: 'hidden',
  },
  /** .b-tag：左上角胶囊（原型 align-self:flex-start，z-index 2） */
  tagWrap: {
    position: 'absolute',
    top: BANNER.padding,
    left: BANNER.padding,
  },
  tag: {
    paddingHorizontal: BANNER.tagPaddingX,
    paddingVertical: BANNER.tagPaddingY,
    borderRadius: RADIUS.tag,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.kicker,
    backgroundColor: withAlpha(ART_INK.fg, ART_INK.chipAlpha),
    overflow: 'hidden',
  },
  /** h3 + p 贴在卡片左下（.banner 的 justify-content:flex-end + padding 16） */
  bottom: {
    position: 'absolute',
    right: BANNER.padding,
    bottom: BANNER.padding,
    left: BANNER.padding,
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.wider,
  },
  sub: {
    marginTop: BANNER.subMarginTop,
    fontSize: FONT_SIZE.smallLg,
  },
  /** .banner-dots：居中一行，5px 圆点，选中项拉宽到 16px 并上主色 */
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BANNER.dotsGap,
    marginTop: BANNER.dotsMarginTop,
  },
  dot: {
    width: BANNER.dotSize,
    height: BANNER.dotSize,
    borderRadius: BANNER.dotRadius,
  },
  dotActive: {
    width: BANNER.dotActiveWidth,
  },
})
