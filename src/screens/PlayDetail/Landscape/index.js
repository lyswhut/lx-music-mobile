import React, { memo, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/utils'
import { onNavigationComponentDidDisappearEvent } from '@/navigation'

import Header from './components/Header'
import Pic from './Pic'
import Title from './Title'
import Lyric from './Lyric'
import Player from './Player'
import MoreBtn from './MoreBtn'

export default memo(({ componentId, animated }) => {
  const theme = useGetter('common', 'theme')
  const componentIds = useGetter('common', 'componentIds')

  useEffect(() => {
    let listener
    if (componentIds.comment) {
      screenUnkeepAwake()
      listener = onNavigationComponentDidDisappearEvent(componentIds.comment, () => {
        screenkeepAwake()
      })
    }
    return () => {
      if (listener) listener.remove()
    }
  }, [componentIds])

  useEffect(() => {
    screenkeepAwake()
    return () => {
      screenUnkeepAwake()
    }
  }, [])
  const component = useMemo(() => {
    return (
      <>
        <Header />
        <View style={{ flex: 1, backgroundColor: theme.primary }}>
          <View style={styles.container}>
            <View style={styles.left}>
              <Pic componentId={componentId} animated={animated} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} nativeID="pageIndicator">
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
  }, [animated, componentId, theme])
  return component
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
