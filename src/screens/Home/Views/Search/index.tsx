import React, { useRef, useEffect } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'

// import music from '@/utils/musicSdk'
// import InsetShadow from 'react-native-inset-shadow'
// import TipList from './components/TipList'
// import MusicList from './components/MusicList'
import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import searchState, { type SearchType } from '@/store/search/state'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import TipList, { type TipListType } from './TipList'
import List, { type ListType } from './List'
import { addHistoryWord } from '@/core/search/search'


interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const searchTipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)
  const layoutHeightRef = useRef<number>(0)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    void getSearchSetting().then(info => {
      // info.type = 'music'
      searchInfo.current.temp_source = info.temp_source
      searchInfo.current.source = info.source
      searchInfo.current.searchType = info.type
      switch (info.type) {
        case 'music':
          headerBarRef.current?.setSourceList(searchMusicState.sources, info.source)
          break
        case 'songlist':
          headerBarRef.current?.setSourceList(searchSonglistState.sources, info.source)
          break
      }
      headerBarRef.current?.setText(searchState.searchText)
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, searchInfo.current.searchType)
    })

    const handleTypeChange = (type: SearchType) => {
      searchInfo.current.searchType = type
      void saveSearchSetting({ type })
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, type)
    }
    global.app_event.on('searchTypeChanged', handleTypeChange)

    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
    }
  }, [])


  const handleLayout = (e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    searchInfo.current.source = source
    void saveSearchSetting({ source })
    listRef.current?.loadList(searchState.searchText, source, searchInfo.current.searchType)
  }
  const handleTempSearch: HeaderBarProps['onTempSearch'] = (text) => {
    setTimeout(() => {
      searchTipListRef.current?.search(text, layoutHeightRef.current)
    }, 500)
  }
  const handleHideTipList = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    searchTipListRef.current?.hide()
  }
  const handleSearch: HeaderBarProps['onSearch'] = (text) => {
    handleHideTipList()
    searchTipListRef.current?.search(text, layoutHeightRef.current)
    headerBarRef.current?.setText(text)
    headerBarRef.current?.blur()
    void addHistoryWord(text)
    listRef.current?.loadList(text, searchInfo.current.source, searchInfo.current.searchType)
  }
  const handleShowTipList: HeaderBarProps['onShowTipList'] = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      searchTipListRef.current?.show(layoutHeightRef.current)
    }, 500)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSourceChange={handleSourceChange}
        onTempSearch={handleTempSearch}
        onSearch={handleSearch}
        onHideTipList={handleHideTipList}
        onShowTipList={handleShowTipList}
      />
      <View style={styles.content} onLayout={handleLayout}>
        <TipList ref={searchTipListRef} onSearch={handleSearch} />
        <List ref={listRef} onSearch={handleSearch} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
