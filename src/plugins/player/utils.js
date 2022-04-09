import TrackPlayer, { Capability } from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
import { playMusic as handlePlayMusic } from './playList'


export { useProgress } from './hook'

const emptyIdRxp = /\/\/default$/
const tempIdRxp = /\/\/default$|\/\/default\/\/restorePlay$/
export const isEmpty = (trackId = global.playerTrackId) => emptyIdRxp.test(trackId)
export const isTempId = (trackId = global.playerTrackId) => tempIdRxp.test(trackId)

// export const replacePlayTrack = async(newTrack, oldTrack) => {
//   console.log('replaceTrack')
//   await TrackPlayer.add(newTrack)
//   await TrackPlayer.skip(newTrack.id)
//   await TrackPlayer.remove(oldTrack.id)
// }

// let timeout
// let isFirstPlay = true
// const updateInfo = async track => {
//   if (isFirstPlay) {
//     // timeout = setTimeout(() => {
//     await delayUpdateMusicInfo(track)
//     isFirstPlay = false
//     // }, 500)
//   }
// }


// 解决快速切歌导致的通知栏歌曲信息与当前播放歌曲对不上的问题
// const debouncePlayMusicTools = {
//   prevPlayMusicPromise: Promise.resolve(),
//   trackInfo: {},
//   isDelayUpdate: false,
//   isDebounced: false,
//   delay: 1000,
//   delayTimer: null,
//   debounce(fn, delay = 100) {
//     let timer = null
//     let _tracks = null
//     let _time = null
//     return (tracks, time) => {
//       if (!this.isDebounced && _tracks != null) this.isDebounced = true
//       _tracks = tracks
//       _time = time
//       if (timer) {
//         BackgroundTimer.clearTimeout(timer)
//         timer = null
//       }
//       if (this.isDelayUpdate) {
//         if (this.updateDelayTimer) {
//           BackgroundTimer.clearTimeout(this.updateDelayTimer)
//           this.updateDelayTimer = null
//         }
//         timer = BackgroundTimer.setTimeout(() => {
//           timer = null
//           let tracks = _tracks
//           let time = _time
//           _tracks = null
//           _time = null
//           this.isDelayUpdate = false
//           fn(tracks, time)
//         }, delay)
//       } else {
//         this.isDelayUpdate = true
//         fn(tracks, time)
//         this.updateDelayTimer = BackgroundTimer.setTimeout(() => {
//           this.updateDelayTimer = null
//           this.isDelayUpdate = false
//         }, this.delay)
//       }
//     }
//   },
//   delayUpdateMusicInfo() {
//     if (this.delayTimer) BackgroundTimer.clearTimeout(this.delayTimer)
//     this.delayTimer = BackgroundTimer.setTimeout(() => {
//       this.delayTimer = null
//       if (this.trackInfo.tracks && this.trackInfo.tracks.length) delayUpdateMusicInfo(this.trackInfo.tracks[0])
//     }, this.delay)
//   },
//   init() {
//     return this.debounce((tracks, time) => {
//       tracks = [...tracks]
//       this.trackInfo.tracks = tracks
//       this.trackInfo.time = time
//       return this.prevPlayMusicPromise.then(() => {
//         // console.log('run')
//         if (this.trackInfo.tracks === tracks) {
//           this.prevPlayMusicPromise = handlePlayMusic(tracks, time).then(() => {
//             if (this.isDebounced) {
//               this.delayUpdateMusicInfo()
//               this.isDebounced = false
//             }
//           })
//         }
//       })
//     }, 200)
//   },
// }

export const playMusic = ((fn, delay = 800) => {
  let delayTimer = null
  let isDelayRun = false
  let timer = null
  let _tracks = null
  let _time = null
  return (tracks, time) => {
    _tracks = tracks
    _time = time
    if (timer) {
      BackgroundTimer.clearTimeout(timer)
      timer = null
    }
    if (isDelayRun) {
      if (delayTimer) {
        BackgroundTimer.clearTimeout(delayTimer)
        delayTimer = null
      }
      timer = BackgroundTimer.setTimeout(() => {
        timer = null
        let tracks = _tracks
        let time = _time
        _tracks = null
        _time = null
        isDelayRun = false
        fn(tracks, time)
      }, delay)
    } else {
      isDelayRun = true
      fn(tracks, time)
      delayTimer = BackgroundTimer.setTimeout(() => {
        delayTimer = null
        isDelayRun = false
      }, 500)
    }
  }
})((tracks, time) => {
  handlePlayMusic(tracks, time)
})

export const play = () => TrackPlayer.play()
export const getPosition = () => TrackPlayer.getPosition()
export const stop = () => TrackPlayer.stop()
export const pause = () => TrackPlayer.pause()
// export const skipToNext = () => TrackPlayer.skipToNext()
export const seekTo = time => TrackPlayer.seekTo(time)

export const resetPlay = async() => Promise.all([pause(), seekTo(0)])

export const destroy = async() => {
  if (global.playerStatus.isIniting || !global.playerStatus.isInitialized) return
  await TrackPlayer.destroy()
  global.playerStatus.isInitialized = false
}


/**
 * Subscription player state chuange event
 * @param {*} callback state change event
 * @returns remove event function
 */
// export const playState = callback => TrackPlayer.addEventListener('playback-state', callback)

export const updateOptions = (options = {
  // Whether the player should stop running when the app is closed on Android
  // stopWithApp: true,

  // An array of media controls capabilities
  // Can contain CAPABILITY_PLAY, CAPABILITY_PAUSE, CAPABILITY_STOP, CAPABILITY_SEEK_TO,
  // CAPABILITY_SKIP_TO_NEXT, CAPABILITY_SKIP_TO_PREVIOUS, CAPABILITY_SET_RATING
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.Stop,
    Capability.SeekTo,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],

  notificationCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.Stop,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],

  // // An array of capabilities that will show up when the notification is in the compact form on Android
  compactCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.Stop,
    Capability.SkipToNext,
  ],

  // Icons for the notification on Android (if you don't like the default ones)
  // playIcon: require('./play-icon.png'),
  // pauseIcon: require('./pause-icon.png'),
  // stopIcon: require('./stop-icon.png'),
  // previousIcon: require('./previous-icon.png'),
  // nextIcon: require('./next-icon.png'),
  // icon: notificationIcon, // The notification icon
}) => {
  return TrackPlayer.updateOptions(options)
}

// export const setMaxCache = async size => {
//   // const currentTrack = await TrackPlayer.getCurrentTrack()
//   // if (!currentTrack) return
//   // console.log(currentTrack)
//   // const currentTime = await TrackPlayer.getPosition()
//   // const state = await TrackPlayer.getState()
//   // await stop()
//   // await TrackPlayer.destroy()
//   // await TrackPlayer.setupPlayer({ maxCacheSize: size * 1024, maxBuffer: 1000, waitForBuffer: true })
//   // await updateOptions()
//   // await TrackPlayer.seekTo(currentTime)
//   // switch (state) {
//   //   case TrackPlayer.STATE_PLAYING:
//   //   case TrackPlayer.STATE_BUFFERING:
//   //     await TrackPlayer.play()
//   //     break
//   //   default:
//   //     break
//   // }
// }

// export {
//   useProgress,
// }
