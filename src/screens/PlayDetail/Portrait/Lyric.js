import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useGetter } from '@/store'
// import { useLayout } from '@/utils/hooks'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'
// import { log } from '@/utils/log'
// import { toast } from '@/utils/tools'

const LrcLine = memo(({ lrc, line, activeLine }) => {
  const theme = useGetter('common', 'theme')
  const playerPortraitStyle = useGetter('common', 'playerPortraitStyle')

  return (
    <View style={styles.line}>
      <Text style={{
        ...styles.lineText,
        fontSize: playerPortraitStyle.lrcFontSize / 10,
        lineHeight: playerPortraitStyle.lrcFontSize / 10 * 1.25,
        color: activeLine == line ? theme.secondary : theme.normal50,
      }}>{lrc.text}</Text>
      {
        lrc.extendedLyrics.map((lrc, index) => {
          return (<Text style={{
            ...styles.lineTranslationText,
            fontSize: playerPortraitStyle.lrcFontSize / 10 * 0.8,
            lineHeight: playerPortraitStyle.lrcFontSize / 10 * 0.8 * 1.25,
            color: activeLine == line ? theme.secondary : theme.normal50,
          }} key={index}>{lrc}</Text>)
        })
      }
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.text == nextProps.text &&
  prevProps.line == nextProps.line &&
  prevProps.activeLine != nextProps.line &&
  nextProps.activeLine != nextProps.line
})
const wait = () => new Promise(resolve => setTimeout(resolve, 100))

export default memo(() => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const scrollViewRef = useRef()
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef(null)
  const lineRef = useRef(0)
  const linesRef = useRef([])
  const isFirstSetLrc = useRef(true)
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
  const handleScrollToActive = useCallback((index = lineRef.current) => {
    if (index < 0) return
    if (scrollViewRef.current) {
      try {
        scrollViewRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.4,
        })
      } catch (err) {
        console.log(err)
        // toast('出了点意外...你可以去错误日志查看错误', 'long')
        // log.warn('Scroll failed: ', err.message)
      }
    }
  }, [])

  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      handleScrollToActive()
    }, 3000)
  }

  const handleScrollToIndexFailed = (info) => {
    // console.log(info)
    wait().then(() => {
      handleScrollToActive(info.index)
    })
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
    linesRef.current = lyricLines
    if (!scrollViewRef.current || !scrollViewRef.current.props.data.length) return
    scrollViewRef.current.scrollToOffset({
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
  }, [handleScrollToActive, lyricLines])

  useEffect(() => {
    lineRef.current = line
    if (!scrollViewRef.current || isPauseScrollRef.current) return
    handleScrollToActive()
  }, [handleScrollToActive, line])


  const handleRenderItem = ({ item, index }) => {
    return (
      <LrcLine lrc={item} line={index} activeLine={line} />
    )
  }

  const spaceComponent = useMemo(() => (
    <View style={styles.space}></View>
  ), [])

  return (
    <FlatList
      data={lyricLines}
      renderItem={handleRenderItem}
      keyExtractor={(item, index) => index}
      style={styles.container}
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={spaceComponent}
      ListFooterComponent={spaceComponent}
      onScrollBeginDrag={handleScrollBeginDrag}
      fadingEdgeLength={200}
      initialNumToRender={Math.max(line + 10, 10)}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  space: {
    paddingTop: '80%',
  },
  line: {
    paddingTop: 8,
    paddingBottom: 8,
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
