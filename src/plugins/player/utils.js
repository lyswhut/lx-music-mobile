import TrackPlayer, { useTrackPlayerProgress } from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
import { defaultUrl } from '@/config'

const defaultUserAgent = 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36'
const httpRxp = /^(https?:\/\/.+|\/.+)/

export const buildTracks = (musicInfo, type, url) => {
  const track = []
  if (url) {
    track.push({
      id: `${musicInfo.source}__//${musicInfo.songmid}__//${type}__//${Math.random()}__//${url}`,
      url,
      title: musicInfo.name || 'Unknow',
      artist: musicInfo.singer || 'Unknow',
      album: musicInfo.albumName || null,
      artwork: httpRxp.test(musicInfo.img) ? musicInfo.img : null,
      userAgent: defaultUserAgent,
      original: { ...musicInfo },
    })
  }
  track.push({
    id: `${musicInfo.source}__//${musicInfo.songmid}__//${type}__//${Math.random()}__//default`,
    url: defaultUrl,
    title: musicInfo.name || 'Unknow',
    artist: musicInfo.singer || 'Unknow',
    album: musicInfo.albumName || null,
    artwork: httpRxp.test(musicInfo.img) ? musicInfo.img : null,
    original: { ...musicInfo },
  })
  return track
  // console.log('buildTrack', musicInfo.name, url)
}
export const buildTrack = (musicInfo, type, url) => {
  return url
    ? {
        id: `${musicInfo.source}__//${musicInfo.songmid}__//${type}__//${Math.random()}__//${url}`,
        url,
        title: musicInfo.name || 'Unknow',
        artist: musicInfo.singer || 'Unknow',
        album: musicInfo.albumName || null,
        artwork: httpRxp.test(musicInfo.img) ? musicInfo.img : null,
        userAgent: defaultUserAgent,
        original: { ...musicInfo },
      }
    : {
        id: `${musicInfo.source}__//${musicInfo.songmid}__//${type}__//${Math.random()}__//default`,
        url: defaultUrl,
        title: musicInfo.name || 'Unknow',
        artist: musicInfo.singer || 'Unknow',
        album: musicInfo.albumName || null,
        artwork: httpRxp.test(musicInfo.img) ? musicInfo.img : null,
        original: { ...musicInfo },
      }
}

export const isTempTrack = trackId => /\/\/default$/.test(trackId)

export const replacePlayTrack = async(newTrack, oldTrack) => {
  console.log('replaceTrack')
  await TrackPlayer.add(newTrack)
  await TrackPlayer.skip(newTrack.id)
  await TrackPlayer.remove(oldTrack.id)
}

// let timeout
// let isFirstPlay = true
// const updateInfo = async track => {
//   if (isFirstPlay) {
//     // timeout = setTimeout(() => {
//     await updateMusicInfo(track)
//     isFirstPlay = false
//     // }, 500)
//   }
// }

const handlePlayMusic = async(tracks, time) => {
  // console.log('playMusic=========>', tracks.map(track => track.id))
  // if (timeout) {
  //   clearTimeout(timeout)
  //   timeout = null
  // }
  // console.log(tracks)
  // console.log(tracks.map(track => track.id))
  // console.log(time)
  const track = tracks[0]
  const currentTrackId = await TrackPlayer.getCurrentTrack()
  await TrackPlayer.add(tracks)
  await TrackPlayer.skip(track.id)

  if (currentTrackId) {
    if (isTempTrack(track.id)) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.seekTo(time)
      await TrackPlayer.play()
    }
  } else {
    if (!isTempTrack(track.id)) {
      if (time) await TrackPlayer.seekTo(time)
      if (global.restorePlayInfo) {
        await TrackPlayer.pause()
        global.restorePlayInfo = null
      } else {
        await TrackPlayer.play()
      }
    }
  }

  const queue = await TrackPlayer.getQueue()
  if (queue.length > 2) {
    TrackPlayer.remove(queue.slice(0, queue.length - 2).map(t => t.id))
  }

  // if (!currentTrackId) {
  //   await TrackPlayer.add(track)
  //   await TrackPlayer.pause()
  //   await TrackPlayer.skip(track.id)
  //   if (track.url !== defaultUrl) {
  //     await TrackPlayer.play()
  //   }
  //   const trackIds = (await TrackPlayer.getQueue()).filter(s => s.id !== track.id).map(s => s.id)
  //   if (trackIds.length) await TrackPlayer.remove(trackIds)
  //   await updateInfo(track)
  //   return
  // }
  // // const currentTrack = await TrackPlayer.getTrack(currentTrackId)
  // await TrackPlayer.pause()
  // await TrackPlayer.seekTo(0)
  // if (currentTrackId == track.id) {
  //   if (track.url !== defaultUrl) {
  //     await TrackPlayer.play()
  //   }
  //   await updateInfo(track)
  //   return
  // }
  // await TrackPlayer.add(track)
  // await TrackPlayer.skip(track.id)
  // if (track.url !== defaultUrl) {
  //   await TrackPlayer.play()
  // }
  // await TrackPlayer.remove(currentTrackId)
  // await updateInfo(track)
}


// 解决快速切歌导致的通知栏歌曲信息与当前播放歌曲对不上的问题
const debouncePlayMusicTools = {
  prevPlayMusicPromise: Promise.resolve(),
  trackInfo: {},
  isDebounced: false,
  delay: 1000,
  delayTimer: null,
  debounce(fn, delay = 100) {
    let timer = null
    let _args = null
    return (...args) => {
      if (!this.isDebounced && _args != null) this.isDebounced = true
      _args = args
      if (this.delayTimer) {
        BackgroundTimer.clearTimeout(this.delayTimer)
        this.delayTimer = null
      }
      if (timer) BackgroundTimer.clearTimeout(timer)
      timer = BackgroundTimer.setTimeout(() => {
        timer = null
        let args = _args
        _args = null
        fn(...args)
      }, delay)
    }
  },
  delayUpdateMusicInfo() {
    if (this.delayTimer) BackgroundTimer.clearTimeout(this.delayTimer)
    this.delayTimer = BackgroundTimer.setTimeout(() => {
      this.delayTimer = null
      if (this.trackInfo.tracks && this.trackInfo.tracks.length) updateMusicInfo(this.trackInfo.tracks[0])
    }, this.delay)
  },
  init() {
    return this.debounce((tracks, time) => {
      tracks = [...tracks]
      this.trackInfo.tracks = tracks
      this.trackInfo.time = time
      return this.prevPlayMusicPromise.then(() => {
        // console.log('run')
        if (this.trackInfo.tracks === tracks) {
          this.prevPlayMusicPromise = handlePlayMusic(tracks, time).then(() => {
            if (this.isDebounced) {
              this.delayUpdateMusicInfo()
              this.isDebounced = false
            }
          })
        }
      })
    }, 200)
  },
}

export const playMusic = debouncePlayMusicTools.init()

export const updateMusicInfo = async track => {
  const queue = await TrackPlayer.getQueue()
  const targetTrack = queue.find(t => t.id === track.id)
  if (!targetTrack) return
  console.log('+++++updateMusicPic+++++', track.artwork)
  await TrackPlayer.updateMetadataForTrack(track.id, {
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.artwork,
    original: { ...track.original },
  })
}


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
export const playState = callback => TrackPlayer.addEventListener('playback-state', callback)

export const updateOptions = (options = {
  // Whether the player should stop running when the app is closed on Android
  // stopWithApp: true,

  // An array of media controls capabilities
  // Can contain CAPABILITY_PLAY, CAPABILITY_PAUSE, CAPABILITY_STOP, CAPABILITY_SEEK_TO,
  // CAPABILITY_SKIP_TO_NEXT, CAPABILITY_SKIP_TO_PREVIOUS, CAPABILITY_SET_RATING
  capabilities: [
    TrackPlayer.CAPABILITY_PLAY,
    TrackPlayer.CAPABILITY_PAUSE,
    TrackPlayer.CAPABILITY_STOP,
    TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
    TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
  ],

  notificationCapabilities: [
    TrackPlayer.CAPABILITY_PLAY,
    TrackPlayer.CAPABILITY_PAUSE,
    TrackPlayer.CAPABILITY_STOP,
    TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
    TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
  ],

  // // An array of capabilities that will show up when the notification is in the compact form on Android
  compactCapabilities: [
    TrackPlayer.CAPABILITY_PLAY,
    TrackPlayer.CAPABILITY_STOP,
    TrackPlayer.CAPABILITY_PAUSE,
    TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
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

export {
  useTrackPlayerProgress,
}
