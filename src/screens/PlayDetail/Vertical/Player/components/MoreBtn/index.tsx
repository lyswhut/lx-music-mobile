import { createStyle } from '@/utils/tools'
import React from 'react'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import TimeoutExitBtn from './TimeoutExitBtn'
import CommentBtn from './CommentBtn'

export default () => {
  return (
    <View style={styles.container}>
      <TimeoutExitBtn />
      <MusicAddBtn />
      <PlayModeBtn />
      <CommentBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    // flexShrink: 0,
    // flexGrow: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
