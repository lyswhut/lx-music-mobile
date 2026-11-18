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
  /** 封面种子（'album:' + 专辑名，同完整条口径） */
  artSeed: string
  /** 封面图地址 */
  artUri?: string
  /** 是否在播：在播才转，暂停冻结在当前角度、孔里落一枚静三角 */
  playing: boolean
  /** 本态此刻是否可见：完整条态、被推入屏盖住时由挂点给 false，停转但不重置角度 */
  active?: boolean
  /** 播放进度 0..1（外圈那一弧） */
  ratio: number
  /** 圆点直径：竖屏 56 / 横屏 52（原型 --mini-dot，宽屏档收一档） */
  size: number
  /**
   * 单集态（原型 `paintMiniDock` 里按 `epLive()` 分叉的那两句读屏文案）：碟面换成节目封面、
   * 外圈那一弧读单集进度——这两件事都由挂点从 props 喂进来（`artSeed` / `artUri` / `ratio` / `playing`），
   * 本组件只多认一个「这一集在播」用来换无障碍名，转速 / 暂停冻结 / 减少动态效果三条规则一字不动。
   */
  podcast?: boolean
  /** 点一下 = 展开回完整条（原型 miniBarClick 里 snapped 那一支：不直接进播放页） */
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 磁吸圆点（原型 `.minibar.is-snapped`，styles.css L727-864）。
 *
 * 一枚半透明圆点贴在屏边，里面三层：
 *  1. **碟面**——半径撑满到「直径 − 8」（原型 .mini-art 在 snapped 态就是 dot − 8，4px 内衬），
 *     底色压到 `--mini-art-alpha`（深 .70 / 浅 .76）：底下的字还看得见、封面仍认得出，别加厚。
 *     2026-10-24 起这张圆封面就是一张 CD，四层光学件压在封面上、**跟封面同一个 transform 一起转**：
 *     中心孔（24%，深 .55 底 + 1px 白 .12 内高光）、两道 1px 同心纹（白 .09，半径 62% / 84%）、
 *     一道 115° 柔光带（白 .20）、碟沿 1px 白 .18（与外圈 `miniDotLine` 分开：那是圆点的边，这是碟的边）；
 *  2. **外圈那一弧进度**——原型是 conic-gradient 加 radial 挖空，RN 用 SVG 描边环等价：
 *     整环 `miniRing` 打底 + 品牌色弧按进度走，起点在 12 点方向（原型 conic 的 0deg 就是正上方，
 *     SVG 圆默认从 3 点起，故整环旋转 −90°）。这一层**静止**，不进旋转层；
 *  3. **暂停时孔里那枚 7px 白三角**——容器 11×11、透明底、无描边、无模糊（原型 `--mini-cd-ink` 恒白）。
 *     播放中整颗不渲染：碟在转本身就是「在播」（原型把 .mini-dock-mark 收成 opacity:0）。
 *     整只圆点就是一个「展开」钮，它自己不接点击（原型 mini-dock-mark 的 aria-hidden）。
 *
 * 自转：12s 一圈、linear、无限，只在「贴边 + 正在播放 + 本态可见」时跑；暂停冻结在当前角度、恢复从该角度接着转
 * （链式 `Animated.timing` + 角度镜像，与播放页 `DiscArt` 同一套暂停恢复口径，时长换成本档的 12s）。
 * 减少动态效果（系统「移除动画」）命中时整只碟面不转，孔 / 纹 / 柔光 / 碟沿都还在。
 * 「不可见就不转」由挂点传 `active`：完整条展开时圆点只切 opacity，RNN 被盖住的屏也不卸载，
 * 所以不能指望组件退场来停；挂点按「贴边态 + 本屏可见」给出，避免白白空转 JS。
 *
 * 玻璃底走共通件 `BlurredContainer`，规格 GLASS.miniSnapped = 原型 `--mini-veil` 薄纱 + 3px 模糊。
 * 3px 是上限：圆点压在推入层内容上，糊得越狠底下的字越像没有（原型注释里的实测结论）。
 * 原生模糊不可用时降级为不透明 surface2 小圆（宁可厚一点也不漏内容）。
 * 纯展示件：进度与播放态由挂点（MinibarHost）喂进来，自己不订阅 store。
 */
export const MinibarSnapped = memo(
  ({
    artSeed,
    artUri,
    playing,
    active = true,
    ratio,
    size,
    podcast = false,
    onPress,
    style,
  }: MinibarSnappedProps) => {
    const theme = useTheme()
    // 封面直径 = 直径 − 8（原型 calc(var(--mini-dot) - 8px)）：4px 内衬留给外圈那一弧
    const artSize = size - MINIBAR.snappedArtInset * 2
    const artAlpha = MINIBAR.snappedArtAlpha[theme.scheme]
    // 环画在外缘内侧半像素处，避免被圆角裁掉一半笔触（原型那条 mask 也是贴边 2px 环带）
    const ringRadius = (size - MINIBAR.snappedRingWidth) / 2 - 0.5
    const circumference = 2 * Math.PI * ringRadius
    const dashOffset = useMemo(
      () => circumference * (1 - Math.max(0, Math.min(1, ratio))),
      [circumference, ratio],
    )

    /* ---- 碟面几何（逐值对 tokens 的 MINIBAR.cd*，换算见各 token 头注）---- */
    const discRadius = artSize / 2
    // 中心孔：inset 38% → 直径 = 碟径 × 24%
    const holeSize = artSize * MINIBAR.cdHoleRatio
    // 两道同心纹：半径占碟半径 62% / 84%，SVG 描边居中正好落在那一圈上
    const grooveRadii = [discRadius * MINIBAR.cdGrooveInnerRatio, discRadius * MINIBAR.cdGrooveOuterRatio]
    const sheenColors = useMemo(
      () => MINIBAR.cdSheenAlphas.map(alpha => withAlpha(ART_INK.fg, alpha)),
      [],
    )

    /* ---- 自转：链式 Animated.timing（JS 驱动，48 小碟不必上原生驱动），暂停记住角度 ---- */
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

    // 系统「移除动画」：先读初值，再订阅变化（RN 0.73 的 AccessibilityInfo 原生支持，不引依赖）
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
        accessibilityLabel={podcast ? NEW_UI_MINIBAR_LABELS.dockPod : NEW_UI_MINIBAR_LABELS.dock}
        onPress={onPress}
        style={[
          styles.root,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.miniDotLine,
          },
          // 原型 snap 态投影 0 4px 14px -8px rgba(0,0,0,.6)：负 spread 表达不了，取一半半径 + 低透明度近似
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
        {/* 旋转层：封面 + 孔 + 纹 + 柔光 + 碟沿全在这一个 transform 里（原型五层同一个 .mini-art） */}
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
          {/* 两道同心纹（原型 ::before 的两个 radial-gradient，白 .09 各 1px）：只做纹理不做厚环 */}
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
          {/* 柔光带（原型 115° 那道 linear-gradient）：压在纹之上、碟沿之下 */}
          <LinearGradient
            colors={sheenColors}
            locations={[...MINIBAR.cdSheenStops]}
            start={MINIBAR.cdSheenStart}
            end={MINIBAR.cdSheenEnd}
            style={[StyleSheet.absoluteFill, { borderRadius: discRadius }]}
          />
          {/* 碟沿（原型 inset 0 0 0 1px 白 .18）：画在碟面内沿，跟碟一起转 */}
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
          {/* 中心孔（原型 ::after inset 38%）：暗底 + 1px 白内高光，压在最上面 */}
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
        {/* 外圈那一弧：整环 miniRing 打底 + 品牌色按进度盖上去（0 时只剩打底环）。静止，不跟碟转 */}
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
              // 进度从正上方起、顺时针一圈（原型 conic-gradient 不写 from 的起点），
              // 而 SVG 的圆从 3 点方向起画，所以整环绕圆心回退 90°
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        </View>
        {/* 暂停：孔里一枚 7px 白三角（容器 11×11、透明底、无描边无模糊）。播放中整颗不渲染——
            碟在转本身就是「在播」。它不跟碟转（原型里它是 .minibar 的兄弟节点，不在 .mini-art 里） */}
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
  /** .minibar.is-snapped：正圆 + 1px 发丝描边（borderWidth 1 即原型 inset 0 0 0 1px 的等价） */
  root: {
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `.is-snapped .mini-art`：4px 内衬里的圆碟面，四层光学件在它内部一起转 */
  disc: {
    overflow: 'hidden',
  },
  /** `.minibar.is-snapped .mini-dock-mark`：11×11 的透明居中盒里的那枚静三角 */
  mark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 静三角的视觉居中补偿（原型 .mini-dock-mark .ic margin-left:1px） */
  markIcon: {
    marginLeft: MINIBAR.cdMarkIconOffset,
  },
})
