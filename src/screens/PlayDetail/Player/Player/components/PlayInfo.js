import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { usePlayTime } from '@/utils/hooks'
import { useGetter } from '@/store'

import Progress from '@/components/player/Progress'
import Status from './Status'

const PlayTimeCurrent = ({ timeStr }) => {
  const theme = useGetter('common', 'theme')
  // console.log(timeStr)
  return <Text style={{ fontSize: 14, color: theme.normal10 }}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }) => {
  const theme = useGetter('common', 'theme')
  return <Text style={{ fontSize: 14, color: theme.normal10 }}>{timeStr}</Text>
})

export default () => {
  const { curTimeStr, maxTimeStr, progress, bufferedProgress, duration } = usePlayTime()

  return (
    <>
      <View style={styles.progress}><Progress progress={progress} bufferedProgress={bufferedProgress} duration={duration} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexGrow: 1, flexShrink: 1, paddingRight: 5 }} >
          <Status />
        </View>
        <View style={{ flexGrow: 0, flexShrink: 0, flexDirection: 'row' }} >
          <PlayTimeCurrent timeStr={curTimeStr} />
          <Text style={{ fontSize: 14 }}> / </Text>
          <PlayTimeMax timeStr={maxTimeStr} />
        </View>
      </View>
    </>
  )
}


const styles = StyleSheet.create({
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    // height:
    // position: 'absolute',
    // width: '100%',
    // top: 0,
  },
})
