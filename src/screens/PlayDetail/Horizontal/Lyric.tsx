import React, { memo, useMemo, useEffect, useRef } from 'react'
import { View, FlatList, type FlatListProps } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { type Line, useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { createStyle } from '@/utils/tools'
// import { useComponentIds } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'
// import { screenkeepAwake } from '@/utils/nativeModules/utils'
// import { log } from '@/utils/log'
// import { toast } from '@/utils/tools'

type FlatListType = FlatListProps<Line>


const LrcLine = memo(({ line, lineNum, activeLine }: {
  line: Line
  lineNum: number
  activeLine: number
}) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.horizontal.style.lrcFontSize')
  const textAlign = useSettingValue('playDetail.style.align')
  const size = lrcFontSize / 10
  const lineHeight = setSpText(size) * 1.25

  // textBreakStrategy="simple" 用于解决某些设备上字体被截断的问题
  // https://stackoverflow.com/a/72822360
  return (
    <View style={styles.line}>
      <Text style={{
        ...styles.lineText,
        textAlign,
        lineHeight,
      }} textBreakStrategy="simple" color={activeLine == lineNum ? theme['c-primary'] : theme['c-350']} size={size}>{line.text}</Text>
      {
        line.extendedLyrics.map((lrc, index) => {
          return (<Text style={{
            ...styles.lineTranslationText,
            textAlign,
            lineHeight: lineHeight * 0.8,
          }} textBreakStrategy="simple" key={index} color={activeLine == lineNum ? theme['c-primary-alpha-200'] : theme['c-350']} size={size * 0.8}>{lrc}</Text>)
        })
      }
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.line === nextProps.line &&
    prevProps.activeLine != nextProps.lineNum &&
    nextProps.activeLine != nextProps.lineNum
})
const wait = async() => new Promise(resolve => setTimeout(resolve, 100))

export default () => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const flatListRef = useRef<FlatList>(null)
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef(0)
  const isFirstSetLrc = useRef(true)
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
  const handleScrollToActive = (index = lineRef.current) => {
    if (index < 0) return
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.4,
        })
      } catch {}
    }
  }

  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
  }

  const onScrollEndDrag = () => {
    if (!isPauseScrollRef.current) return
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      handleScrollToActive()
    }, 3000)
  }


  useEffect(() => {
    return () => {
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // linesRef.current = lyricLines
    if (!flatListRef.current) return
    flatListRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (isFirstSetLrc.current) {
      isFirstSetLrc.current = false
      setTimeout(() => {
        isPauseScrollRef.current = false
        handleScrollToActive()
      }, 100)
    } else {
      handleScrollToActive(0)
    }
  }, [lyricLines])

  useEffect(() => {
    lineRef.current = line
    if (!flatListRef.current || isPauseScrollRef.current) return
    handleScrollToActive()
  }, [line])

  const handleScrollToIndexFailed: FlatListType['onScrollToIndexFailed'] = (info) => {
    // console.log(info)
    void wait().then(() => {
      handleScrollToActive(info.index)
    })
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    return (
      <LrcLine line={item} lineNum={index} activeLine={line} />
    )
  }
  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const spaceComponent = useMemo(() => (
    <View style={styles.space}></View>
  ), [])

  return (
    <FlatList
      data={lyricLines}
      renderItem={renderItem}
      keyExtractor={getkey}
      style={styles.container}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={spaceComponent}
      ListFooterComponent={spaceComponent}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      fadingEdgeLength={100}
      initialNumToRender={Math.max(line + 10, 10)}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
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
    paddingTop: '80%',
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
})
