import { TYPES, STATUS } from './action'
import { LIST_ID_PLAY_LATER } from '@/config/constant'

const initialState = {
  listInfo: {
    list: [],
    id: null,
  },
  playIndex: -1,
  isShowPlayerDetail: false,
  playedList: [],

  playMusicInfo: null,
  tempPlayList: [],

  statusText: '',
  status: STATUS.none,
  isGettingUrl: false,
}


// mitations
const mutations = {
  [TYPES.setPic](state, datas) {
    let targetMusic
    if (!state.playMusicInfo) return state
    switch (state.playMusicInfo.listId) {
      case LIST_ID_PLAY_LATER:
        targetMusic = datas.musicInfo
        break
      default:
        targetMusic = state.listInfo.list.find(s => s.songmid === datas.musicInfo.songmid)
        break
    }
    // console.log('+++++++targetMusic+++++++', targetMusic)
    targetMusic.img = datas.url
    const newState = { ...state }
    if (state.playMusicInfo.musicInfo.source == datas.musicInfo.source && state.playMusicInfo.musicInfo.songmid === datas.musicInfo.songmid) {
      const newPlayMusicInfo = { ...newState.playMusicInfo }
      let index = newState.playedList.indexOf(newState.playMusicInfo)
      if (index > -1) newState.playedList.splice(index, 1, newPlayMusicInfo)
      newState.playMusicInfo = newPlayMusicInfo
    }
    return newState
  },
  [TYPES.setList](state, list) {
    return {
      ...state,
      listInfo: {
        ...list,
      },
    }
  },
  [TYPES.setPlayIndex](state, index) {
    return {
      ...state,
      playIndex: index,
    }
    // console.log(state.changePlay)
  },
  [TYPES.addMusicToPlayedList](state, playMusicInfo) {
    if (state.playedList.includes(playMusicInfo)) return state
    state.playedList.push(playMusicInfo)
    return {
      ...state,
    }
  },
  [TYPES.removeMusicFormPlayedList](state, index) {
    state.playedList.splice(index, 1)
    return {
      ...state,
    }
  },
  [TYPES.clearPlayedList](state) {
    return {
      ...state,
      playedList: [],
    }
  },
  [TYPES.visiblePlayerDetail](state, visible) {
    return {
      ...state,
      isShowPlayerDetail: visible,
    }
  },
  [TYPES.setStatus](state, { status, text }) {
    const newState = { ...state }
    if (status != null) newState.status = status
    if (text != null) newState.statusText = text
    return newState
  },
  [TYPES.setGetingUrlState](state, flag) {
    return {
      ...state,
      isGettingUrl: flag,
    }
  },
  [TYPES.setTempPlayList](state, list) {
    return {
      ...state,
      tempPlayList: [...state.tempPlayList, ...list],
    }
  },
  [TYPES.removeTempPlayList](state, index) {
    const tempPlayList = [...state.tempPlayList]
    tempPlayList.splice(index, 1)
    return {
      ...state,
      tempPlayList,
    }
  },
  [TYPES.clearTempPlayeList](state) {
    return {
      ...state,
      tempPlayList: [],
    }
  },
  [TYPES.setPlayMusicInfo](state, { playMusicInfo, playIndex }) {
    return {
      ...state,
      playMusicInfo: playMusicInfo,
      playIndex: playIndex,
    }
  },
}

export default (state = initialState, action) =>
  mutations[action.type]
    ? mutations[action.type](state, action.payload)
    : state

