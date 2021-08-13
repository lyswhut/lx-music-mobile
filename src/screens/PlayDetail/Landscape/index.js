import React, { memo, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/utils'

import Header from './components/Header'
import Pic from './Pic'
import Title from './Title'
import Lyric from './Lyric'
import Player from './Player'
import MoreBtn from './MoreBtn'

export default memo(({ componentId }) => {
  const theme = useGetter('common', 'theme')
  useEffect(() => {
    screenkeepAwake()
    return () => {
      screenUnkeepAwake()
    }
  }, [])
  return (
    <>
      <Header />
      <View style={{ flex: 1, backgroundColor: theme.primary }}>
        <View style={styles.container}>
          <View style={styles.left}>
            <Pic componentId={componentId} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Title />
              <View>
                <MoreBtn />
              </View>
            </View>
          </View>
          <View style={styles.right}>
            <Lyric />
          </View>
        </View>
        <Player />
      </View>
    </>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    flex: 1,
    width: '45%',
    paddingLeft: 20,
    // backgroundColor: '#eee',
  },
  right: {
    width: '55%',
    flexGrow: 0,
    flexShrink: 0,
  },
})
