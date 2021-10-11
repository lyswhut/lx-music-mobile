import React, { useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import PagerView from 'react-native-pager-view'
import Search from '../Search'
import SongList from '../SongList'
import Top from '../Top'
import List from '../List'
import Download from '../Download'
import Setting from '../Setting'
import { subscribe, useGetter, useDispatch, getStore } from '@/store'
import { AppColors, BorderWidths } from '@/theme'

// import musicSearch from '../../utils/music/tx/musicSearch'

const SearchPage = () => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  const initedRef = useRef(false)
  const search = useMemo(() => <Search />, [])
  switch (activeIndex) {
    case 0:
    // case 1:
      if (!initedRef.current) initedRef.current = true
      return search
    case 4:
      initedRef.current = false
      return null
    default:
      return initedRef.current ? search : null
  }
}
const SongListPage = () => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  const initedRef = useRef(false)
  const songList = useMemo(() => <SongList />, [])
  switch (activeIndex) {
    // case 0:
    case 1:
    // case 2:
      if (!initedRef.current) initedRef.current = true
      return songList
    case 4:
      initedRef.current = false
      return null
    default:
      return initedRef.current ? songList : null
  }
  // return activeIndex == 1 || activeIndex == 0  ? SongList : null
}
const TopPage = () => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  const initedRef = useRef(false)
  const top = useMemo(() => <Top />, [])
  switch (activeIndex) {
    // case 1:
    case 2:
    // case 3:
      if (!initedRef.current) initedRef.current = true
      return top
    case 4:
      initedRef.current = false
      return null
    default:
      return initedRef.current ? top : null
  }
  // return activeIndex == 0 || activeIndex == 1 ? top : null
}
const ListPage = () => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  const initedRef = useRef(false)
  const list = useMemo(() => <List />, [])
  switch (activeIndex) {
    // case 2:
    case 3:
    // case 4:
      if (!initedRef.current) initedRef.current = true
      return list
    default:
      return initedRef.current ? list : null
  }
  // return activeIndex == 0 || activeIndex == 1 ? list : null
}
const SettingPage = () => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  const initedRef = useRef(false)
  const setting = useMemo(() => <Setting />, [])
  switch (activeIndex) {
    // case 3:
    case 4:
      if (!initedRef.current) initedRef.current = true
      return setting
    default:
      return initedRef.current ? setting : null
  }
  // return activeIndex == 0 || activeIndex == 1 ? setting : null
}


const Main = () => {
  const unSubscribeRef = useRef()
  const pagerViewRef = useRef()
  // const isScrollingRef = useRef(false)
  const scrollPositionRef = useRef(-1)
  const activeIndexRef = useRef(getStore().getState().common.nav.activeIndex)
  const setNavActiveIndex = useDispatch('common', 'setNavActiveIndex')

  // const handlePageScroll = useCallback(({ nativeEvent }) => {
  //   console.log(nativeEvent.offset, activeIndexRef.current)
  //   // if (activeIndexRef.current == -1) return
  //   // if (nativeEvent.offset == 0) {
  //   //   isScrollingRef.current = false

  //   //   const index = nativeEvent.position
  //   //   if (activeIndexRef.current == index) return
  //   //   activeIndexRef.current = index
  //   //   setNavActiveIndex(index)
  //   // } else if (!isScrollingRef.current) {
  //   //   isScrollingRef.current = true
  //   // }
  // }, [setNavActiveIndex])

  const onPageSelected = useCallback(({ nativeEvent }) => {
    scrollPositionRef.current = nativeEvent.position
  }, [])

  const onPageScrollStateChanged = useCallback(({ nativeEvent }) => {
    // console.log(nativeEvent)
    if (nativeEvent.pageScrollState != 'idle') return
    if (scrollPositionRef.current != getStore().getState().common.nav.activeIndex) {
      setNavActiveIndex(scrollPositionRef.current)
    }
    // if (activeIndexRef.current == -1) return
    // if (nativeEvent.offset == 0) {
    //   isScrollingRef.current = false

    //   const index = nativeEvent.position
    //   if (activeIndexRef.current == index) return
    //   activeIndexRef.current = index
    //   setNavActiveIndex(index)
    // } else if (!isScrollingRef.current) {
    //   isScrollingRef.current = true
    // }
  }, [setNavActiveIndex])

  const setActivePage = index => {
    // console.log('setActivePage', index)
    if (activeIndexRef.current == index) return
    activeIndexRef.current = index
    // if (index >= pagerViewRef.current.props.children.length) return
    pagerViewRef.current.setPage(index)
  }

  useEffect(() => {
    // window.requestAnimationFrame(() => pagerViewRef.current && pagerViewRef.current.setPage(activeIndexRef.current))
    unSubscribeRef.current = subscribe('common.nav.activeIndex', ({ common: { nav } }) => {
      // console.log('subscribe', nav.activeIndex)
      setActivePage(nav.activeIndex)
    })
    return () => {
      unSubscribeRef.current()
    }
  }, [])


  const component = useMemo(() => (
    <View style={{ ...styles.container }}>
      <PagerView ref={pagerViewRef}
        initialPage={activeIndexRef.current}
        // onPageScroll={handlePageScroll}
        // offscreenPageLimit={2}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
        style={styles.pagerView}
      >
        <View collapsable={false} key="1" style={styles.pageStyle}>
          <SearchPage />
        </View>
        <View collapsable={false} key="2" style={styles.pageStyle}>
          <SongListPage />
        </View>
        <View collapsable={false} key="3" style={styles.pageStyle}>
          <TopPage />
        </View>
        <View collapsable={false} key="4" style={styles.pageStyle}>
          <ListPage />
        </View>
        {/* <View collapsable={false} key="5" style={styles.pageStyle}>
          <Download />
        </View> */}
        <View collapsable={false} key="6" style={styles.pageStyle}>
          <SettingPage />
        </View>
      </PagerView>
    </View>
  ), [onPageSelected, onPageScrollStateChanged])

  return component
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pagerView: {
    flex: 1,
  },
  pageStyle: {
    // alignItems: 'center',
    // padding: 20,
  },
})

export default Main

