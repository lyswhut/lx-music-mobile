import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import TimeoutExit from './TimeoutExit'

export default () => {
  return (
    <View style={styles.container}>
      <TimeoutExit />
      <PlayModeBtn />
      <MusicAddBtn />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
