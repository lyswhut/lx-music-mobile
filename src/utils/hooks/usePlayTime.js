// import { useMemo } from 'react'
import { useTrackPlayerProgress } from '@/plugins/player/hook'
import { formatPlayTime2 } from '@/utils'
// import { useGetter } from '@/store'
// import { STATE_PLAYING, STATE_BUFFERING } from 'react-native-track-player'

export default () => {
  const { position, bufferedPosition, duration } = useTrackPlayerProgress(250)
  // const isGettingUrl = useGetter('player', 'isGettingUrl')

  return {
    curTimeStr: formatPlayTime2(position),
    maxTimeStr: formatPlayTime2(duration),
    time: position,
    duration,
    bufferedProgress: duration ? bufferedPosition / duration * 100 : 100,
    progress: duration ? position / duration * 100 : 0,
  }
}
