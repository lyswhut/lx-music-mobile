import { action as playerAction } from '@/store/modules/player'
import { action as commonAction } from '@/store/modules/common'
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
import { list as listSync } from '@/plugins/sync'
import { log } from '@/utils/log'

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
  setSyncList: null,
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
    } catch (err) {
      log.error(err.stack)
      return
    }
    defaultList = listData.defaultList
    loveList = listData.loveList
    userList = listData.userList
    listPosition = listData.listPosition
    listSort = listData.listSort
  }
  global.listScrollPosition = listPosition || {}
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

  // if (listData.isSync) {
  //   const keys = Object.keys(global.allList)
  //   dispatch(playerAction.checkPlayList(keys))
  //   saveList(keys)
  // } else {
  //   listSync.sendListAction('init_list', { defaultList, loveList, userList })
  // }
}

export const setSyncList = ({ defaultList, loveList, userList }) => async(dispatch, getState) => {
  const state = getState()
  const userListIds = userList.map(l => l.id)
  const removeUserListIds = state.list.userList.filter(l => !userListIds.includes(l.id)).map(l => l.id)
  if (removeUserListIds.includes(state.common.setting.list.prevSelectListId)) {
    dispatch(commonAction.setPrevSelectListId(state.list.defaultList.id))
  }
  dispatch({
    type: TYPES.setSyncList,
    payload: { defaultList, loveList, userList },
  })
  await removeList(removeUserListIds)

  const listPosition = {}
  userList.forEach((list, index) => {
    listPosition[list.id] = index
    delete list.location
  })
  global.listScrollPosition = listPosition
  await saveListAllSort(listPosition)

  dispatch(playerAction.checkPlayList([...Object.keys(global.allList), ...removeUserListIds]))
  saveList([defaultList, loveList, ...userList])
}

export const setList = ({ id, list, name, location, source, sourceListId, isSync }) => async(dispatch, getState) => {
  const targetList = global.allList[id]
  if (targetList) {
    if (name && targetList.name === name) {
      if (!isSync) listSync.sendListAction('set_list', { id, list, name, location, source, sourceListId })
      dispatch({
        type: TYPES.listClear,
        payload: id,
      })
      dispatch(listAddMultiple({ id, list, isSync: true }))
      return
    }

    id += '_' + Math.random()
  }
  if (!isSync) listSync.sendListAction('set_list', { id, list, name, location, source, sourceListId })

  await dispatch(createUserList({ id, list, name, location, source, sourceListId, isSync: true }))
}

export const listAdd = ({ musicInfo, id, addMusicLocationType, isSync }) => (dispatch, getState) => {
  if (!addMusicLocationType) addMusicLocationType = getState().common.setting.list.addMusicLocationType

  if (!isSync) {
    listSync.sendListAction('list_add', { id, musicInfo, addMusicLocationType })
  }

  dispatch({
    type: TYPES.listAdd,
    payload: {
      musicInfo,
      id,
      addMusicLocationType,
    },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listMove = ({ fromId, musicInfo, toId, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('list_move', { fromId, musicInfo, toId })
  }

  dispatch({
    type: TYPES.listMove,
    payload: { fromId, musicInfo, toId },
  })
  dispatch(playerAction.checkPlayList([fromId, toId]))
  saveList([global.allList[fromId], global.allList[toId]])
}

export const listAddMultiple = ({ id, list, addMusicLocationType, isSync }) => (dispatch, getState) => {
  if (!addMusicLocationType) addMusicLocationType = getState().common.setting.list.addMusicLocationType

  if (!isSync) {
    listSync.sendListAction('list_add_multiple', { id, list, addMusicLocationType })
  }

  dispatch({
    type: TYPES.listAddMultiple,
    payload: { id, list, addMusicLocationType },
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const listMoveMultiple = ({ fromId, toId, list, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('list_move_multiple', { fromId, toId, list })
  }

  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { id: fromId, ids: list.map(s => s.songmid) },
  })
  dispatch({
    type: TYPES.listAddMultiple,
    payload: { id: toId, list },
  })
  dispatch(playerAction.checkPlayList([fromId, toId]))
  saveList([global.allList[fromId], global.allList[toId]])
}

export const listRemove = ({ listId, id, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('list_remove', { listId, id })
  }

  dispatch({
    type: TYPES.listRemove,
    payload: { listId, id },
  })
  dispatch(playerAction.checkPlayList([listId]))
  saveList(global.allList[listId])
}

export const listRemoveMultiple = ({ listId, ids, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('list_remove_multiple', { listId, ids })
  }

  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { listId, ids },
  })
  dispatch(playerAction.checkPlayList([listId]))
  saveList(global.allList[listId])
}

export const listClear = ({ id, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('list_clear', { id })
  }

  dispatch({
    type: TYPES.listClear,
    payload: id,
  })
  dispatch(playerAction.checkPlayList([id]))
  saveList(global.allList[id])
}

export const updateMusicInfo = ({ listId, id, data, isSync }) => (dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('update_music_info', { listId, id, data })
  }

  dispatch({
    type: TYPES.updateMusicInfo,
    payload: { listId, id, data },
  })
  saveList(global.allList[listId])
}

export const createUserList = ({ name, id = `userlist_${Date.now()}`, list = [], source, sourceListId, isSync }) => async(dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('create_user_list', { name, id, list, source, sourceListId })
  }

  dispatch({
    type: TYPES.createUserList,
    payload: { name, id, source, sourceListId },
  })
  dispatch(listAddMultiple({ id, list, isSync: true }))
  await saveList(global.allList[id])
  const state = getState()
  await saveListSort(id, state.list.userList.length)
  await saveListScrollPosition(id, 0)
}

export const removeUserList = ({ id, isSync }) => async(dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('remove_user_list', { id })
  }

  const { list, common } = getState()
  const index = list.userList.findIndex(l => l.id === id)
  if (index < 0) return
  if (common.setting.list.prevSelectListId == id) {
    dispatch(commonAction.setPrevSelectListId(list.defaultList.id))
  }
  dispatch({
    type: TYPES.removeUserList,
    payload: index,
  })
  await removeList(id)
  console.log(common.setting.list.prevSelectListId, id)
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

export const setUserListName = ({ id, name, isSync }) => async(dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('set_user_list_name', { id, name })
  }

  dispatch({
    type: TYPES.setUserListName,
    payload: { id, name },
  })
  const targetList = global.allList[id]
  await saveList(targetList)
}
export const setUserListPosition = ({ id, position }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setUserListPosition,
    payload: { id, position },
  })
  await saveList(global.allList[id])
}
export const setMusicPosition = ({ id, position, list, isSync }) => async(dispatch, getState) => {
  if (!isSync) {
    listSync.sendListAction('set_music_position', { id, position, list })
  }
  // const targetList = global.allList[id]
  // if (!targetList) return
  dispatch({
    type: TYPES.listRemoveMultiple,
    payload: { listId: id, ids: list.map(m => m.songmid) },
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
