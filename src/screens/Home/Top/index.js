import React, { useCallback, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import MusicList from './MusicList'
import LeftBar from './LeftBar'


export default () => {
  return (
    <View style={styles.container}>
      <LeftBar />
      <MusicList />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
})
