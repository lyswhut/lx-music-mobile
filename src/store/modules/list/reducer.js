import { TYPES } from './action'

const allList = global.allList = {}

const allListInit = (defaultList, loveList, userList) => {
  for (const id of Object.keys(allList)) {
    delete allList[id]
  }
  allList[defaultList.id] = defaultList
  allList[loveList.id] = loveList
  for (const list of userList) allList[list.id] = list
}
const allListUpdate = list => {
  allList[list.id] = list
}
const allListRemove = list => {
  delete allList[list.id]
}

// state
const initialState = {
  isInitedList: false,
  defaultList: {
    id: 'default',
    name: '试听列表',
    list: [],
  },
  loveList: {
    id: 'love',
    name: '我的收藏',
    list: [],
  },
  tempList: {
    id: 'temp',
    name: '临时列表',
    list: [],
  },
  userList: [],
  listPosition: {},
  isJumpPosition: false,
}

const updateStateList = (state, ids) => {
  let isClonedUserList = false
  let index
  for (const id of ids) {
    switch (id) {
      case state.defaultList.id:
        allList[id] = state.defaultList = { ...state.defaultList }
        break
      case state.loveList.id:
        allList[id] = state.loveList = { ...state.loveList }
        break
      default:
        if (!isClonedUserList) {
          isClonedUserList = true
          state.userList = [...state.userList]
        }
        index = state.userList.findIndex(l => l.id == id)
        if (index < 0) continue
        allList[id] = state.userList[index] = { ...state.userList[index] }
        break
    }
  }
  return state
}

const mutations = {
  [TYPES.initList](state, { defaultList, loveList, userList }) {
    const newState = { ...state }
    const ids = []
    if (defaultList != null) {
      newState.defaultList = { ...state.defaultList, list: defaultList.list }
      ids.push(defaultList.id)
    }
    if (loveList != null) {
      newState.loveList = { ...state.loveList, list: loveList.list }
      ids.push(loveList.id)
    }
    if (userList != null) {
      newState.userList = userList
      for (const list of userList) {
        ids.push(list.id)
      }
    }
    allListInit(newState.defaultList, newState.loveList, newState.userList)
    newState.isInitedList = true
    return updateStateList(newState, [ids])
    // console.log(allList.default, newState, ids)
    // return newState
  },
  [TYPES.setSyncList](state, { defaultList, loveList, userList }) {
    const newState = { ...state }
    newState.defaultList = defaultList
    newState.loveList = loveList
    newState.userList = userList
    allListInit(newState.defaultList, newState.loveList, newState.userList)
    return newState
  },
  /* [TYPES.initList](state, { defaultList, loveList, userList }) {
    const newState = { ...state }
    if (defaultList != null) newState.defaultList = { ...state.defaultList, list: defaultList.list }
    if (loveList != null) newState.loveList = { ...state.loveList, list: loveList.list }
    if (userList != null) newState.userList = userList
    allListInit(state.defaultList, state.loveList, state.userList)
    state.isInitedList = true
    return newState
  },
  [TYPES.setList](state, { id, list, name, location }) {
    const targetList = allList[id]
    if (targetList) {
      if (name && targetList.name === name) {
        targetList.list.splice(0, targetList.list.length, ...list)
        targetList.location = location
        return
      }

      id += '_' + Math.random()
    }
    const newList = {
      name,
      id,
      list,
      location,
    }
    allListUpdate(newList)
    return { ...state, userList: [...state.userList, newList] }
  }, */
  [TYPES.listAdd](state, { id, musicInfo, addMusicLocationType }) {
    const targetList = allList[id]
    if (!targetList) return state
    if (targetList.list.some(s => s.songmid === musicInfo.songmid)) return state
    switch (addMusicLocationType) {
      case 'top':
        targetList.list = [musicInfo, ...targetList.list]
        break
      case 'bottom':
      default:
        targetList.list = [...targetList.list, musicInfo]
        break
    }
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listMove](state, { fromId, musicInfo, toId, addMusicLocationType }) {
    const fromList = allList[fromId]
    const toList = allList[toId]
    if (!fromList || !toList) return state
    const newFromList = [...fromList.list]
    let songmid = musicInfo.songmid
    newFromList.splice(fromList.list.findIndex(m => m.songmid == songmid), 1)
    fromList.list = newFromList
    const index = toList.list.findIndex(s => s.songmid === musicInfo.songmid)
    if (index < 0) {
      switch (addMusicLocationType) {
        case 'top':
          toList.list = [musicInfo, ...toList.list]
          break
        case 'bottom':
        default:
          toList.list = [...toList.list, musicInfo]
          break
      }
    }
    return updateStateList({ ...state }, [fromId, toId])
  },
  [TYPES.listAddMultiple](state, { id, list, addMusicLocationType }) {
    const targetList = allList[id]
    if (!targetList) return state
    let newList
    const map = {}
    const ids = []
    switch (addMusicLocationType) {
      case 'top':
        newList = [...list, ...targetList.list]
        for (let i = newList.length - 1; i > -1; i--) {
          const item = newList[i]
          if (map[item.songmid]) continue
          ids.unshift(item.songmid)
          map[item.songmid] = item
        }
        break
      case 'bottom':
      default:
        newList = [...targetList.list, ...list]
        for (const item of newList) {
          if (map[item.songmid]) continue
          ids.push(item.songmid)
          map[item.songmid] = item
        }
        break
    }
    targetList.list = ids.map(id => map[id])
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listRemove](state, { listId, id }) {
    const targetList = allList[listId]
    // console.log(targetList, id, index)
    if (!targetList) return state
    const index = targetList.list.findIndex(item => item.songmid == id)
    if (index < 0) return state
    const newTargetList = [...targetList.list]
    newTargetList.splice(index, 1)
    targetList.list = newTargetList
    return updateStateList({ ...state }, [listId])
  },
  [TYPES.listRemoveMultiple](state, { listId, ids: musicIds }) {
    const targetList = allList[listId]
    if (!targetList) return state
    const map = {}
    const ids = []
    for (const item of targetList.list) {
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    for (const songmid of musicIds) {
      if (map[songmid]) delete map[songmid]
    }
    const newList = []
    for (const id of ids) if (map[id]) newList.push(map[id])

    targetList.list = newList
    return updateStateList({ ...state }, [listId])
  },
  [TYPES.listClear](state, id) {
    const targetList = allList[id]
    if (!targetList) return state
    targetList.list = []
    return updateStateList({ ...state }, [id])
  },
  [TYPES.updateMusicInfo](state, { listId, id, data }) {
    const targetList = allList[listId]
    if (!targetList) return state
    const targetMusicInfo = targetList.list.find(item => item.songmid == id)
    if (!targetMusicInfo) return state
    const newTargetList = [...targetList.list]
    Object.assign(targetMusicInfo, data)
    targetList.list = newTargetList
    return updateStateList({ ...state }, [listId])
  },

  [TYPES.createUserList](state, { name, id, source, sourceListId, position }) {
    let newList = state.userList.find(item => item.id === id)
    if (newList) return state
    const newState = { ...state }
    newList = {
      name,
      id,
      list: [],
      source,
      sourceListId,
    }
    const userList = [...state.userList]
    if (position == null) {
      userList.push(newList)
    } else {
      userList.splice(position + 1, 0, newList)
    }
    newState.userList = userList
    allListUpdate(newList)
    return newState
  },
  [TYPES.removeUserList](state, index) {
    const newState = { ...state }
    const newUserList = [...newState.userList]
    const removedList = newUserList.splice(index, 1)[0]
    allListRemove(removedList)
    newState.userList = newUserList
    return newState
  },
  [TYPES.setUserListName](state, { id, name }) {
    const targetList = allList[id]
    if (!targetList) return state
    targetList.name = name
    return updateStateList({ ...state }, [id])
  },
  [TYPES.setUserListPosition](state, { id, position }) {
    const targetList = allList[id]
    if (!targetList) return state
    const index = state.userList.findIndex(targetList)
    if (index < 0) return state
    state.userList.splice(index, 1)
    state.userList.splice(index, position, targetList)
    return updateStateList({ ...state }, [id])
  },
  [TYPES.setMusicPosition](state, { id, position, list }) {
    const targetList = allList[id]
    if (!targetList) return state
    targetList.list.splice(position - 1, 0, ...list)
    return updateStateList({ ...state }, [id])
  },
  // { fromId, toId, list }
  // [TYPES.setListScroll](state, { id, location }) {
  //   const targetList = allList[id]
  //   if (!targetList) return state
  //   targetList.location = location
  //   return updateStateList({ ...state }, [id])
  // },
  [TYPES.setOtherSource](state, { otherSource, id, index }) {
    const targetList = allList[id]
    if (!targetList) return state
    const newTargetList = [...targetList.list]
    newTargetList[index].otherSource = otherSource
    targetList.list = newTargetList
    return updateStateList({ ...state }, [id])
  },
  [TYPES.clearCache](state) {
    const lists = Object.values(global.allList)
    for (const { list } of lists) {
      for (const item of list) {
        if (item.otherSource) item.otherSource = null
        if (item.typeUrl['128k']) delete item.typeUrl['128k']
        if (item.typeUrl['320k']) delete item.typeUrl['320k']
        if (item.typeUrl.flac) delete item.typeUrl.flac
        if (item.typeUrl.wav) delete item.typeUrl.wav

        // PC v1.8.2以前的Lyric
        if (item.lxlrc) delete item.lxlrc
        if (item.lrc) delete item.lrc
        if (item.tlrc) delete item.tlrc
      }
    }
    return state
  },

  [TYPES.jumpPosition](state, isJumpPosition) {
    return {
      ...state,
      isJumpPosition,
    }
  },
}

export default (state = initialState, action) => mutations[action.type]
  ? mutations[action.type](state, action.payload)
  : state

