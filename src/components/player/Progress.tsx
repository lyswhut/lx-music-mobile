import React, { memo, useMemo } from 'react'
import { View, Pressable, type GestureResponderEvent } from 'react-native'
import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW } from '@/utils/pixelRatio'
// import { AppColors } from '@/theme'


const DefaultBar = memo(() => {
  const theme = useTheme()

  return <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-100-alpha-800'], position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

// const BufferedBar = memo(({ bufferedProgress }) => {
//   // console.log(bufferedProgress)
//   const theme = useTheme()
//   return <View style={{ ...styles.progressBar, backgroundColor: theme.secondary45, position: 'absolute', width: bufferedProgress + '%', left: 0, top: 0 }}></View>
// })

const PreassBar = memo(({ duration }: { duration: number }) => {
  const { onLayout, ...layout } = useLayout()
  const handlePress = (event: GestureResponderEvent) => {
    global.app_event.setProgress(event.nativeEvent.locationX / layout.width * duration)
  }

  return <Pressable onPress={handlePress} onLayout={onLayout} style={styles.pressBar} />
})


const Progress = ({ progress, duration }: {
  progress: number
  duration: number
}) => {
  // const { progress } = usePlayTimeBuffer()
  const theme = useTheme()
  // console.log(progress)
  const progressStr = `${progress * 100}%`

  const progressDotStyle = useMemo(() => {
    return {
      width: progressDotSize,
      height: progressDotSize,
      borderRadius: progressDotSize,
      position: 'absolute',
      right: -progressDotSize / 2,
      top: -(progressDotSize - progressHeight) / 2,
      backgroundColor: theme['c-primary-light-100'],
      zIndex: 9,
    } as const
  }, [theme])

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar />
        {/* <BufferedBar bufferedProgress={bufferedProgress} /> */}
        <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-100-alpha-400'], width: progressStr, position: 'absolute', left: 0, top: 0 }}>
          <Pressable style={{ ...styles.progressDot, ...progressDotStyle }}></Pressable>
        </View>
      </View>
      <PreassBar duration={duration} />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}


const progressContentPadding = 9
const progressHeight = 3
const progressDotSize = scaleSizeW(8)
const styles = createStyle({
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
