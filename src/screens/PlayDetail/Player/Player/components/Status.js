import React, { memo, useMemo } from 'react'
import { Text } from 'react-native'
import { useGetter } from '@/store'
import { STATUS } from '@/store/modules/player'


export default memo(() => {
  const theme = useGetter('common', 'theme')
  const playStatus = useGetter('player', 'status')
  const statusText = useGetter('player', 'statusText')
  const status = useMemo(() => {
    switch (playStatus) {
      case STATUS.playing:
      case STATUS.pause:
      case STATUS.stop:
        return ''
      default: return statusText
    }
  }, [playStatus, statusText])
  return <Text numberOfLines={1} style={{ fontSize: 13, color: theme.normal10 }}>{status}</Text>
})

// const styles = StyleSheet.create({

// })
