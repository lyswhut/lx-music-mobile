import { action as playerAction } from '@/store/modules/player'
import { findMusic } from '@/utils/music'
import {
  getAllListData,
  saveList,
  removeList,
  saveListAllSort,
  clearMusicUrlAndLyric,
  saveListScrollPosition,
  saveListSort,
} from '@/utils/tools'

export const TYPES = {
  initList: null,
  setList: null,
  listAdd: null,
  listMove: null,
  listAddMultiple: null,
  listMoveMultiple: null,
  listRemove: null,
  listRemoveMultiple: null,
  listClear: null,
  updateMusicInfo: null,
  createUserList: null,
  removeUserList: null,
  setUserListName: null,
  setUserListPosition: null,
  setMusicPosition: null,
  setOtherSource: null,
  clearCache: null,
  jumpPosition: null,
}

for (const key of Object.keys(TYPES)) {
  TYPES[key] = `list__${key}`
}


export const initList = listData => async(dispatch, getState) => {
  let defaultList
  let loveList
  let userList
  let listPosition
  let listSort
  if (listData) {
    defaultList = listData.defaultList
    loveList = listData.loveList
    userList = listData.userList
    listSort = listData.listSort || {}
  } else {
    try {
      listData = await getAllListData()
    } catch (err) { return }
    defaultList = listData.defaultList
    loveList = listData.loveList
    userList = listData.userList
    listPosition = listData.listPosition
    listSort = listData.listSort
  }
  global.listScrollPosition = listPosition
  global.listSort = listSort

  let isNeedSaveSortInfo = false
  userList.sort((a, b) => {
    if (listSort[a.id] == null) return listSort[b.id] == null ? -1 : 1
    return listSort[b.id] == null ? 1 : listSort[a.id] - listSort[b.id]
  })
  userList.forEach((list, index) => {
    if (listSort[list.id] == null) {
      isNeedSaveSortInfo = true
      listSort[list.id] = index
      delete list.location
    }
  })
  if (isNeedSaveSortInfo) await saveListAllSort(listSort)

  // console.log(userList.map(l => `${listSort[l.id]} - ${l.name}`))
  dispatch({
    type: TYPES.initList,
    payload: { defaultList, loveList, userList },
  })
}

export const setList = ({ id, list, name, location, source, sourceListId }) => async(dispatch, getState) => {
  const targetList = global.allList[id]
  if (targetList) {
    if (name && targetList.name === name) {
      dispatch({
        type: TYPES.listClear,
        payload: id,
      })
      dispatch(listAddMultiple({ id, list }))
      return
    }

    id += '_' + Math.random()
  }
  await dispatch(createUserList({ id, list, name, location, source, sourceListId }))
}

export const listAdd = ({ musicInfo, id }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listAdd,
    payload: {
      musicInfo,
      id,
    },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listMove = ({ fromId, musicInfo, toId }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listMove,
    payload: { fromId, musicInfo, toId },
  })
  dispatch(playerAction.checkPlayList([fromId, musicInfo]))
  saveList([global.allList[fromId], global.allList[toId]])
}

export const listAddMultiple = ({ id, list }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listAddMultiple,
    payload: { id, list },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listMoveMultiple = ({ fromId, toId, list }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { id: fromId, list },
  })
  dispatch({
    type: TYPES.listAddMultiple,
    payload: { id: toId, list },
  })
  dispatch(playerAction.checkPlayList([fromId, toId]))
  saveList([global.allList[fromId], global.allList[toId]])
}

export const listRemove = ({ id, index }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listRemove,
    payload: { id, index },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listRemoveMultiple = ({ id, list }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { id, list },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listClear = id => (dispatch, getState) => {
  dispatch({
    type: TYPES.listClear,
    payload: id,
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const updateMusicInfo = ({ id, index, data }) => (dispatch, getState) => {
  dispatch({
    type: TYPES.updateMusicInfo,
    payload: { id, index, data },
  })
  saveList(global.allList[id])
}

export const createUserList = ({ name, id = `userlist_${Date.now()}`, source, sourceListId, list }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.createUserList,
    payload: { name, id, source, sourceListId },
  })
  dispatch(listAddMultiple({ id, list }))
  await saveList(global.allList[id])
  const state = getState()
  await saveListSort(id, state.list.userList.length)
  await saveListScrollPosition(id, 0)
}

export const removeUserList = id => async(dispatch, getState) => {
  const { list } = getState()
  const index = list.userList.findIndex(l => l.id === id)
  if (index < 0) return
  dispatch({
    type: TYPES.removeUserList,
    payload: index,
  })
  await removeList(id)
  dispatch(playerAction.checkPlayList([id]))
}

export const getOtherSource = ({ musicInfo, id }) => (dispatch, getState) => {
  return (musicInfo.otherSource && musicInfo.otherSource.length ? Promise.resolve(musicInfo.otherSource) : findMusic(musicInfo)).then(otherSource => {
    const targetList = global.allList[id]
    if (targetList) {
      const index = targetList.indexOf(musicInfo)
      if (index > -1) {
        dispatch({
          type: TYPES.setOtherSource,
          payload: { otherSource, id, index },
        })
      }
    }
    return otherSource
  })
}

export const setUserListName = ({ id, name }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setUserListName,
    payload: { id, name },
  })
  await saveList(global.allList[id])
}
export const setUserListPosition = ({ id, position }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setUserListPosition,
    payload: { id, position },
  })
  await saveList(global.allList[id])
}
export const setMusicPosition = ({ id, position, list }) => async(dispatch, getState) => {
  // const targetList = global.allList[id]
  // if (!targetList) return
  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { id, list },
  })
  dispatch({
    type: TYPES.setMusicPosition,
    payload: { id, position, list },
  })
  dispatch(playerAction.checkPlayList([id]))
  await saveList(global.allList[id])
}

export const setJumpPosition = isJumpPosition => async(dispatch, getState) => {
  dispatch({
    type: TYPES.jumpPosition,
    payload: isJumpPosition,
  })
}

export const clearCache = () => async(dispatch, getState) => {
  dispatch({
    type: TYPES.clearCache,
    payload: null,
  })
  await saveList(Object.values(global.allList))
  await clearMusicUrlAndLyric()
}
