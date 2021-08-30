// import { useMemo } from 'react'
import { useProgress } from '@/plugins/player/utils'
import { formatPlayTime2 } from '@/utils'
// import { useGetter } from '@/store'
// import { STATE_PLAYING, STATE_BUFFERING } from 'react-native-track-player'

export default () => {
  const { position, buffered, duration } = useProgress(250)
  // const isGettingUrl = useGetter('player', 'isGettingUrl')

  return {
    curTimeStr: formatPlayTime2(position),
    maxTimeStr: formatPlayTime2(duration),
    time: position,
    duration,
    bufferedProgress: duration ? buffered / duration * 100 : 100,
    progress: duration ? position / duration * 100 : 0,
  }
}
