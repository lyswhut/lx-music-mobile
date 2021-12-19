import React, { memo, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/utils'
import { onNavigationComponentDidDisappearEvent } from '@/navigation'

import Header from './components/Header'
import Pic from './Pic'
import ControlBtn from './ControlBtn'
import Lyric from './Lyric'
import PlayBar from './PlayBar'
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
        <View style={{ ...styles.container, backgroundColor: theme.primary }}>
          <View style={styles.left}>
            <Pic componentId={componentId} animated={animated} />
            <View style={styles.controlBtn} nativeID="pageIndicator">
              <MoreBtn />
              <ControlBtn />
            </View>
            <PlayBar />
          </View>
          <View style={styles.right}>
            <Lyric />
          </View>
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
    // paddingLeft: 15,
    paddingBottom: 10,
    // backgroundColor: '#eee',
  },
  right: {
    width: '55%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: '#eee',
  },
})
