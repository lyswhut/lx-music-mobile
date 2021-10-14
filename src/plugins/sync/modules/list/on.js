import { getStore } from '@/store'
import { decryptMsg } from '../../client/utils'
import log from '../../log'
import {
  setList,
  listAdd,
  listMove,
  listAddMultiple,
  listMoveMultiple,
  listRemove,
  listRemoveMultiple,
  listClear,
  updateMusicInfo,
  createUserList,
  removeUserList,
  setUserListName,
  setMusicPosition,
  // moveupUserList,
  // movedownUserList,
  // setUserListPosition,
} from '@/store/modules/list/action'

const store = getStore()

let socket

const handleListAction = enMsg => {
  const { action, data } = JSON.parse(decryptMsg(enMsg))
  if (typeof data == 'object') data.isSync = true
  console.log(action)
  log.info(action)

  switch (action) {
    // case 'init_list':
    //   store.dispatch(initList(data))
    //   break
    case 'set_list':
      store.dispatch(setList(data))
      break
    case 'list_add':
      store.dispatch(listAdd(data))
      break
    case 'list_move':
      store.dispatch(listMove(data))
      break
    case 'list_add_multiple':
      store.dispatch(listAddMultiple(data))
      break
    case 'list_move_multiple':
      store.dispatch(listMoveMultiple(data))
      break
    case 'list_remove':
      store.dispatch(listRemove(data))
      break
    case 'list_remove_multiple':
      store.dispatch(listRemoveMultiple(data))
      break
    case 'list_clear':
      store.dispatch(listClear(data))
      break
    case 'update_music_info':
      store.dispatch(updateMusicInfo(data))
      break
    case 'create_user_list':
      store.dispatch(createUserList(data))
      break
    case 'remove_user_list':
      store.dispatch(removeUserList(data))
      break
    case 'set_user_list_name':
      store.dispatch(setUserListName(data))
      break
    case 'set_music_position':
      store.dispatch(setMusicPosition(data))
      break
    // case 'moveup_user_list':
    //   store.dispatch(moveupUserList(data))
    //   break
    // case 'movedown_user_list':
    //   store.dispatch(movedownUserList(data))
    //   break
    default:
      break
  }
}

export const register = _socket => {
  unregister()
  socket = _socket
  socket.on('list:action', handleListAction)
  // socket.on('list:add', addMusic)
}

export const unregister = () => {
  if (!socket) return
  socket.off('list:action', handleListAction)
  socket = null
}
