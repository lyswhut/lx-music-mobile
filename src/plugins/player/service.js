import TrackPlayer from 'react-native-track-player'
import { getStore } from '@/store'
import { action as playerAction, STATUS } from '@/store/modules/player'
import { isTempTrack } from './utils'
import { play as lrcPlay, pause as lrcPause } from '@/plugins/lyric'
import { exitApp } from '@/utils/tools'

const store = getStore()

let isInitialized = false

let retryTrack = null
let retryGetUrlId = null
let retryGetUrlNum = 0
let trackId = ''
let errorTime = 0

// const updateTrackUrl = async track => {
//   const playInfo = track.id.split('__//')
//   const type = playInfo[2]
//   let url
//   const newMusicInfo = { ...track.original }
//   try {
//     url = await store.dispatch(playerAction.getUrl({
//       musicInfo: newMusicInfo,
//       type,
//     }))
//   } catch (err) {
//     console.log('err', err)
//     retryGetUrlNum++
//     if (retryGetUrlNum > 2) throw err
//     if (retryGetUrlId != track.id) throw new Error('跳过播放')
//     return updateTrackUrl(track)
//   }
//   newMusicInfo.typeUrl[type] = url
//   const newTrack = buildTrack(newMusicInfo)
//   await replacePlayTrack(newTrack, track)
//   return newTrack
// }
// const eventTool = {
//   events: {

//   },
//   addEventListener(name, handler) {
//     if (this.events[name]) return
//     TrackPlayer.addEventListener(name, handler)
//   },
//   clearEventListeners() {

//   },
// }

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
    await store.dispatch(playerAction.destroy())
    exitApp()
  })

  TrackPlayer.addEventListener('playback-error', async err => {
    console.log('playback-error', err)
    // console.log((await TrackPlayer.getQueue()))
    lrcPause()
    if (!retryTrack) errorTime = await TrackPlayer.getPosition()
    retryTrack = await TrackPlayer.getTrack(await TrackPlayer.getCurrentTrack())
    await TrackPlayer.skipToNext()
  })
  TrackPlayer.addEventListener('playback-state', async info => {
    const state = store.getState()
    if (state.player.isGettingUrl) return
    // let trackInfo = await TrackPlayer.getCurrentTrack()
    // console.log(trackId)
    if (trackId && trackId.endsWith('//default')) return
    switch (info.state) {
      case TrackPlayer.STATE_NONE:
        // console.log('state', 'STATE_NONE')
        break
      case TrackPlayer.STATE_READY:
        // console.log('state', 'STATE_READY')
        // store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
        lrcPause()
        break
      case TrackPlayer.STATE_PLAYING:
        retryTrack = null
        // console.log('state', 'STATE_PLAYING')
        store.dispatch(playerAction.setStatus({ status: STATUS.playing, text: '播放中...' }))
        TrackPlayer.getPosition().then(position => {
          lrcPlay(position * 1000)
        })
        break
      case TrackPlayer.STATE_PAUSED:
        // console.log('state', 'STATE_PAUSED')
        store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
        lrcPause()
        break
      case TrackPlayer.STATE_STOPPED:
        switch (state.player.status) {
          case STATUS.none:
            break

          default:
            store.dispatch(playerAction.setStatus({ status: STATUS.stop, text: '已停止' }))
            break
        }
        // console.log('state', 'STATE_STOPPED')
        lrcPause()
        break
      case TrackPlayer.STATE_BUFFERING:
        store.dispatch(playerAction.setStatus({ status: STATUS.buffering, text: '缓冲中...' }))
        // console.log('state', 'STATE_BUFFERING')
        lrcPause()
        break
      case TrackPlayer.STATE_CONNECTING:
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
        // console.log('state', 'STATE_CONNECTING')
        break

      default:
        console.log('playback-state', info)
        break
    }
  })
  TrackPlayer.addEventListener('playback-track-changed', async info => {
    // console.log('nextTrack====>', info)
    if (global.isPlayedExit) { // 销毁播放器并退出
      TrackPlayer.pause()
      store.dispatch(playerAction.destroy()).finally(() => {
        exitApp()
      })
      return
    }
    trackId = await TrackPlayer.getCurrentTrack()
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
