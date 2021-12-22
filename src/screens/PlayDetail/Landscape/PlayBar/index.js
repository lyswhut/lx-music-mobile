import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { usePlayTime, useDimensions } from '@/utils/hooks'
import { useGetter } from '@/store'

import Progress from './Progress'
import Status from './Status'

const PlayTimeCurrent = ({ timeStr, size }) => {
  const theme = useGetter('common', 'theme')
  // console.log(timeStr)
  return <Text style={{ fontSize: size, color: theme.normal10 }}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr, size }) => {
  const theme = useGetter('common', 'theme')
  return <Text style={{ fontSize: size, color: theme.normal10 }}>{timeStr}</Text>
})

export default () => {
  const { curTimeStr, maxTimeStr, progress, bufferedProgress, duration } = usePlayTime()
  const { window } = useDimensions()
  const size = useMemo(() => window.width * 0.4 * 0.4 * 0.14, [window.width])

  return (
    <View style={styles.container} nativeID="player">
      <View style={styles.progress}><Progress progress={progress} bufferedProgress={bufferedProgress} duration={duration} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexGrow: 1, flexShrink: 1, paddingRight: 5 }} >
          <Status />
        </View>
        <View style={{ flexGrow: 0, flexShrink: 0, flexDirection: 'row' }} >
          <PlayTimeCurrent size={size} timeStr={curTimeStr} />
          <Text style={{ fontSize: size }}> / </Text>
          <PlayTimeMax size={size} timeStr={maxTimeStr} />
        </View>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    paddingLeft: 15,
    // paddingRight: 15,
  },
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
