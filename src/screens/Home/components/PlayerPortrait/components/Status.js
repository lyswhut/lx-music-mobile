import React, { memo, useMemo } from 'react'
import { Text } from 'react-native'
import { useGetter } from '@/store'
import { STATUS } from '@/store/modules/player'
import { useLrcPlay } from '@/plugins/lyric'


export default memo(() => {
  const theme = useGetter('common', 'theme')
  const playStatus = useGetter('player', 'status')
  const statusText = useGetter('player', 'statusText')
  const { text } = useLrcPlay()
  const status = useMemo(() => playStatus == STATUS.playing
    ? text
    : (
        (playStatus == STATUS.pause || playStatus == STATUS.stop) && text
          ? text
          : statusText
      ), [playStatus, statusText, text])
  return <Text numberOfLines={1} style={{ fontSize: 10, color: theme.normal10 }}>{status}</Text>
})

// const styles = StyleSheet.create({

// })
