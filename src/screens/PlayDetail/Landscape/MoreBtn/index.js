import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import TimeoutExit from './TimeoutExit'
import { useDimensions } from '@/utils/hooks'

export default () => {
  const { window } = useDimensions()
  const width = useMemo(() => window.width * 0.4 * 0.4 * 0.3 * 0.6, [window.width])

  return (
    <View style={styles.container}>
      <TimeoutExit width={width} />
      <PlayModeBtn width={width} />
      <MusicAddBtn width={width} />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    width: '40%',
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
