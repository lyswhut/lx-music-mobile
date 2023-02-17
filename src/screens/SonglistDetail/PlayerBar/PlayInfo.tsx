import React, { memo } from 'react'
import { View } from 'react-native'

import Progress from '@/components/player/Progress'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

const FONT_SIZE = 13

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  // console.log(timeStr)
  return <Text size={FONT_SIZE} color={theme['c-500']}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  return <Text size={FONT_SIZE} color={theme['c-500']}>{timeStr}</Text>
})

export default () => {
  const theme = useTheme()
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()

  return (
    <>
      <View style={styles.progress}><Progress progress={progress} duration={maxPlayTime} /></View>
      <View style={styles.info}>
        {/* <MusicName /> */}
        <View style={styles.status}>
          <Status />
        </View>
        <View style={{ flexGrow: 0, flexShrink: 0, flexDirection: 'row' }} >
          <PlayTimeCurrent timeStr={nowPlayTimeStr} />
          <Text size={FONT_SIZE} color={theme['c-500']}> / </Text>
          <PlayTimeMax timeStr={maxPlayTimeStr} />
        </View>
      </View>
    </>
  )
}


const styles = createStyle({
  progress: {
    height: 16,
    // flexGrow: 0,
    flexShrink: 0,
    // flexDirection: 'column',
    justifyContent: 'center',
    // alignItems: 'center',
    // marginBottom: -1,
    // backgroundColor: '#ccc',
    // overflow: 'hidden',
    // height:
    // position: 'absolute',
    // width: '100%',
    // top: 0,
  },
  info: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: '#ccc',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 5,
  },
})
