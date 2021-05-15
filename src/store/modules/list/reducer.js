import { TYPES } from './action'

const allList = global.allList = {}

const allListInit = (defaultList, loveList, userList) => {
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
    location: 0,
  },
  loveList: {
    id: 'love',
    name: '我的收藏',
    list: [],
    location: 0,
  },
  tempList: {
    id: 'temp',
    name: '临时列表',
    list: [],
    location: 0,
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
      newState.defaultList = { ...state.defaultList, list: defaultList.list, location: defaultList.location }
      ids.push(defaultList.id)
    }
    if (loveList != null) {
      newState.loveList = { ...state.loveList, list: loveList.list, location: loveList.location }
      ids.push(loveList.id)
    }
    if (userList != null) newState.userList = userList
    allListInit(newState.defaultList, newState.loveList, newState.userList)
    newState.isInitedList = true
    return updateStateList(newState, [ids])
    // console.log(allList.default, newState, ids)
    // return newState
  },
  /* [TYPES.initList](state, { defaultList, loveList, userList }) {
    const newState = { ...state }
    if (defaultList != null) newState.defaultList = { ...state.defaultList, list: defaultList.list, location: defaultList.location }
    if (loveList != null) newState.loveList = { ...state.loveList, list: loveList.list, location: loveList.location }
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
  [TYPES.listAdd](state, { id, musicInfo }) {
    const targetList = allList[id]
    if (!targetList) return state
    if (targetList.list.some(s => s.songmid === musicInfo.songmid)) return state
    targetList.list = [...targetList.list, musicInfo]
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listMove](state, { fromId, musicInfo, toId }) {
    const fromList = allList[fromId]
    const toList = allList[toId]
    if (!fromList || !toList) return state
    const newFromList = [...fromList.list]
    newFromList.splice(fromList.list.indexOf(musicInfo), 1)
    fromList.list = newFromList
    const index = toList.list.findIndex(s => s.songmid === musicInfo.songmid)
    if (index < 0) {
      toList.list = [...toList.list, musicInfo]
    }
    return updateStateList({ ...state }, [fromId, toId])
  },
  [TYPES.listAddMultiple](state, { id, list }) {
    const targetList = allList[id]
    if (!targetList) return state
    const newList = [...targetList.list, ...list]
    const map = {}
    const ids = []
    for (const item of newList) {
      if (map[item.songmid]) continue
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    targetList.list = ids.map(id => map[id])
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listRemove](state, { id, index }) {
    const targetList = allList[id]
    // console.log(targetList, id, index)
    if (!targetList) return state
    const newTargetList = [...targetList.list]
    newTargetList.splice(index, 1)
    targetList.list = newTargetList
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listRemoveMultiple](state, { id, list }) {
    const targetList = allList[id]
    if (!targetList) return state
    const map = {}
    const ids = []
    for (const item of targetList.list) {
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    for (const item of list) {
      if (map[item.songmid]) delete map[item.songmid]
    }
    const newList = []
    for (const id of ids) if (map[id]) newList.push(map[id])

    targetList.list = newList
    return updateStateList({ ...state }, [id])
  },
  [TYPES.listClear](state, id) {
    const targetList = allList[id]
    if (!targetList) return state
    targetList.list = []
    return updateStateList({ ...state }, [id])
  },
  [TYPES.updateMusicInfo](state, { id, index, data }) {
    const targetList = allList[id]
    if (!targetList) return state
    const newTargetList = [...targetList.list]
    Object.assign(newTargetList[index], data)
    targetList.list = newTargetList
    return updateStateList({ ...state }, [id])
  },

  [TYPES.createUserList](state, { name, id, source, sourceListId }) {
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
    newState.userList = [...state.userList, newList]
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

