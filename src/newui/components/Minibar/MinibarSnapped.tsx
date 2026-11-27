import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Svg, { Circle } from 'react-native-svg'

import { NEW_UI_MINIBAR_LABELS } from '@/newui/const'
import { ART_INK, GLASS, MINIBAR, useTheme } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Art } from '../Art'
import { BlurredContainer } from '../Glass'
import { Icon } from '../Icon'

export interface MinibarSnappedProps {
  /** 封面种子（'album:' + 专辑名） */
  artSeed: string
  /** 封面图地址 */
  artUri?: string
  /** 是否在播：在播才转，暂停冻结在当前角度、孔里落一枚静三角 */
  playing: boolean
  /** 本态此刻是否可见：完整条态或被屏盖住时由挂点给 false，停转但不重置角度 */
  active?: boolean
  /** 播放进度 0..1（外圈那一弧） */
  ratio: number
  /** 圆点直径（竖屏 56 / 横屏 52） */
  size: number
  /** 点一下 = 展开回完整条（不直接进播放页） */
  onPress: () => void
  /** 读屏文案覆盖（复用在底部工具栏播放圆圈时换成「正在播放」口径） */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/**
 * 磁吸圆点：一枚半透明圆点贴在屏边，内含三层——
 * 1. 碟面：圆封面压到 artAlpha（底下文字可辨），叠中心孔 / 两道同心纹 / 柔光带 / 碟沿，跟封面同一 transform 一起转；
 * 2. 外圈进度弧：整环打底 + 品牌色弧按进度走，起点 12 点，静止不进旋转层；
 * 3. 暂停时孔里一枚白三角，播放中不渲染（碟在转即是「在播」）。
 * 自转 12s 一圈、linear，仅在「贴边 + 播放中 + 本态可见」时跑；暂停冻结角度，恢复从中断处续转；
 * 系统「减少动态效果」命中时碟面不转，光学件仍在。
 * 玻璃底走 BlurredContainer（薄纱 + 3px 模糊）：3px 是上限，糊得越狠底下的字越像没有；
 * 原生模糊不可用时降级为不透明 surface2 小圆。
 * 纯展示件：进度与播放态由调用方喂进来，自己不订阅 store（现仅用于 TabBar 播放圆圈）。
 */
export const MinibarSnapped = memo(
  ({
    artSeed,
    artUri,
    playing,
    active = true,
    ratio,
    size,
    onPress,
    accessibilityLabel,
    style,
  }: MinibarSnappedProps) => {
    const theme = useTheme()
    // 封面直径 = 直径 − 8：4px 内衬留给外圈进度弧
    const artSize = size - MINIBAR.snappedArtInset * 2
    const artAlpha = MINIBAR.snappedArtAlpha[theme.scheme]
    // 环画在外缘内侧半像素处，避免被圆角裁掉一半笔触
    const ringRadius = (size - MINIBAR.snappedRingWidth) / 2 - 0.5
    const circumference = 2 * Math.PI * ringRadius
    const dashOffset = useMemo(
      () => circumference * (1 - Math.max(0, Math.min(1, ratio))),
      [circumference, ratio],
    )

    /* ---- 碟面几何（换算见各 token 头注）---- */
    const discRadius = artSize / 2
    // 中心孔：inset 38% → 直径 = 碟径 × 24%
    const holeSize = artSize * MINIBAR.cdHoleRatio
    // 两道同心纹：半径占碟半径固定比例，SVG 描边居中正好落在那一圈上
    const grooveRadii = [discRadius * MINIBAR.cdGrooveInnerRatio, discRadius * MINIBAR.cdGrooveOuterRatio]
    const sheenColors = useMemo(
      () => MINIBAR.cdSheenAlphas.map(alpha => withAlpha(ART_INK.fg, alpha)),
      [],
    )

    /* ---- 自转：链式 Animated.timing（JS 驱动，小碟不必上原生驱动），暂停记住角度 ---- */
    const spin = useRef(new Animated.Value(0)).current
    const playingRef = useRef(playing)
    const animRef = useRef<Animated.CompositeAnimation | null>(null)
    // 动画值的本地数值镜像：旋转停在哪一度全靠它（addListener 是公开 API，不碰 Value 内部方法）
    const spinValueRef = useRef(0)
    const [reduceMotion, setReduceMotion] = useState(false)

    useEffect(() => {
      const id = spin.addListener(state => {
        spinValueRef.current = state.value
      })
      return () => {
        spin.removeListener(id)
      }
    }, [spin])

    // 系统「移除动画」：先读初值，再订阅变化
    useEffect(() => {
      let alive = true
      AccessibilityInfo.isReduceMotionEnabled()
        .then(enabled => {
          if (alive) setReduceMotion(enabled)
        })
        .catch(() => { /* 读不到就当没开，与不订阅同效 */ })
      const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
      return () => {
        alive = false
        sub.remove()
      }
    }, [])

    const rotate = useMemo(
      () => spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      [spin],
    )

    useEffect(() => {
      playingRef.current = playing
      // 暂停 / 不可见 / 减少动态效果：stop() 只是停在当前值上，角度不归零——恢复时接着转
      if (!playing || !active || reduceMotion) {
        animRef.current?.stop()
        return undefined
      }
      const run = () => {
        if (!playingRef.current) return
        const from = spinValueRef.current
        // 从中断的角度接着转，剩余行程按同角速度折算时长（首圈一整圈 = cdSpinMs）
        const anim = Animated.timing(spin, {
          toValue: 1,
          duration: Math.max(50, MINIBAR.cdSpinMs * (1 - from)),
          easing: Easing.linear,
          useNativeDriver: false, // rotate 走 JS 驱动：spinValueRef 镜像依赖 JS 侧逐帧回调
        })
        animRef.current = anim
        anim.start(({ finished }) => {
          if (finished && playingRef.current) {
            spin.setValue(0)
            run()
          }
        })
      }
      run()
      return () => {
        animRef.current?.stop()
      }
    }, [playing, active, reduceMotion, spin])

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? NEW_UI_MINIBAR_LABELS.dock}
        onPress={onPress}
        style={[
          styles.root,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.miniDotLine,
          },
          // 负 spread 表达不了，取一半半径 + 低透明度近似
          {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 7,
            elevation: 8,
          },
          style,
        ]}
      >
        <BlurredContainer spec={GLASS.miniSnapped} />
        {/* 旋转层：封面与各光学层同一 transform */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.disc,
            {
              width: artSize,
              height: artSize,
              borderRadius: discRadius,
              opacity: artAlpha,
              transform: [{ rotate }],
            },
          ]}
        >
          <Art
            width={artSize}
            height={artSize}
            radius={discRadius}
            seed={artSeed}
            imageUri={artUri}
          />
          {/* 两道同心纹：只做纹理不做厚环 */}
          <Svg width={artSize} height={artSize} style={StyleSheet.absoluteFill}>
            {grooveRadii.map(r => (
              <Circle
                key={r}
                cx={discRadius}
                cy={discRadius}
                r={r}
                stroke={withAlpha(ART_INK.fg, MINIBAR.cdGrooveAlpha)}
                strokeWidth={MINIBAR.cdGrooveWidth}
                fill="none"
              />
            ))}
          </Svg>
          {/* 柔光带：压在纹之上、碟沿之下 */}
          <LinearGradient
            colors={sheenColors}
            locations={[...MINIBAR.cdSheenStops]}
            start={MINIBAR.cdSheenStart}
            end={MINIBAR.cdSheenEnd}
            style={[StyleSheet.absoluteFill, { borderRadius: discRadius }]}
          />
          {/* 碟沿：画在碟面内沿，跟碟一起转 */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: discRadius,
                borderWidth: MINIBAR.cdRimWidth,
                borderColor: withAlpha(ART_INK.fg, MINIBAR.cdRimAlpha),
              },
            ]}
          />
          {/* 中心孔：暗底 + 1px 内高光，压在最上面 */}
          <View
            style={{
              position: 'absolute',
              left: (artSize - holeSize) / 2,
              top: (artSize - holeSize) / 2,
              width: holeSize,
              height: holeSize,
              borderRadius: holeSize / 2,
              backgroundColor: withAlpha(ART_INK.veil, MINIBAR.cdHoleAlpha),
              borderWidth: 1,
              borderColor: withAlpha(ART_INK.fg, MINIBAR.cdHoleRingAlpha),
            }}
          />
        </Animated.View>
        {/* 外圈进度弧：整环打底 + 品牌色按进度覆盖（0 时只剩打底环），静止不跟碟转 */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={ringRadius}
              stroke={theme.colors.miniRing}
              strokeWidth={MINIBAR.snappedRingWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={ringRadius}
              stroke={theme.colors.brand}
              strokeWidth={MINIBAR.snappedRingWidth}
              fill="none"
              strokeDasharray={[circumference, circumference]}
              strokeDashoffset={dashOffset}
              // 进度从正上方起、顺时针一圈；SVG 圆从 3 点起画，故绕圆心回退 90°
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        </View>
        {/* 暂停：孔里一枚白三角。播放中不渲染——碟在转即是「在播」；不跟碟转 */}
        {!playing && (
          <View
            pointerEvents="none"
            style={[
              styles.mark,
              {
                left: (size - MINIBAR.cdMarkSize) / 2,
                top: (size - MINIBAR.cdMarkSize) / 2,
                width: MINIBAR.cdMarkSize,
                height: MINIBAR.cdMarkSize,
              },
            ]}
          >
            <Icon
              name="play"
              size={MINIBAR.cdMarkIcon}
              color={ART_INK.fg}
              style={styles.markIcon}
            />
          </View>
        )}
      </Pressable>
    )
  },
)

MinibarSnapped.displayName = 'NewUIMinibarSnapped'

const styles = StyleSheet.create({
  /** 正圆 + 1px 发丝描边 */
  root: {
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 4px 内衬里的圆碟面，光学件在它内部一起转 */
  disc: {
    overflow: 'hidden',
  },
  /** 透明居中盒，装暂停三角 */
  mark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 三角的视觉居中补偿 */
  markIcon: {
    marginLeft: MINIBAR.cdMarkIconOffset,
  },
})
