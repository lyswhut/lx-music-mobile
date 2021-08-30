import TrackPlayer from 'react-native-track-player'
import service from './service'
import { updateOptions } from './utils'

// const listenEvent = () => {
//   TrackPlayer.addEventListener('playback-error', err => {
//     console.log('playback-error', err)
//   })
//   TrackPlayer.addEventListener('playback-state', info => {
//     console.log('playback-state', info)
//   })
//   TrackPlayer.addEventListener('playback-track-changed', info => {
//     console.log('playback-track-changed', info)
//   })
//   TrackPlayer.addEventListener('playback-queue-ended', info => {
//     console.log('playback-queue-ended', info)
//   })
// }

const initial = async({ cacheSize, isHandleAudioFocus }) => {
  if (global.playerStatus.isIniting || global.playerStatus.isInitialized) return
  global.playerStatus.isIniting = true
  console.log('Cache Size', cacheSize * 1024)
  await TrackPlayer.setupPlayer({
    maxCacheSize: cacheSize * 1024,
    maxBuffer: 1000,
    waitForBuffer: true,
    handleAudioFocus: isHandleAudioFocus,
    autoUpdateMetadata: false,
  })
  global.playerStatus.isInitialized = true
  global.playerStatus.isIniting = false
  await updateOptions()
  // listenEvent()
}


const registerPlaybackService = async() => {
  if (global.playerStatus.isRegisteredService) return
  console.log('handle registerPlaybackService...')
  await TrackPlayer.registerPlaybackService(() => service)
  global.playerStatus.isRegisteredService = true
}

const isInitialized = () => global.playerStatus.isInitialized


export {
  registerPlaybackService,
  initial,
  isInitialized,
}
