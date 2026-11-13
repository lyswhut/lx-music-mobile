import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native'

import type { Line } from '@/plugins/lyric'

import { FONT_SIZE, FONT_WEIGHT, PLAYER, useTheme } from '@/newui/theme'

export interface LyricListProps {
  /** 歌词行（@/plugins/lyric 解析后的原始数据，只读） */
  lines: Line[]
  /** 当前行下标（useLrcPlay().line，-1 表示不高亮） */
  activeIndex: number
  /** 尾部说明（原型 .ln-note） */
  note?: string
}

/**
 * 歌词滚动区（对应原型 .lyric-wrap / .lyric-scroll，styles.css L533-542）：
 * 上下各留半屏垫高让首尾行能落到视觉中线（同 syncLyric 的 padding 算法）；
 * 当前行放大加粗提亮，行变化时平滑滚动居中。
 * 渐隐（2026-10-13，清单「正在播放页」第 3 条）：原型歌词没有任何面板/压盖层，
 * 只靠 ::before/::after 的 48px mask 带渐隐。RN 曾用上下两条 LinearGradient 压盖底色复现，
 * 真机上始终呈现为深色实心带（Android 对 0 透明渐变端点的处理不可靠，且压盖带盖在
 * 封面氛围底 .player-bg 上比页面更黑，四边观感即「大黑框」）。现改为「行透明度插值」：
 * 每行透明度随「距视口中线超出渐隐带的距离」线性衰减到 (1 - lyricFadeAlpha) 倍，
 * 不再压任何盖层，深浅主题天然都成立。插值以「当前行恒居中线」为锚，
 * 用户手动滚开、尚未回位的短暂窗口内渐隐位置是近似的——可接受的取舍。
 * 纯展示组件：数据与当前行由容器传入，不发请求、不动播放器。
 */
export const LyricList = memo(({ lines, activeIndex, note }: LyricListProps) => {
  const theme = useTheme()
  const scrollRef = useRef<ScrollView>(null)
  const heightsRef = useRef<number[]>([])
  const [viewportHeight, setViewportHeight] = useState(0)

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setViewportHeight(nativeEvent.layout.height)
  }, [])

  const handleLineLayout = useCallback((index: number, height: number) => {
    heightsRef.current[index] = height
  }, [])

  // 换歌（lines 整体变化）：清掉旧高度表并回到顶部，等第一行高亮再定位
  useEffect(() => {
    heightsRef.current = []
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [lines])

  // 当前行滚到视觉中线：目标偏移 = 上方行高之和 + 本行一半（半屏垫高恰好抵消视口中线）
  useEffect(() => {
    if (viewportHeight <= 0 || activeIndex < 0 || activeIndex >= lines.length) return
    let offset = 0
    for (let i = 0; i < activeIndex; i++) {
      offset += heightsRef.current[i] ?? PLAYER.lyricLineHeight
    }
    offset += (heightsRef.current[activeIndex] ?? PLAYER.lyricLineHeight) / 2
    scrollRef.current?.scrollTo({ y: offset, animated: true })
  }, [activeIndex, lines.length, viewportHeight])

  const spacer = viewportHeight > 0 ? viewportHeight / 2 : PLAYER.lyricLineHeight

  // 行透明度插值的渐隐系数（1 = 满可见，1 - lyricFadeAlpha = 原型带根部的残余可见度）。
  // 视口半高内、距中线 fadeStart 之前不衰减；此后 48px 线性衰减到底（对应原型 L535-536
  // 的 height:48px + rgba(.8) 压盖深度）。行中心距用实测行高累加，缺测时按标准行高兜底。
  const halfViewport = viewportHeight / 2
  const fadeStart = halfViewport - PLAYER.lyricFadeHeight
  const centers: number[] = []
  let linesTop = 0
  for (let i = 0; i < lines.length; i++) {
    const h = heightsRef.current[i] ?? PLAYER.lyricLineHeight
    centers.push(linesTop + h / 2)
    linesTop += h
  }
  const anchorCenter =
    activeIndex >= 0 && activeIndex < lines.length
      ? centers[activeIndex]
      : linesTop / 2
  const fadeRamp = (index: number): number => {
    if (viewportHeight <= 0 || fadeStart <= 0) return 1
    const dist = Math.abs(centers[index] - anchorCenter)
    if (dist <= fadeStart) return 1
    const t = Math.min((dist - fadeStart) / PLAYER.lyricFadeHeight, 1)
    return 1 - PLAYER.lyricFadeAlpha * t
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingVertical: spacer }]}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, index) => {
          const active = index === activeIndex
          const baseAlpha = active ? 1 : PLAYER.lyricOpacity
          return (
            <Text
              key={`${index}-${line.text}`}
              numberOfLines={0}
              onLayout={event => handleLineLayout(index, event.nativeEvent.layout.height)}
              style={[
                styles.line,
                active ? styles.lineActive : styles.lineIdle,
                {
                  color: active ? theme.colors.text : theme.colors.text3,
                  opacity: baseAlpha * fadeRamp(index),
                },
                active && { textShadowColor: theme.colors.lyricGlow },
              ]}
            >
              {line.text}
            </Text>
          )
        })}
        {note != null && note.length > 0 && (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>{note}</Text>
        )}
      </ScrollView>
    </View>
  )
})

LyricList.displayName = 'NewUILyricList'

const styles = StyleSheet.create({
  /** .lyric-wrap position:absolute; inset:0（styles.css L533）——铺满整个 .player-stage；
   *  RN 侧 stage 是 alignItems:center 的 flex 容器，用 stretch 复原「全宽」语义
   *  （否则列宽收成文字宽，长行换行口径与原型不符，真机实测违和） */
  root: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
  },
  /** .lyric-scroll padding:0 6px; text-align:center */
  content: {
    paddingHorizontal: PLAYER.lyricPaddingX,
  },
  line: {
    textAlign: 'center',
    /** 行高用 PLAYER.lyricLineHeight 固定（原型 .ln line-height:26px） */
    fontSize: FONT_SIZE.bodyLg,
    lineHeight: PLAYER.lyricLineHeight,
  },
  lineIdle: {
    /** 基础透明度 PLAYER.lyricOpacity 与渐隐系数在渲染处合并成 inline opacity */
    fontWeight: FONT_WEIGHT.medium,
  },
  /** .ln.on：放大、加粗、提亮 + 一层极淡的抬字柔光；原型当前行**没有任何背景块/色条**，
   *  分层全靠字号(17)/字重(800)/颜色(text vs text-3)/透明度三件事（styles.css L610-612）。
   *  投影的颜色与强度按主题各一档（colors.lyricGlow：深 rgba(0,0,0,.55) / 浅 rgba(21,22,28,.22)），
   *  半径/偏移见 PLAYER.lyricGlow*，取原型原值 22 / 5（styles.css L612 / L1171）——
   *  QA D77（2026-10-16 审计轮）把此前自降的 6 / 1 与浓度 .30 / .10 全部回到原型原值。
   *  遗留风险照实记一句：RN（Android）的文字阴影按半径逐像素涂抹，22 大半径可能涂成当前行身后
   *  的可见暗斑（清单「正在演播的歌词行的背景色（阴影）有点丑」那条的来源）；真机若确实脏，
   *  改的是这条口径记录与 token 取值，不在组件里加特例 */
  lineActive: {
    fontSize: PLAYER.lyricActiveSize,
    fontWeight: FONT_WEIGHT.extraBold,
    textShadowOffset: { width: 0, height: PLAYER.lyricGlowOffsetY },
    textShadowRadius: PLAYER.lyricGlowRadius,
  },
  note: {
    marginTop: PLAYER.lyricNoteMarginTop,
    fontSize: FONT_SIZE.tiny,
    lineHeight: 17,
    opacity: PLAYER.lyricNoteAlpha,
    textAlign: 'center',
  },
})
