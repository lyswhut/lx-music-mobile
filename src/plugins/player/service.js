import TrackPlayer, { State as TPState } from 'react-native-track-player'
import { getStore } from '@/store'
import { action as playerAction, STATUS } from '@/store/modules/player'
import { isTempTrack } from './utils'
import { play as lrcPlay, pause as lrcPause } from '@/utils/lyric'
import { exitApp } from '@/utils/common'
import { getCurrentTrackId, getCurrentTrack } from './playList'

const store = getStore()

let isInitialized = false

let retryTrack = null
let retryGetUrlId = null
let retryGetUrlNum = 0
let trackId = ''
let errorTime = 0

// 销毁播放器并退出
const handleExitApp = async() => {
  global.isPlayedExit = false
  exitApp()
}

export default async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener('remote-play', () => {
    // console.log('remote-play')
    // TrackPlayer.play()
    store.dispatch(playerAction.playMusic())
  })

  TrackPlayer.addEventListener('remote-pause', () => {
    console.log('remote-pause')
    store.dispatch(playerAction.pauseMusic())
    // TrackPlayer.pause()
  })

  TrackPlayer.addEventListener('remote-next', () => {
    console.log('remote-next')
    store.dispatch(playerAction.playNext())
    // TrackPlayer.skipToNext()
  })

  TrackPlayer.addEventListener('remote-previous', () => {
    console.log('remote-previous')
    store.dispatch(playerAction.playPrev())
    // TrackPlayer.skipToPrevious()
  })

  TrackPlayer.addEventListener('remote-stop', async() => {
    console.log('remote-stop')
    handleExitApp()
  })

  TrackPlayer.addEventListener('remote-duck', async({ permanent, paused, ducking }) => {
    console.log('remote-duck')
    if (paused) {
      store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
      lrcPause()
    } else {
      store.dispatch(playerAction.setStatus({ status: STATUS.playing, text: '播放中...' }))
      TrackPlayer.getPosition().then(position => {
        lrcPlay(position * 1000)
      })
    }
  })

  TrackPlayer.addEventListener('playback-error', async err => {
    console.log('playback-error', err)
    // console.log((await TrackPlayer.getQueue()))
    lrcPause()
    if (!retryTrack) errorTime = await TrackPlayer.getPosition()
    retryTrack = await getCurrentTrack()
    await TrackPlayer.skipToNext()
  })
  TrackPlayer.addEventListener('playback-state', async info => {
    const state = store.getState()
    if (state.player.isGettingUrl) return
    // let trackInfo = await TrackPlayer.getCurrentTrack()
    // console.log(trackId)
    if (trackId && trackId.endsWith('//default')) return
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
  })
  TrackPlayer.addEventListener('playback-track-changed', async info => {
    // console.log('nextTrack====>', info)
    if (global.isPlayedExit) return handleExitApp()

    trackId = await getCurrentTrackId()
    if (trackId && isTempTrack(trackId)) {
      console.log('====TEMP PAUSE====')
      TrackPlayer.pause()
      if (retryTrack) {
        if (retryTrack.id == retryGetUrlId) {
          if (++retryGetUrlNum > 1) {
            store.dispatch(playerAction.playNext())
            retryGetUrlId = null
            retryTrack = null
            return
          }
        } else {
          retryGetUrlId = retryTrack.id
          retryGetUrlNum = 0
        }
        store.dispatch(playerAction.refreshMusicUrl(retryTrack.original, errorTime))
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
