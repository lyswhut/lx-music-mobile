import { memo } from 'react'
import { View } from 'react-native'

import Progress from './Progress'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

// const FONT_SIZE = 13

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  // console.log(timeStr)
  return <Text color={theme['c-500']}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  return <Text color={theme['c-500']}>{timeStr}</Text>
})

export default () => {
  const theme = useTheme()
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  // console.log('render playInfo')

  return (
    <View style={styles.container}>
      <View style={styles.progress}><Progress progress={progress} duration={maxPlayTime} /></View>
      <View style={styles.info}>
        <View style={styles.status} >
          <Status />
        </View>
        <View style={{ flexGrow: 0, flexShrink: 0, flexDirection: 'row' }} >
          <PlayTimeCurrent timeStr={nowPlayTimeStr} />
          <Text color={theme['c-500']}> / </Text>
          <PlayTimeMax timeStr={maxPlayTimeStr} />
        </View>
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    paddingLeft: 15,
  },
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
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
