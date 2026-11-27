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
  /** 尾部说明 */
  note?: string
}

/**
 * 歌词滚动区：上下各留半屏垫高让首尾行能落到视觉中线，当前行放大加粗提亮，
 * 行变化时平滑滚动居中。
 * 渐隐不用渐变压盖层（Android 对 0 透明渐变端点处理不可靠，真机会呈现深色实心带），
 * 改为按行距中线距离插值透明度，深浅主题都成立；用户手动滚动未回位时渐隐位置是近似的。
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

  // 换歌（lines 整体变化）：清掉旧高度表并回到顶部
  useEffect(() => {
    heightsRef.current = []
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [lines])

  // 当前行滚到视觉中线：目标偏移 = 上方行高之和 + 本行一半（半屏垫高抵消视口中线）
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

  // 行透明度插值的渐隐系数（1 = 满可见）。距中线 fadeStart 之前不衰减，此后线性衰减到底；
  // 行中心距用实测行高累加，缺测时按标准行高兜底
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
  /** 铺满播放舞台；stage 是 alignItems:center 的 flex 容器，用 stretch 复原全宽
   *  （否则列宽收成文字宽，长行换行口径不对） */
  root: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
  },
  /** 歌词区左右内衬 */
  content: {
    paddingHorizontal: PLAYER.lyricPaddingX,
  },
  line: {
    textAlign: 'center',
    /** 行高用 PLAYER.lyricLineHeight 固定 */
    fontSize: FONT_SIZE.bodyLg,
    lineHeight: PLAYER.lyricLineHeight,
  },
  lineIdle: {
    /** 基础透明度与渐隐系数在渲染处合并成 inline opacity */
    fontWeight: FONT_WEIGHT.medium,
  },
  /** 当前行：放大、加粗、提亮 + 一层极淡的柔光，无背景块/色条。
   *  RN（Android）文字阴影按半径逐像素涂抹，大半径可能涂成可见暗斑；
   *  真机若脏，改的是 token 取值，不在组件里加特例 */
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
