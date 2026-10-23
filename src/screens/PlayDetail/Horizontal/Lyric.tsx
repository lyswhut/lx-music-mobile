import { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react'
import { View, FlatList, Text, Animated, Easing, type FlatListProps, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent, type TextLayoutEventData } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { type Line, type WordLyricLine, useLrcPlay, useLrcSet, useWordLyricPlay, useWordLyricSet, useWordLyricExtended } from '@/plugins/lyric'
import { createStyle, getAlignOffsetX } from '@/utils/tools'
// import { useComponentIds } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { AnimatedColorText } from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import { scrollTo } from '@/utils/scroll'
import { getWordLyricColors } from '@/config/wordLyricColors'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
// import { screenkeepAwake } from '@/utils/nativeModules/utils'
// import { log } from '@/utils/log'
// import { toast } from '@/utils/tools'

type FlatListType = FlatListProps<Line>

// const useLock = () => {
//   const showCommentRef = useRef(false)


//   useEffect(() => {
//     let appstateListener = AppState.addEventListener('change', (state) => {
//       switch (state) {
//         case 'active':
//           if (showLyricRef.current && !showCommentRef.current) screenkeepAwake()
//           break
//         case 'background':
//           screenUnkeepAwake()
//           break
//       }
//     })
//     return () => {
//       appstateListener.remove()
//     }
//   }, [])
//   useEffect(() => {
//     let listener: ReturnType<typeof onNavigationComponentDidDisappearEvent>
//     showLyricRef.current = !!componentIds.comment
//     if (showLyricRef.current && AppState.currentState == 'active') screenkeepAwake()
//     else screenUnkeepAwake()
//     if (showCommentRef.current) {
//       listener = onNavigationComponentDidDisappearEvent(componentIds.comment as string, () => {
//         if (showLyricRef.current && AppState.currentState == 'active') screenkeepAwake()
//       })
//     }

//     const rm = global.state_event.on('componentIdsUpdated', (ids) => {

//     })

//     return () => {
//       if (listener) listener.remove()
//     }
//   }, [])
// }

interface LineProps {
  line: Line
  lineNum: number
  activeLine: number
  textAlign: 'left' | 'center' | 'right'
  alignProgress: Animated.Value // 对齐切换动画进度 0→1
  targetAlign: 'left' | 'center' | 'right' // 切换目标对齐
  containerWidth: number // 歌词容器宽度
  onLayout: (lineNum: number, height: number, width: number) => void
}
const LrcLine = memo(({ line, lineNum, activeLine, textAlign, alignProgress, targetAlign, containerWidth, onLayout }: LineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.horizontal.style.lrcFontSize')
  const wordLyricColor = useSettingValue('player.wordLyricColor')
  const wordLyricBrightness = useSettingValue('player.wordLyricBrightness')
  const wordLyricContrast = useSettingValue('player.wordLyricContrast')
  const size = lrcFontSize / 10
  const lineHeight = setSpText(size) * 1.3
  const [textWidth, setTextWidth] = useState(0)
  // 对齐切换：动画期间保持旧 textAlign（原位=旧位置），translateX 从 0 滑到 (新位置-旧位置)
  const translateX = alignProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      getAlignOffsetX(targetAlign, containerWidth, textWidth) - getAlignOffsetX(textAlign, containerWidth, textWidth),
    ],
  })

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }
  // 注意：Text 的 onLayout 拿到的是布局盒宽度（占满容器），必须用 onTextLayout 测实际文本宽
  const handleTextLayout = useCallback(({ nativeEvent }: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = nativeEvent.lines
    if (lines?.length) setTextWidth(Math.max(...lines.map(l => l.width)))
  }, [])

  // 由设置计算已唱（亮部）/未唱颜色：颜色、亮度、对比三项可调，与逐字歌词一致
  const { playedColor, waitColor } = useMemo(() => getWordLyricColors(
    wordLyricColor, wordLyricBrightness, wordLyricContrast, theme['c-primary'], theme['c-350'],
  ), [wordLyricColor, wordLyricBrightness, wordLyricContrast, theme])
  const colors = useMemo(() => {
    const active = activeLine == lineNum
    return active ? [
      playedColor,
      waitColor,
      1,
    ] as const : [
      waitColor,
      waitColor,
      0.6,
    ] as const
  }, [activeLine, lineNum, playedColor, waitColor])

  // textBreakStrategy="simple" 用于解决某些设备上字体被截断的问题
  // https://stackoverflow.com/a/72822360
  return (
    <Animated.View style={[styles.line, { transform: [{ translateX }] }]} onLayout={handleLayout}>
      <AnimatedColorText style={{
        ...styles.lineText,
        textAlign,
        lineHeight,
      }} textBreakStrategy="simple" onTextLayout={handleTextLayout} color={colors[0]} opacity={colors[2]} size={size}>{line.text}</AnimatedColorText>
      {
        line.extendedLyrics.map((lrc, index) => {
          return (<AnimatedColorText style={{
            ...styles.lineTranslationText,
            textAlign,
            lineHeight: lineHeight * 0.8,
          }} textBreakStrategy="simple" key={index} color={colors[1]} opacity={colors[2]} size={size * 0.8}>{lrc}</AnimatedColorText>)
        })
      }
    </Animated.View>
  )
}, (prevProps, nextProps) => {
  return prevProps.line === nextProps.line &&
    prevProps.textAlign === nextProps.textAlign &&
    prevProps.targetAlign === nextProps.targetAlign &&
    prevProps.containerWidth === nextProps.containerWidth &&
    prevProps.activeLine != nextProps.lineNum &&
    nextProps.activeLine != nextProps.lineNum
})

// 单个字：底层未唱色整字显示，上层已唱色装入 overflow:hidden 容器，
// 容器宽度 = 字宽 × 该字播放进度（0→100%），亮色即从字的左边缘扫到右边缘
const LyricWord = memo(({ text, progress, playedColor, waitColor, size, lineHeight }: {
  text: string
  progress: number
  playedColor: string
  waitColor: string
  size: number
  lineHeight: number
}) => {
  const [wordWidth, setWordWidth] = useState(0)
  // 注意：Text 的 onLayout 拿到的是布局盒宽度（占满容器），必须用 onTextLayout 测实际文本宽
  const handleTextLayout = useCallback(({ nativeEvent }: NativeSyntheticEvent<TextLayoutEventData>) => {
    const width = nativeEvent.lines?.[0]?.width
    if (width && width > 0) setWordWidth(width)
  }, [])
  // 进度钳制 0~1；已唱文本预留少量宽度缓冲，避免取整误差导致换行
  const clipWidth = wordWidth > 0 ? wordWidth * Math.max(0, Math.min(1, progress)) : 0
  return (
    <View style={styles.word}>
      <Text style={[styles.wordText, { color: waitColor, fontSize: setSpText(size), lineHeight }]} textBreakStrategy="simple" onTextLayout={handleTextLayout}>{text}</Text>
      {clipWidth > 0 ? (
        <View style={[styles.wordPlayedClip, { width: clipWidth }]}>
          <Text style={[styles.wordText, { color: playedColor, fontSize: setSpText(size), lineHeight, width: wordWidth + 4 }]} textBreakStrategy="simple">{text}</Text>
        </View>
      ) : null}
    </View>
  )
})

// 逐字歌词行：当前行按每个字的播放进度以宽度擦除方式扫过亮色，实现平滑卡拉OK效果
interface WordLineProps {
  line: WordLyricLine
  lineNum: number
  activeLine: number
  time: number // 当前行已播放时间（ms）
  textAlign: 'left' | 'center' | 'right'
  alignProgress: Animated.Value // 对齐切换动画进度 0→1
  targetAlign: 'left' | 'center' | 'right' // 切换目标对齐
  containerWidth: number // 歌词容器宽度
  onLayout: (lineNum: number, height: number, width: number) => void
}
const WordLrcLine = memo(({ line, lineNum, activeLine, time, textAlign, alignProgress, targetAlign, containerWidth, onLayout }: WordLineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.horizontal.style.lrcFontSize')
  const isShowTranslation = useSettingValue('player.isShowLyricTranslation')
  const isShowRoma = useSettingValue('player.isShowLyricRoma')
  const wordLyricColor = useSettingValue('player.wordLyricColor')
  const wordLyricBrightness = useSettingValue('player.wordLyricBrightness')
  const wordLyricContrast = useSettingValue('player.wordLyricContrast')
  const { translation, roma } = useWordLyricExtended()
  const size = lrcFontSize / 10
  const lineHeight = setSpText(size) * 1.3
  const isActive = activeLine == lineNum
  // 由设置计算已唱（亮部）/未唱颜色：颜色、亮度、对比三项可调
  const { playedColor, waitColor } = useMemo(() => getWordLyricColors(
    wordLyricColor, wordLyricBrightness, wordLyricContrast, theme['c-primary'], theme['c-350'],
  ), [wordLyricColor, wordLyricBrightness, wordLyricContrast, theme])
  const [textWidth, setTextWidth] = useState(0)
  // 对齐切换：动画期间保持旧 textAlign（原位=旧位置），translateX 从 0 滑到 (新位置-旧位置)
  const translateX = alignProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      getAlignOffsetX(targetAlign, containerWidth, textWidth) - getAlignOffsetX(textAlign, containerWidth, textWidth),
    ],
  })
  const alignJustify = textAlign == 'left' ? 'flex-start' : textAlign == 'center' ? 'center' : 'flex-end'

  const extendedLyrics = useMemo(() => {
    const list: string[] = []
    if (isShowTranslation && translation[lineNum]) list.push(translation[lineNum])
    if (isShowRoma && roma[lineNum]) list.push(roma[lineNum])
    return list
  }, [isShowTranslation, isShowRoma, translation, roma, lineNum])

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }
  // 隐藏文本：测量整行实际文本宽度（绝对定位不参与布局），用于对齐切换动画的位移计算
  const handleTextLayout = useCallback(({ nativeEvent }: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = nativeEvent.lines
    if (lines?.length) setTextWidth(Math.max(...lines.map(l => l.width)))
  }, [])

  return (
    <Animated.View style={[styles.line, { opacity: isActive ? 1 : 0.6, transform: [{ translateX }] }]} onLayout={handleLayout}>
      {
        isActive ? (
          <>
            <Text style={[styles.measureText, { fontSize: setSpText(size), lineHeight }]} textBreakStrategy="simple" onTextLayout={handleTextLayout}>{line.text}</Text>
            <View style={[styles.wordsRow, { justifyContent: alignJustify }]}>
              {
                (line.words || []).map((word, index) => {
                  const progress = word.duration > 0
                    ? (time - word.time) / word.duration
                    : (time >= word.time ? 1 : 0)
                  return <LyricWord key={index} text={word.text} progress={progress} playedColor={playedColor} waitColor={waitColor} size={size} lineHeight={lineHeight} />
                })
              }
            </View>
          </>
        ) : (
          <Text style={[styles.lineText, { textAlign, lineHeight, fontSize: setSpText(size), color: waitColor }]} textBreakStrategy="simple">{line.text}</Text>
        )
      }
      {
        extendedLyrics.map((lrc, index) => {
          return (<AnimatedColorText style={{
            ...styles.lineTranslationText,
            textAlign,
            lineHeight: lineHeight * 0.8,
          }} textBreakStrategy="simple" key={index} color={waitColor} size={size * 0.8}>{lrc}</AnimatedColorText>)
        })
      }
    </Animated.View>
  )
}, (prevProps, nextProps) => {
  if (prevProps.line !== nextProps.line) return false
  if (prevProps.textAlign !== nextProps.textAlign) return false
  if (prevProps.targetAlign !== nextProps.targetAlign) return false
  if (prevProps.containerWidth !== nextProps.containerWidth) return false
  if (prevProps.activeLine == nextProps.lineNum || nextProps.activeLine == nextProps.lineNum) {
    // 当前行（或刚播放完的行）需要随时间重绘
    return prevProps.time === nextProps.time && prevProps.activeLine === nextProps.activeLine
  }
  // 非相关行：静态属性未变且不涉及激活行切换，跳过重渲染
  return true
})
const wait = async() => new Promise(resolve => setTimeout(resolve, 100))

export default () => {
  const lrcLines = useLrcSet()
  const wordLines = useWordLyricSet()
  const { line, time } = useWordLyricPlay()
  const { line: playLine } = useLrcPlay()
  const isShowWordLyric = useSettingValue('player.isShowWordLyric')
  // 有逐字歌词数据且开启逐字显示时使用逐字渲染，否则回退逐行
  const isWordMode = isShowWordLyric && wordLines.length > 0
  const activeLine = isWordMode ? line : playLine
  const lyricLines = (isWordMode ? wordLines : lrcLines) as Line[]
  // 对齐方式：本地 state 跟随设置，切换时通过位移动画过渡
  const alignSetting = useSettingValue('playDetail.style.align')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(alignSetting)
  const alignProgress = useRef(new Animated.Value(1)).current
  const latestAlignRef = useRef(alignSetting)
  const containerWidthRef = useRef(0)
  // 对齐切换：动画期间保持旧 textAlign（原位=旧位置），文本通过 translateX 滑向新位置；
  // 动画结束后再把 textAlign 切到目标值（原位即新位置，视觉无缝）
  useEffect(() => {
    if (alignSetting === latestAlignRef.current) return
    latestAlignRef.current = alignSetting
    alignProgress.stopAnimation()
    alignProgress.setValue(0)
    Animated.timing(alignProgress, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()
    const timer = setTimeout(() => { setTextAlign(alignSetting) }, 300)
    return () => { clearTimeout(timer) }
  }, [alignSetting, alignProgress])
  const flatListRef = useRef<FlatList<Line>>(null)
  const playLineRef = useRef<PlayLineType>(null)
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayScrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef({ line: 0, prevLine: 0 })
  const isFirstSetLrc = useRef(true)
  const scrollInfoRef = useRef<NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null>(null)
  const listLayoutInfoRef = useRef<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const scrollCancelRef = useRef<(() => void) | null>(null)
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  // useLock()
  // const [imgUrl, setImgUrl] = useState(null)
  // const theme = useGetter('common', 'theme')
  // const { onLayout, ...layout } = useLayout()

  // useEffect(() => {
  //   const url = playMusicInfo ? playMusicInfo.musicInfo.img : null
  //   if (imgUrl == url) return
  //   setImgUrl(url)
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [playMusicInfo])

  // const imgWidth = useMemo(() => layout.width * 0.75, [layout.width])
  const handleScrollToActive = (index = lineRef.current.line) => {
    if (index < 0) return
    if (flatListRef.current) {
      // console.log('handleScrollToActive', index)
      if (scrollInfoRef.current && lineRef.current.line - lineRef.current.prevLine == 1) {
        let offset = listLayoutInfoRef.current.spaceHeight
        for (let line = 0; line < index; line++) {
          offset += listLayoutInfoRef.current.lineHeights[line]
        }
        offset += (listLayoutInfoRef.current.lineHeights[line] ?? 0) / 2
        try {
          scrollCancelRef.current = scrollTo(flatListRef.current, scrollInfoRef.current, offset - scrollInfoRef.current.layoutMeasurement.height * 0.42, 600, () => {
            scrollCancelRef.current = null
          })
        } catch {}
      } else {
        if (scrollCancelRef.current) {
          scrollCancelRef.current()
          scrollCancelRef.current = null
        }
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.42,
          })
        } catch {}
      }
    }
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollInfoRef.current = nativeEvent
    if (isPauseScrollRef.current) {
      playLineRef.current?.updateScrollInfo(nativeEvent)
    }
  }
  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    playLineRef.current?.setVisible(true)
    if (delayScrollTimeout.current) {
      clearTimeout(delayScrollTimeout.current)
      delayScrollTimeout.current = null
    }
    if (scrollTimoutRef.current) {
      clearTimeout(scrollTimoutRef.current)
      scrollTimoutRef.current = null
    }
    if (scrollCancelRef.current) {
      scrollCancelRef.current()
      scrollCancelRef.current = null
    }
  }

  const onScrollEndDrag = () => {
    if (!isPauseScrollRef.current) return
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      playLineRef.current?.setVisible(false)
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      if (!playerState.isPlay) return
      handleScrollToActive()
    }, 3000)
  }


  useEffect(() => {
    return () => {
      if (delayScrollTimeout.current) {
        clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = null
      }
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // linesRef.current = lyricLines
    listLayoutInfoRef.current.lineHeights = []
    lineRef.current.prevLine = 0
    lineRef.current.line = 0
    if (!flatListRef.current) return
    flatListRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (!lyricLines.length) return
    playLineRef.current?.updateLyricLines(lyricLines)
    requestAnimationFrame(() => {
      if (isFirstSetLrc.current) {
        isFirstSetLrc.current = false
        setTimeout(() => {
          isPauseScrollRef.current = false
          handleScrollToActive()
        }, 100)
      } else {
        if (delayScrollTimeout.current) clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = setTimeout(() => {
          handleScrollToActive(0)
        }, 100)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyricLines])

  useEffect(() => {
    if (activeLine < 0) return
    lineRef.current.prevLine = lineRef.current.line
    lineRef.current.line = activeLine
    if (!flatListRef.current || isPauseScrollRef.current) return

    if (activeLine - lineRef.current.prevLine != 1) {
      handleScrollToActive()
      return
    }

    delayScrollTimeout.current = setTimeout(() => {
      delayScrollTimeout.current = null
      handleScrollToActive()
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLine])

  useEffect(() => {
    requestAnimationFrame(() => {
      playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
      playLineRef.current?.updateLyricLines(lyricLines)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowLyricProgressSetting])

  const handleScrollToIndexFailed: FlatListType['onScrollToIndexFailed'] = (info) => {
    void wait().then(() => {
      handleScrollToActive(info.index)
    })
  }

  const handleLineLayout = useCallback<LineProps['onLayout']>((lineNum, height) => {
    listLayoutInfoRef.current.lineHeights[lineNum] = height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handleSpaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    containerWidthRef.current = nativeEvent.layout.width
    listLayoutInfoRef.current.spaceHeight = nativeEvent.layout.height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handlePlayLine = useCallback((time: number) => {
    playLineRef.current?.setVisible(false)
    global.app_event.setProgress(time)
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    // 逐字模式下 lyricLines 已全部为 WordLyricLine，所有行都走逐字组件（非当前行在组件内按纯文本渲染）
    if (isWordMode) {
      return (
        <WordLrcLine line={item as unknown as WordLyricLine} lineNum={index} activeLine={activeLine} time={time} textAlign={textAlign} alignProgress={alignProgress} targetAlign={latestAlignRef.current} containerWidth={containerWidthRef.current} onLayout={handleLineLayout} />
      )
    }
    return (
      <LrcLine line={item} lineNum={index} activeLine={activeLine} textAlign={textAlign} alignProgress={alignProgress} targetAlign={latestAlignRef.current} containerWidth={containerWidthRef.current} onLayout={handleLineLayout} />
    )
  }
  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const spaceComponent = useMemo(() => (
    <View style={styles.space} onLayout={handleSpaceLayout}></View>
  ), [handleSpaceLayout])

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={lyricLines}
          renderItem={renderItem}
          keyExtractor={getkey}
          ref={flatListRef}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={spaceComponent}
          ListFooterComponent={spaceComponent}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          fadingEdgeLength={100}
          initialNumToRender={Math.max(activeLine + 10, 10)}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          onScroll={handleScroll}
        />
      </View>
      { isShowLyricProgressSetting ? <PlayLine ref={playLineRef} onPlayLine={handlePlayLine} /> : null }
    </>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  space: {
    paddingTop: '100%',
  },
  line: {
    paddingTop: 10,
    paddingBottom: 10,
    // opacity: 0,
  },
  lineText: {
    textAlign: 'center',
    // fontSize: 16,
    // lineHeight: 20,
    // paddingTop: 5,
    // paddingBottom: 5,
    // opacity: 0,
  },
  lineTranslationText: {
    textAlign: 'center',
    // fontSize: 13,
    // lineHeight: 17,
    paddingTop: 5,
    // paddingBottom: 5,
  },
  // 逐字歌词：整行文本宽度测量（隐藏），供对齐切换动画计算位移
  measureText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  // 逐字歌词：一行内所有字的容器，按对齐方式分布
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent 由对齐方式动态设置
  },
  // 逐字歌词：单个字的容器（相对定位，承载未唱整字与已唱裁切层）
  word: {
    position: 'relative',
  },
  wordText: {
    // fontSize / lineHeight / color 由调用方按设置传入
  },
  // 逐字歌词：已唱亮色裁切层，宽度 = 字宽 × 播放进度
  wordPlayedClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
})
