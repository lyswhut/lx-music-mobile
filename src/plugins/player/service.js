import TrackPlayer, { State as TPState, Event as TPEvent } from 'react-native-track-player'
import { getStore } from '@/store'
import { action as playerAction, STATUS } from '@/store/modules/player'
import { isTempId, isEmpty } from './utils'
import { play as lrcPlay, pause as lrcPause } from '@/utils/lyric'
import { exitApp } from '@/utils/common'
import { getCurrentTrackId, getCurrentTrack, delayUpdateMusicInfo, buildTrack } from './playList'

const store = getStore()

let isInitialized = false

let retryTrack = null
let retryGetUrlId = null
let retryGetUrlNum = 0
let errorTime = 0
// let prevDuration = 0
// let isPlaying = false

// 销毁播放器并退出
const handleExitApp = async() => {
  global.isPlayedExit = false
  exitApp()
}

const updateMetaData = async isPlaying => {
  if (isPlaying == global.playInfo.isPlaying) {
    const duration = await TrackPlayer.getDuration()
    // console.log('currentIsPlaying', global.playInfo.duration, duration)
    if (global.playInfo.duration != duration) {
      global.playInfo.duration = duration
      const trackInfo = await getCurrentTrack()
      if (trackInfo && global.playInfo.currentPlayMusicInfo) {
        delayUpdateMusicInfo(buildTrack({ musicInfo: global.playInfo.currentPlayMusicInfo, type: trackInfo.type, url: trackInfo.url, duration }))
      }
    }
  } else {
    const [duration, trackInfo] = await Promise.all([TrackPlayer.getDuration(), getCurrentTrack()])
    global.playInfo.duration = duration
    if (trackInfo && global.playInfo.currentPlayMusicInfo) {
      delayUpdateMusicInfo(buildTrack({ musicInfo: global.playInfo.currentPlayMusicInfo, type: trackInfo.type, url: trackInfo.url, duration }))
    }
  }
}

export default async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener(TPEvent.RemotePlay, () => {
    // console.log('remote-play')
    // TrackPlayer.play()
    store.dispatch(playerAction.playMusic())
  })

  TrackPlayer.addEventListener(TPEvent.RemotePause, () => {
    console.log('remote-pause')
    store.dispatch(playerAction.pauseMusic())
    // TrackPlayer.pause()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteNext, () => {
    console.log('remote-next')
    store.dispatch(playerAction.playNext())
    // TrackPlayer.skipToNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePrevious, () => {
    console.log('remote-previous')
    store.dispatch(playerAction.playPrev())
    // TrackPlayer.skipToPrevious()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteStop, async() => {
    console.log('remote-stop')
    handleExitApp()
  })

  // TrackPlayer.addEventListener(TPEvent.RemoteDuck, async({ permanent, paused, ducking }) => {
  //   console.log('remote-duck')
  //   if (paused) {
  //     store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
  //     lrcPause()
  //   } else {
  //     store.dispatch(playerAction.setStatus({ status: STATUS.playing, text: '播放中...' }))
  //     TrackPlayer.getPosition().then(position => {
  //       lrcPlay(position * 1000)
  //     })
  //   }
  // })

  TrackPlayer.addEventListener(TPEvent.PlaybackError, async err => {
    console.log('playback-error', err)
    // console.log((await TrackPlayer.getQueue()))
    lrcPause()
    if (!retryTrack) errorTime = await TrackPlayer.getPosition()
    retryTrack = await getCurrentTrack()
    await TrackPlayer.skipToNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteSeek, async({ position }) => {
    // console.log(position)
    store.dispatch(playerAction.setProgress(position))
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackState, async info => {
    const state = store.getState()
    console.log('playback-state', TPState[info.state])

    // console.log((await getCurrentTrack())?.id)
    if (state.player.isGettingUrl) return
    if (isTempId()) return
    let currentIsPlaying = false

    switch (info.state) {
      case TPState.None:
        // console.log('state', 'State.NONE')
        break
      case TPState.Ready:
        // console.log('state', 'State.READY')
        // store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
        lrcPause()
        break
      case TPState.Playing:
        retryTrack = null
        // console.log('state', 'State.PLAYING')
        store.dispatch(playerAction.setStatus({ status: STATUS.playing, text: '播放中...' }))
        TrackPlayer.getPosition().then(position => {
          lrcPlay(position * 1000)
        })
        currentIsPlaying = true
        break
      case TPState.Paused:
        // console.log('state', 'State.PAUSED')
        store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
        lrcPause()
        break
      case TPState.Stopped:
        switch (state.player.status) {
          case STATUS.none:
            break

          default:
            store.dispatch(playerAction.setStatus({ status: STATUS.stop, text: '已停止' }))
            break
        }
        // console.log('state', 'State.STOPPED')
        lrcPause()
        break
      case TPState.Buffering:
        store.dispatch(playerAction.setStatus({ status: STATUS.buffering, text: '缓冲中...' }))
        // console.log('state', 'State.BUFFERING')
        lrcPause()
        break
      case TPState.Connecting:
        switch (state.player.status) {
          case STATUS.none:
          case STATUS.pause:
          case STATUS.stop:
            break

          default:
            store.dispatch(playerAction.setStatus({ text: '加载中...' }))
            break
        }
        lrcPause()
        // console.log('state', 'State.CONNECTING')
        break

      default:
        console.log('playback-state', info)
        break
    }
    if (global.isPlayedExit) return handleExitApp()

    // console.log('currentIsPlaying', currentIsPlaying, global.playInfo.isPlaying)
    await updateMetaData(currentIsPlaying)
  })
  TrackPlayer.addEventListener(TPEvent.PlaybackTrackChanged, async info => {
    // console.log('nextTrack====>', info)
    if (global.isPlayedExit) return handleExitApp()

    global.playerTrackId = await getCurrentTrackId()
    if (isEmpty()) {
      console.log('====TEMP PAUSE====')
      TrackPlayer.pause()
      if (retryTrack) {
        if (retryTrack.musicId == retryGetUrlId) {
          if (++retryGetUrlNum > 1) {
            store.dispatch(playerAction.playNext())
            retryGetUrlId = null
            retryTrack = null
            return
          }
        } else {
          retryGetUrlId = retryTrack.musicId
          retryGetUrlNum = 0
        }
        store.dispatch(playerAction.refreshMusicUrl(global.playInfo.currentPlayMusicInfo, errorTime))
      } else {
        store.dispatch(playerAction.playNext())
      }
    }
  //   // if (!info.nextTrack) return
  //   // if (info.track) {
  //   //   const track = info.track.substring(0, info.track.lastIndexOf('__//'))
  //   //   const nextTrack = info.track.substring(0, info.nextTrack.lastIndexOf('__//'))
  //   //   console.log(nextTrack, track)
  //   //   if (nextTrack == track) return
  //   // }
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // let newTrack
  //   // if (track.url == defaultUrl) {
  //   //   TrackPlayer.pause().then(async() => {
  //   //     isRefreshUrl = true
  //   //     retryGetUrlId = track.id
  //   //     retryGetUrlNum = 0
  //   //     try {
  //   //       newTrack = await updateTrackUrl(track)
  //   //       console.log('++++newTrack++++', newTrack)
  //   //     } catch (error) {
  //   //       console.log('error', error)
  //   //       if (error.message != '跳过播放') TrackPlayer.skipToNext()
  //   //       isRefreshUrl = false
  //   //       retryGetUrlId = null
  //   //       return
  //   //     }
  //   //     retryGetUrlId = null
  //   //     isRefreshUrl = false
  //   //     console.log(await TrackPlayer.getQueue(), null, 2)
  //   //     await TrackPlayer.play()
  //   //   })
  //   // }
  //   // store.dispatch(playerAction.playNext())
  })
  // TrackPlayer.addEventListener('playback-queue-ended', async info => {
  //   // console.log('playback-queue-ended', info)
  //   store.dispatch(playerAction.playNext())
  //   // if (!info.nextTrack) return
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // // if (track.url == defaultUrl) {
  //   // //   TrackPlayer.pause()
  //   // //   getMusicUrl(track.original).then(url => {
  //   // //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   // //       url,
  //   // //     })
  //   // //     TrackPlayer.play()
  //   // //   })
  //   // // }
  //   // if (!track.artwork) {
  //   //   getMusicPic(track.original).then(url => {
  //   //     console.log(url)
  //   //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   //       artwork: url,
  //   //     })
  //   //   })
  //   // }
  // })
  // TrackPlayer.addEventListener('playback-destroy', async() => {
  //   console.log('playback-destroy')
  //   store.dispatch(playerAction.destroy())
  // })
  isInitialized = true
}
