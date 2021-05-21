import React, { useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'

import Header from '../components/Header'
// import Aside from './components/Aside'
// import Main from './components/Main'
import Player from './Player'
import { useGetter, useDispatch } from '@/store'
import PagerView from 'react-native-pager-view'
import Pic from './Pic'

export default () => {
  const theme = useGetter('common', 'theme')

  const onPageScrollStateChanged = useCallback(({ nativeEvent }) => {
    // console.log(nativeEvent)
    if (nativeEvent.pageScrollState != 'idle') return
    console.log(nativeEvent.pageScrollState)
  }, [])

  return (
    <>
      <Header />
      <View style={{ flex: 1, flexDirection: 'column', height: '100%', backgroundColor: theme.primary }}>
        <PagerView
          // onPageSelected={onPageSelected}
          onPageScrollStateChanged={onPageScrollStateChanged}
          style={styles.pagerView}
        >
          <View collapsable={false} key="1" style={styles.pageStyle}>
            <Pic />
          </View>
        </PagerView>
        <View style={styles.player}>
          <Player />
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: '#fff',
  },
  pagerView: {
    flex: 1,
  },
  player: {
    flex: 0,
  },
})
