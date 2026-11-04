import { addListeningDuration } from '@/utils/data'
import playerState from '@/store/player/state'
import BackgroundTimer from 'react-native-background-timer'

const FLUSH_INTERVAL = 10

export default () => {
  let trackingInterval: number | null = null
  let accumulatedSeconds = 0

  const flushDuration = () => {
    if (accumulatedSeconds <= 0) return
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo || !('source' in musicInfo)) return

    const seconds = accumulatedSeconds
    accumulatedSeconds = 0
    void addListeningDuration(
      {
        id: musicInfo.id,
        name: musicInfo.name,
        singer: musicInfo.singer,
        source: musicInfo.source,
      },
      seconds,
    )
  }

  const clearTracking = () => {
    if (!trackingInterval) return
    BackgroundTimer.clearInterval(trackingInterval)
    trackingInterval = null
  }

  const startTracking = () => {
    clearTracking()
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo || playerState.playMusicInfo.isTempPlay) return

    trackingInterval = BackgroundTimer.setInterval(() => {
      accumulatedSeconds += 1
      if (accumulatedSeconds >= FLUSH_INTERVAL) {
        flushDuration()
      }
    }, 1000)
  }

  const stopTracking = () => {
    clearTracking()
    flushDuration()
  }

  const handlePlay = () => {
    startTracking()
  }

  const handlePause = () => {
    stopTracking()
  }

  const handleStop = () => {
    stopTracking()
  }

  const handleError = () => {
    stopTracking()
  }

  const handleMusicToggled = () => {
    stopTracking()
  }

  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handleStop)
  global.app_event.on('error', handleError)
  global.app_event.on('musicToggled', handleMusicToggled)
}
