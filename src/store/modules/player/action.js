import { AppState } from 'react-native'
import music from '@/utils/music'
import { initial as msInitial, isInitialized } from '@/plugins/player'
import {
  playMusic as msPlayMusic,
  play,
  stop,
  pause,
  seekTo,
  resetPlay,
  getPosition,
  destroy as msDestroy,
} from '@/plugins/player/utils'
import {
  buildTrack,
  buildTracks,
  delayUpdateMusicInfo,
} from '@/plugins/player/playList'
import { getRandom } from '@/utils'
import { getMusicUrl, saveMusicUrl, getLyric, saveLyric, assertApiSupport, savePlayInfo, saveList } from '@/utils/tools'
import { playInfo as playInfoGetter } from './getter'
import { play as lrcPlay, setLyric, pause as lrcPause, toggleTranslation as lrcToggleTranslation } from '@/utils/lyric'
import { showLyric, hideLyric, setLyric as lrcdSetLyric, toggleLock, setTheme, setLyricTextPosition, setAlpha, setTextSize } from '@/utils/lyricDesktop'
import { action as listAction } from '@/store/modules/list'
import { LIST_ID_PLAY_LATER } from '@/config/constant'
// import { defaultList } from '../list/getter'

export const TYPES = {
  setPic: null,
  setList: null,
  setPlayIndex: null,
  addMusicToPlayedList: null,
  removeMusicFormPlayedList: null,
  clearPlayedList: null,
  visiblePlayerDetail: null,
  playNext: null,
  playPrev: null,
  setStatus: null,
  setGetingUrlState: null,
  setPlayMusicInfo: null,
  setTempPlayList: null,
  removeTempPlayList: null,
  clearTempPlayeList: null,
  updateListInfo: null,
}

export const STATUS = {
  none: 'NONE',
  playing: 'PLAYING',
  pause: 'PAUSE',
  stop: 'STOP',
  error: 'ERROR',
  buffering: 'BUFFERING',
  connecting: 'CONNECTING',
  gettingUrl: 'GETTING_URL',
}

for (const key of Object.keys(TYPES)) {
  TYPES[key] = `player__${key}`
}

let timeout
let _playMusicInfo = null
let playMusicId = null
// let nextMusic = null

const getPlayType = (state, songInfo) => {
  let type = '128k'
  const list = state.common.qualityList[songInfo.source]
  if (state.common.setting.player.isHighQuality && songInfo._types['320k'] && list && list.includes('320k')) type = '320k'
  return type
}

// const handleRestorePlay = (state, dispatch, playMusicInfo, musicInfo) => {
//   if (!musicInfo.img) {
//     dispatch(getPic(musicInfo)).then(async() => {
//       if (playMusicId != id) return
//       const musicUrl = await getMusicUrl(musicInfo, type)
//       if (musicUrl) {
//         console.log('+++updateMusicInfo+++')
//         // setTimeout(() => {
//         updateMusicInfo(buildTrack(musicInfo, type, musicUrl))
//         // }, 1000)
//       }
//     })
//   }
//   dispatch(getLrc(musicInfo)).then(({ lyric, tlyric }) => {
//     if (playMusicId != id) return
//     setLyric(lyric)
//     const player = getState().player
//     if (player.status == STATUS.playing && !player.isGettingUrl) {
//       getPosition().then(position => {
//         lrcPlay(position * 1000)
//       })
//     }
//   })
//   if (state.common.setting.player.togglePlayMethod == 'random') dispatch({ type: TYPES.addMusicToPlayedList, payload: playMusicInfo })
// }

const handlePlayMusic = async({ getState, dispatch, playMusicInfo, musicInfo, isRefresh = false, time = 0 }) => {
  const state = getState()

  // if (global.restorePlayInfo) {
  //   handleRestorePlay(state, dispatch, playMusicInfo, musicInfo)

  //   global.restorePlayInfo = null
  //   return
  // }

  const type = getPlayType(state, musicInfo)
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  setLyric('')
  console.log('Handle Play Music ====================>', musicInfo.name)
  _playMusicInfo = musicInfo
  let id = `${musicInfo.source}//${musicInfo.songmid}//${type}`
  playMusicId = id

  if (global.restorePlayInfo) {
    const track = buildTrack(musicInfo, type)
    delayUpdateMusicInfo(track)
    track.id += track.id + '//restorePlay'
    playMusicId = playMusicId + '//restorePlay'
    msPlayMusic([track])
    if (!isRefresh && state.common.setting.player.togglePlayMethod == 'random') dispatch({ type: TYPES.addMusicToPlayedList, payload: playMusicInfo })

    // console.log(musicInfo.img)
    if (!musicInfo.img) {
      dispatch(getPic(musicInfo)).then(async() => {
        const musicUrl = await getMusicUrl(musicInfo, type)
        if (playMusicId != id) return
        if (musicUrl) {
        // console.log('+++updateMusicInfo+++')
        // setTimeout(() => {
          delayUpdateMusicInfo(buildTrack(musicInfo, type, musicUrl))
        // }, 1000)
        }
      })
    }
    dispatch(getLrc(musicInfo)).then(({ lyric, tlyric }) => {
      if (playMusicId != id) return
      const player = getState().player
      setLyric(lyric, tlyric)
      if (player.status == STATUS.playing && !player.isGettingUrl) {
        getPosition().then(position => {
          lrcPlay(position * 1000)
        })
      }
    })
    return
  }

  dispatch(setGetingUrlState(true))
  dispatch(setStatus({
    status: STATUS.gettingUrl,
    text: '加载中...',
  }))
  delayUpdateMusicInfo(buildTrack(musicInfo, type))
  Promise.all([
    dispatch(getUrl({ musicInfo, type, isRefresh })),
    resetPlay(),
  ]).then(([url]) => {
    // console.log('url get done', getState().player.status)
    if (playMusicId != id) return
    switch (getState().player.status) {
      case STATUS.stop:
      case STATUS.pause:
        return
    }
    msPlayMusic(buildTracks(musicInfo, type, url, true), time)
  }).catch(err => {
    if (playMusicId != id) return
    dispatch(setStatus({ status: STATUS.error, text: err.message }))
    if (AppState.currentState == 'active') {
      console.log('wait 2s...')
      timeout = setTimeout(() => {
        console.log('play next music')
        dispatch(playNext())
      }, 2000)
    } else {
      console.log('play next music')
      dispatch(playNext())
    }
  }).finally(() => {
    if (playMusicId != id) return
    if (getState().player.isGettingUrl) dispatch(setGetingUrlState(false))
    // console.log('set url getting done')
  })
  // console.log(AppState.currentState)
  if (!isRefresh && !playMusicInfo.isTempPlay && state.common.setting.player.togglePlayMethod == 'random') dispatch({ type: TYPES.addMusicToPlayedList, payload: playMusicInfo })

  // console.log(musicInfo.img)
  if (!musicInfo.img) {
    dispatch(getPic(musicInfo)).then(async() => {
      if (playMusicId != id) return
      delayUpdateMusicInfo(buildTrack(musicInfo, type))
    })
  }
  dispatch(getLrc(musicInfo)).then(({ lyric, tlyric }) => {
    if (playMusicId != id) return
    const player = getState().player
    setLyric(lyric, tlyric)
    if (player.status == STATUS.playing && !player.isGettingUrl) {
      getPosition().then(position => {
        lrcPlay(position * 1000)
      })
    }
  })

  // nextMusic = getNextMusicInfo(state)
  const playInfo = playInfoGetter(getState())

  if (!playInfo.isTempPlay) {
    savePlayInfo({
      time: 0,
      maxTime: playInfo.musicInfo.interval || 0,
      listId: playInfo.listId,
      list: playInfo.listId == null ? playInfo.list : null,
      index: playInfo.playIndex,
    })
  }
}
/*
const getNextMusicInfo = state => {
  const currentMusic = state.player.listInfo.list[state.player.playIndex]
  let playedList = [...state.player.playedList]
  const currentList = state.player.listInfo.list
  if (state.common.setting.player.togglePlayMethod == 'random' && state.player.playedList.length) {
    let index = playedList.indexOf(currentMusic)
    index += 1
    while (true) {
      if (index < playedList.length) {
        const listIndex = currentList.indexOf(playedList[index])
        if (listIndex < 0) {
          playedList.splice(index, 1)
          continue
        }
        return currentList[listIndex]
      }
      break
    }
  }
  let list
  while (true) {
    const tempPlayedList = [...playedList]
    list = currentList.filter(s => {
      const index = tempPlayedList.indexOf(s)
      if (index > -1) {
        tempPlayedList.splice(index, 1)
        return false
      }
      return assertApiSupport(s.source)
    })

    if (!list.length && playedList.length) {
      playedList = []
      continue
    }
    break
  }

  if (!list.length) return null

  const playIndex = list.indexOf(currentMusic)
  let index
  // console.log(playIndex, list)
  switch (state.common.setting.player.togglePlayMethod) {
    case 'listLoop':
      index = playIndex === list.length - 1 ? 0 : playIndex + 1
      break
    case 'random':
      index = getRandom(0, list.length)
      break
    case 'list':
      index = playIndex === list.length - 1 ? -1 : playIndex + 1
      break
    case 'singleLoop':
      index = playIndex
      break
    default:
      return
  }
  if (index < 0) return null
  return list[index]
}
 */
export const stopMusic = () => async(dispatch, getState) => {
  _playMusicInfo = null
  dispatch(setPlayIndex(-1))
  dispatch(setStatus({ status: STATUS.stop, text: '' }))
  await stop()
}

export const pauseMusic = () => async(dispatch, getState) => {
  const state = getState()
  if (state.isGettingUrl) {
    dispatch(setStatus({ status: STATUS.pause, text: '已暂停' }))
    return
  }
  lrcPause()
  dispatch(setStatus({ status: STATUS.pause, text: '已暂停' }))
  await pause()
}

export const setStatus = ({ status, text }) => {
  console.log(status, text)
  return {
    type: TYPES.setStatus,
    payload: { status, text },
  }
}


const handleGetUrl = function(dispatch, listId, musicInfo, type, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getMusicUrl(musicInfo, type).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return dispatch(listAction.getOtherSource({ musicInfo: originMusic, listId })).then(otherSource => {
      console.log('find otherSource', otherSource.map(s => s.source))
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source) || !assertApiSupport(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return handleGetUrl(dispatch, listId, item, type, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}
const handleGetPic = function(dispatch, listId, musicInfo, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getPic(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return dispatch(listAction.getOtherSource({ musicInfo: originMusic, listId })).then(otherSource => {
      console.log('find otherSource', otherSource.map(s => s.source))
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return handleGetPic(dispatch, listId, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}
const handleGetLyric = function(dispatch, listId, musicInfo, retryedSource = [], originMusic) {
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getLyric(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return dispatch(listAction.getOtherSource({ musicInfo: originMusic, listId })).then(otherSource => {
      console.log('find otherSource', otherSource.map(s => s.source))
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return handleGetLyric(dispatch, listId, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

export const getUrl = ({ musicInfo, type, isRefresh }) => async(dispatch, getState) => {
  const cachedUrl = await getMusicUrl(musicInfo, type)
  if (cachedUrl && !isRefresh) {
    if (getState().player.isGettingUrl) dispatch(setGetingUrlState(false))
    return cachedUrl
  }
  dispatch(setStatus({
    status: STATUS.gettingUrl,
    text: isRefresh ? 'URL刷新中...' : 'URL获取中...',
  }))

  return handleGetUrl(dispatch, getState().player.listInfo.id, musicInfo, type).then(result => {
    saveMusicUrl(musicInfo, type, result.url)
    // console.log('get' + musicInfo.name + ' url success: ' + result.url)
    return result.url
  }).catch(err => {
    console.log('get' + musicInfo.name + ' url fail: ' + err.message)
    return Promise.reject(err)
  })
}

export const refreshMusicUrl = (musicInfo, restorePlayTime) => (dispatch, getState) => {
  const state = getState()
  const targetMusic = state.player.listInfo.list.find(s => s.songmid == musicInfo.songmid)
  if (!targetMusic) {
    console.log('[refreshMusicUrl]Not found target music: ', musicInfo.name)
    dispatch(playNext())
    return
  }
  const songmid = targetMusic.songmid
  const index = state.player.listInfo.list.findIndex(m => m.songmid == songmid)
  handlePlayMusic({
    getState,
    dispatch,
    index,
    musicInfo: targetMusic,
    isRefresh: true,
    time: restorePlayTime,
  })
}

export const playMusic = playMusicInfo => async(dispatch, getState) => {
  // console.log(playMusicInfo)
  const { player, common } = getState()

  if (!isInitialized()) {
    await msInitial({
      cacheSize: common.setting.player.cacheSize,
      isHandleAudioFocus: common.setting.player.isHandleAudioFocus,
    })
  }

  // 从暂停播放恢复播放
  if (playMusicInfo === undefined) {
    if (player.isGettingUrl || !_playMusicInfo) return
    // console.log(player.isGettingUrl, _playMusicInfo)
    if (/\/\/restorePlay$/.test(playMusicId) || player.status == STATUS.none) {
      handlePlayMusic({
        getState,
        dispatch,
        playMusicInfo: player.playMusicInfo,
        musicInfo: player.playMusicInfo.musicInfo,
      })
      return
    }
    console.log('play')
    await play()
    return
  }

  // 停止播放
  let playIndex = player.playIndex
  if (playMusicInfo === null) {
    playIndex = -1
    dispatch({
      type: TYPES.setPlayMusicInfo,
      payload: {
        playMusicInfo,
        playIndex,
      },
    })
    await stop()
  } else { // 设置歌曲信息并播放歌曲
    setLyric('')
    let listId = playMusicInfo.listId
    // console.log(playMusicInfo)
    if (listId != LIST_ID_PLAY_LATER && !playMusicInfo.isTempPlay && listId === player.listInfo.id) {
      const currentSongmid = playMusicInfo.musicInfo.songmid || playMusicInfo.musicInfo.musicInfo.songmid
      playIndex = player.listInfo.list.findIndex(m => (m.songmid || m.musicInfo.songmid) == currentSongmid)
    }
    dispatch({
      type: TYPES.setPlayMusicInfo,
      payload: {
        playMusicInfo,
        playIndex,
      },
    })
    handlePlayMusic({
      getState,
      dispatch,
      playMusicInfo,
      musicInfo: playMusicInfo.musicInfo,
    })
  }
}

export const setProgress = time => async(dispatch, getState) => {
  const { player } = getState()
  if (player.isGettingUrl || !_playMusicInfo) return
  await seekTo(time)
  if (player.status != STATUS.playing) dispatch(playMusic())
}

export const getPic = musicInfo => (dispatch, getState) => {
  return handleGetPic(dispatch, getState().player.listInfo.id, musicInfo).then(url => {
    // picRequest = null
    dispatch({ type: TYPES.setPic, payload: { musicInfo, url } })
    const state = getState()
    if (state.player.listInfo.id) saveList(global.allList[state.player.listInfo.id])
  }).catch(err => {
    // picRequest = null
    return Promise.reject(err)
  })
}
export const getLrc = musicInfo => async(dispatch, getState) => {
  let lyricInfo = await getLyric(musicInfo)
  if (lyricInfo.lyric && lyricInfo.tlyric != null) return lyricInfo

  return handleGetLyric(dispatch, getState().player.listInfo.id, musicInfo).then(({ lyric, tlyric }) => {
    // picRequest = null
    lyricInfo = { lyric, tlyric }
    saveLyric(musicInfo, lyricInfo)
    return lyricInfo
  }).catch(err => {
    // picRequest = null
    return Promise.reject(err)
  })
}

export const setList = ({ list, index }) => (dispatch, getState) => {
  if (!(list && list.list && list.list[index])) return
  dispatch(setListInfo(list))

  const state = getState()
  if (state.player.playedList.length) dispatch({ type: TYPES.clearPlayedList })
  if (state.player.tempPlayList.length) dispatch({ type: TYPES.clearTempPlayeList })
  return dispatch(playMusic({
    musicInfo: list.list[index],
    listId: list.id,
  }))
}

const filterList = async({ playedList, listInfo, savePath, dispatch }) => {
  // if (this.list.listName === null) return
  let list
  let canPlayList = []
  const filteredPlayedList = playedList.filter(({ listId, isTempPlay }) => listInfo.id === listId && !isTempPlay).map(({ musicInfo }) => musicInfo)
  if (listInfo.id == 'download') {
    list = []
    // for (const item of listInfo.list) {
    //   const filePath = path.join(savePath, item.fileName)
    //   if (!await checkPath(filePath) || !item.isComplate || /\.ape$/.test(filePath)) continue

    //   canPlayList.push(item)

    //   // 排除已播放音乐
    //   let index = filteredPlayedList.indexOf(item)
    //   if (index > -1) {
    //     filteredPlayedList.splice(index, 1)
    //     continue
    //   }
    //   list.push(item)
    // }
  } else {
    list = listInfo.list.filter(s => {
      // if (!assertApiSupport(s.source)) return false
      canPlayList.push(s)

      let index = filteredPlayedList.findIndex(m => (m.songmid || m.musicInfo.songmid) == s.songmid)
      if (index > -1) {
        filteredPlayedList.splice(index, 1)
        return false
      }
      return true
    })
  }
  if (!list.length && playedList.length) {
    dispatch({ type: TYPES.clearPlayedList })
    return canPlayList
  }
  return list
}

export const playPrev = () => async(dispatch, getState) => {
  const { player, common } = getState()
  const currentListId = player.listInfo.id
  const currentList = player.listInfo.list
  const playInfo = playInfoGetter(getState())
  if (player.playedList.length) {
    let currentSongmid
    if (player.playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.listPlayIndex]
      if (musicInfo) currentSongmid = musicInfo.songmid || musicInfo.musicInfo.songmid
    } else {
      currentSongmid = player.playMusicInfo.musicInfo.songmid || player.playMusicInfo.musicInfo.musicInfo.songmid
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = player.playedList.findIndex(m => (m.musicInfo.songmid || m.musicInfo.musicInfo.songmid) === currentSongmid) - 1; index > -1; index--) {
      const playMusicInfo = player.playedList[index]
      const currentSongmid = playMusicInfo.musicInfo.songmid || playMusicInfo.musicInfo.musicInfo.songmid
      if (playMusicInfo.listId == currentListId && !currentList.some(m => (m.songmid || m.musicInfo.songmid) === currentSongmid)) {
        dispatch({ type: TYPES.removeMusicFormPlayedList, payload: index })
        continue
      }
      break
    }

    if (index > -1) {
      dispatch(playMusic(player.playedList[index]))
      return
    }
  }

  let filteredList = await filterList({
    listInfo: player.listInfo,
    playedList: player.playedList,
    savePath: common.setting.download.savePath,
    dispatch,
  })

  if (!filteredList.length) return dispatch(playMusic(null))

  let listPlayIndex = playInfo.listPlayIndex
  const currentListLength = player.listInfo.list.length - 1
  if (listPlayIndex == -1 && currentListLength) {
    listPlayIndex = global.prevListPlayIndex >= currentListLength ? 0 : global.prevListPlayIndex + 1
  }
  let currentIndex = listPlayIndex
  if (currentIndex < 0) currentIndex = 0
  let nextIndex = currentIndex
  if (!playInfo.isTempPlay) {
    switch (common.setting.player.togglePlayMethod) {
      case 'random':
        nextIndex = getRandom(0, filteredList.length)
        break
      case 'listLoop':
      case 'list':
        nextIndex = currentIndex === 0 ? filteredList.length - 1 : currentIndex - 1
        break
      case 'singleLoop':
        break
      default:
        nextIndex = -1
        return
    }
    if (nextIndex < 0) return
  }

  dispatch(playMusic({
    musicInfo: filteredList[nextIndex],
    listId: currentListId,
  }))
}

export const playNext = () => async(dispatch, getState) => {
  const { player, common } = getState()
  if (player.tempPlayList.length) {
    const playMusicInfo = player.tempPlayList[0]
    dispatch(removeTempPlayList(0))
    dispatch(playMusic(playMusicInfo))
    return
  }
  const currentListId = player.listInfo.id
  const currentList = player.listInfo.list
  const playInfo = playInfoGetter(getState())
  if (player.playedList.length) {
    let currentSongmid
    if (player.playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.listPlayIndex]
      if (musicInfo) currentSongmid = musicInfo.songmid || musicInfo.musicInfo.songmid
    } else {
      currentSongmid = player.playMusicInfo.musicInfo.songmid || player.playMusicInfo.musicInfo.musicInfo.songmid
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = player.playedList.findIndex(m => (m.musicInfo.songmid || m.musicInfo.musicInfo.songmid) === currentSongmid) + 1; index < player.playedList.length; index++) {
      const playMusicInfo = player.playedList[index]
      const currentSongmid = playMusicInfo.musicInfo.songmid || playMusicInfo.musicInfo.musicInfo.songmid
      if (playMusicInfo.listId == currentListId && !currentList.some(m => (m.songmid || m.musicInfo.songmid) === currentSongmid)) {
        dispatch({ type: TYPES.removeMusicFormPlayedList, payload: index })
        continue
      }
      break
    }

    if (index < player.playedList.length) {
      dispatch(playMusic(player.playedList[index]))
      return
    }
  }

  let filteredList = await filterList({
    listInfo: player.listInfo,
    playedList: player.playedList,
    savePath: common.setting.download.savePath,
    dispatch,
  })

  // console.log(filteredList)
  if (!filteredList.length) return dispatch(playMusic(null))
  let listPlayIndex = playInfo.listPlayIndex
  const currentListLength = player.listInfo.list.length - 1
  if (listPlayIndex == -1 && currentListLength) {
    listPlayIndex = global.prevListPlayIndex > currentListLength ? currentListLength : global.prevListPlayIndex - 1
  }
  const currentIndex = listPlayIndex
  let nextIndex = currentIndex
  switch (common.setting.player.togglePlayMethod) {
    case 'listLoop':
      nextIndex = currentIndex === filteredList.length - 1 ? 0 : currentIndex + 1
      break
    case 'random':
      nextIndex = getRandom(0, filteredList.length)
      break
    case 'list':
      nextIndex = currentIndex === filteredList.length - 1 ? -1 : currentIndex + 1
      break
    case 'singleLoop':
      break
    default:
      nextIndex = -1
      return
  }
  if (nextIndex < 0) return

  dispatch(playMusic({
    musicInfo: filteredList[nextIndex],
    listId: currentListId,
  }))
}


export const setPlayIndex = index => ({
  type: TYPES.setPlayIndex,
  payload: index,
})

export const addMusicToPlayedList = playMusicInfo => ({
  type: TYPES.addMusicToPlayedList,
  payload: playMusicInfo,
})

export const removeMusicFormPlayedList = index => ({
  type: TYPES.removeMusicFormPlayedList,
  payload: index,
})

export const clearPlayedList = () => ({
  type: TYPES.clearPlayedList,
})

export const visiblePlayerDetail = visible => ({
  type: TYPES.visiblePlayerDetail,
  payload: visible,
})

export const setGetingUrlState = flag => ({
  type: TYPES.setGetingUrlState,
  payload: flag,
})
export const setTempPlayList = list => (dispatch, getState) => {
  dispatch({
    type: TYPES.setTempPlayList,
    payload: list.map(({ musicInfo, listId }) => ({ musicInfo, listId, isTempPlay: true })),
  })
  if (!getState().player.playMusicInfo) dispatch(playNext())
}
export const removeTempPlayList = index => ({
  type: TYPES.removeTempPlayList,
  payload: index,
})

export const setListInfo = listInfo => ({
  type: TYPES.setList,
  payload: listInfo,
})

export const toggleTranslation = isShow => async(dispatch, getState) => {
  lrcToggleTranslation(isShow)
  const player = getState().player
  if (player.status == STATUS.playing && !player.isGettingUrl) {
    getPosition().then(position => {
      lrcPlay(position * 1000)
    })
  }
}

export const toggleDesktopLyric = isShow => async(dispatch, getState) => {
  if (isShow) {
    const { common, player } = getState()
    const desktopLyric = common.setting.desktopLyric
    const [{ lyric, tlyric }] = await Promise.all([
      _playMusicInfo
        ? getLyric(_playMusicInfo).catch(() => ({ lyric: '', tlyric: '' }))
        : Promise.resolve({ lyric: '', tlyric: '' }),
      showLyric({
        isLock: desktopLyric.isLock,
        themeId: desktopLyric.theme,
        opacity: desktopLyric.style.opacity,
        textSize: desktopLyric.style.fontSize,
        positionX: desktopLyric.position.x,
        positionY: desktopLyric.position.y,
        textPositionX: desktopLyric.textPosition.x,
        textPositionY: desktopLyric.textPosition.y,
      }),
    ])
    await lrcdSetLyric(lyric, tlyric)
    if (player.status == STATUS.playing && !player.isGettingUrl) {
      getPosition().then(position => {
        lrcPlay(position * 1000)
      })
    }
  } else {
    hideLyric()
  }
}

export const toggleDesktopLyricLock = isLock => async(dispatch, getState) => {
  toggleLock(isLock)
}
export const setDesktopLyricTheme = theme => async(dispatch, getState) => {
  setTheme(theme)
}
export const setDesktopLyricStyle = style => async(dispatch, getState) => {
  if (style.opacity != null) setAlpha(style.opacity)
  if (style.fontSize != null) setTextSize(style.fontSize)
}
export const setDesktopLyricTextPosition = position => async(dispatch, getState) => {
  setLyricTextPosition(position.x, position.y)
}

export const checkPlayList = listIds => async(dispatch, getState) => {
  const { player, list: listState } = getState()
  if (!_playMusicInfo || !listIds.some(id => player.listInfo.id === id)) return
  const listInfo = global.allList[player.listInfo.id]
  if (!listInfo) {
    if (player.playMusicInfo.listId == LIST_ID_PLAY_LATER) {
      dispatch(setListInfo(listState.defaultList))
      dispatch(setPlayIndex(-1))
    } else {
      if (listState.defaultList.list.length) {
        await dispatch(setList({ list: listState.defaultList, index: 0 }))
      } else {
        await dispatch(stopMusic())
      }
    }
    return
  }

  const isChnagedList = listInfo !== player.listInfo

  const list = listInfo.list

  if (isChnagedList) dispatch(setListInfo(listInfo))
  if (player.playMusicInfo.isTempPlay) return
  if (player.playMusicInfo.listId != LIST_ID_PLAY_LATER) {
    // if (player.playIndex > listInfo.list.length) {
    //   dispatch(setPlayIndex(listInfo.list.length))
    // }
  // } else {
    let songmid = _playMusicInfo.songmid
    let index = list.findIndex(m => m.songmid == songmid)
    // console.log(index)
    if (index < 0) {
      // console.log(this.playIndex)
      if (list.length) {
        dispatch(setPlayIndex(Math.min(player.playIndex - 1, list.length - 1)))
        // if (isChnagedList) dispatch(setListInfo(listInfo))
        await dispatch(playNext())
      } else {
        // if (isChnagedList) dispatch(setListInfo(listInfo))
        await dispatch(stopMusic())
      }
    } else {
      // console.log(isChnagedList)
      // if (isChnagedList) dispatch(setListInfo(listInfo))
      dispatch(setPlayIndex(index))
    }
    // console.log(this.playIndex)
  }
}

export const destroy = () => async(dispatch, getState) => {
  await msDestroy()
  dispatch(setStatus({ status: STATUS.none, text: '' }))
}
