import { encryptMsg } from '../../client/utils'

let socket: LX.Sync.Socket | null
let unregisterLocalListAction: (() => void) | null

const handleLocalListAction = () => {
  const list_data_overwrite = async(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_data_overwrite', data: listData })
  }
  const list_create = async(position: number, listInfos: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_create', data: { position, listInfos } })
  }
  const list_remove = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_remove', data: ids })
  }
  const list_update = async(lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_update', data: lists })
  }
  const list_update_position = async(position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_update_position', data: { position, ids } })
  }
  const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_overwrite', data: { listId, musicInfos } })
  }
  const list_music_add = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_add', data: { id, musicInfos, addMusicLocationType } })
  }
  const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_move', data: { fromId, toId, musicInfos, addMusicLocationType } })
  }
  const list_music_remove = async(listId: string, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_remove', data: { listId, ids } })
  }
  const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_update', data: musicInfos })
  }
  const list_music_clear = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_clear', data: ids })
  }
  const list_music_update_position = async(listId: string, position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    sendListAction({ action: 'list_music_update_position', data: { listId, position, ids } })
  }
  global.list_event.on('list_data_overwrite', list_data_overwrite)
  global.list_event.on('list_create', list_create)
  global.list_event.on('list_remove', list_remove)
  global.list_event.on('list_update', list_update)
  global.list_event.on('list_update_position', list_update_position)
  global.list_event.on('list_music_overwrite', list_music_overwrite)
  global.list_event.on('list_music_add', list_music_add)
  global.list_event.on('list_music_move', list_music_move)
  global.list_event.on('list_music_remove', list_music_remove)
  global.list_event.on('list_music_update', list_music_update)
  global.list_event.on('list_music_clear', list_music_clear)
  global.list_event.on('list_music_update_position', list_music_update_position)
  return () => {
    global.list_event.off('list_data_overwrite', list_data_overwrite)
    global.list_event.off('list_create', list_create)
    global.list_event.off('list_remove', list_remove)
    global.list_event.off('list_update', list_update)
    global.list_event.off('list_update_position', list_update_position)
    global.list_event.off('list_music_overwrite', list_music_overwrite)
    global.list_event.off('list_music_add', list_music_add)
    global.list_event.off('list_music_move', list_music_move)
    global.list_event.off('list_music_remove', list_music_remove)
    global.list_event.off('list_music_update', list_music_update)
    global.list_event.off('list_music_clear', list_music_clear)
    global.list_event.off('list_music_update_position', list_music_update_position)
  }
}


export const sendListAction = (action: LX.Sync.ActionList) => {
  // console.log('sendListAction', action.action)
  if (!socket) return
  socket.emit('list:action', encryptMsg(JSON.stringify(action)))
}

export const register = (_socket: LX.Sync.Socket) => {
  unregister()
  socket = _socket
  unregisterLocalListAction = handleLocalListAction()
}

export const unregister = () => {
  socket = null
  if (unregisterLocalListAction) {
    unregisterLocalListAction()
    unregisterLocalListAction = null
  }
}
