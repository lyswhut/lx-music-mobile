import React, { memo } from 'react'
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native'
import { useLayout } from '@/utils/hooks'
import { useGetter, useDispatch } from '@/store'
// import { AppColors } from '@/theme'


const DefaultBar = memo(() => {
  const theme = useGetter('common', 'theme')

  return <View style={{ ...styles.progressBar, backgroundColor: theme.borderColor2, position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

const BufferedBar = memo(({ bufferedProgress }) => {
  const theme = useGetter('common', 'theme')
  return <View style={{ ...styles.progressBar, backgroundColor: theme.borderColor2, position: 'absolute', width: bufferedProgress + '%', left: 0, top: 0 }}></View>
})

const PreassBar = memo(({ duration }) => {
  const { onLayout, ...layout } = useLayout()
  const setProgress = useDispatch('player', 'setProgress')
  const handlePress = event => {
    setProgress(event.nativeEvent.locationX / layout.width * duration)
  }

  return <Pressable onPress={handlePress} onLayout={onLayout} style={styles.pressBar} />
})


const Progress = ({ progress, bufferedProgress, duration }) => {
  // const { progress } = usePlayTimeBuffer()
  const theme = useGetter('common', 'theme')
  // console.log(progress)
  const progressStr = progress + '%'

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar />
        <BufferedBar bufferedProgress={bufferedProgress} />
        <View style={{ ...styles.progressBar, backgroundColor: theme.secondary30, width: progressStr, position: 'absolute', left: 0, top: 0 }}>
          <Pressable style={{ ...styles.progressDot, backgroundColor: theme.secondary10 }}></Pressable>
        </View>
      </View>
      <PreassBar duration={duration} />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}


const progressContentPadding = 10
const progressHeight = 3
const progressDotSize = 10
const styles = StyleSheet.create({
  progress: {
    width: '100%',
    height: progressContentPadding * 2 + progressHeight,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressBar: {
    height: progressHeight,
    borderRadius: 4,
  },
  progressDot: {
    width: progressDotSize,
    height: progressDotSize,
    borderRadius: progressDotSize,
    position: 'absolute',
    right: -progressDotSize / 2,
    top: -(progressDotSize - progressHeight) / 2,
    zIndex: 9,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    height: progressContentPadding * 2 + progressHeight,
    width: '100%',
  },
})

export default Progress
