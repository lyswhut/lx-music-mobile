import { memo, useCallback, useEffect, useRef } from 'react'
import { View, PanResponder } from 'react-native'
import { useDrag } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
// import { scaleSizeW } from '@/utils/pixelRatio'
// import { AppColors } from '@/theme'


const DefaultBar = memo(() => {
  const theme = useTheme()

  return <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-600-alpha-900'], position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

// const BufferedBar = memo(({ bufferedProgress }) => {
//   // console.log(bufferedProgress)
//   const theme = useTheme()
//   return <View style={{ ...styles.progressBar, backgroundColor: theme.secondary45, position: 'absolute', width: bufferedProgress + '%', left: 0, top: 0 }}></View>
// })

const PreassBar = memo(({ duration }: { duration: number }) => {
  const theme = useTheme()
  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const {
    onLayout,
    draging,
    dragProgress,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, []))
  // const handlePress = useCallback((event: GestureResponderEvent) => {
  //   onPress(event.nativeEvent.locationX)
  // }, [onPress])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      // onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(evt.nativeEvent.locationX, gestureState)
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      // onPanResponderTerminate: (evt, gestureState) => {
      //   onDragEnd()
      // },
    }),
  ).current


  return <View
    onLayout={onLayout}
    style={styles.pressBar}
    // on={handleScrollBeginDrag}
    // onScrollEndDrag={onScrollEndDrag}
    {...panResponder.panHandlers}
  >
    <View
      style={{
        ...styles.progressBar,
        backgroundColor: draging ? theme['c-primary-light-200-alpha-900'] : 'transparent',
        width: `${dragProgress * 100}%`,
      }}
    />
    </View>
})


const Progress = ({ progress, duration }: {
  progress: number
  duration: number
}) => {
  // const { progress } = usePlayTimeBuffer()
  const theme = useTheme()
  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar />
        {/* <BufferedBar bufferedProgress={bufferedProgress} /> */}
        <View style={{
          ...styles.progressBar,
          backgroundColor: theme['c-primary-light-200-alpha-900'],
          width: progressStr,
        }}>
        </View>
      </View>
      <PreassBar duration={duration} />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}


// const progressContentPadding = 9
// const progressHeight = 3
const styles = createStyle({
  progress: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    // height: progressContentPadding * 2 + progressHeight,
    height: '100%',
    width: '100%',
  },
})

export default Progress
