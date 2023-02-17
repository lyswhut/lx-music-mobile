import { decryptMsg } from '../../client/utils'
import log from '../../log'


let socket: LX.Sync.Socket | null
const handleRemoteListAction = (enMsg: string) => {
  const { action, data } = JSON.parse(decryptMsg(enMsg)) as LX.Sync.ActionList
  // console.log('handleRemoteListAction', action)
  log.info(action)

  switch (action) {
    case 'list_data_overwrite':
      void global.list_event.list_data_overwrite(data, true)
      break
    case 'list_create':
      void global.list_event.list_create(data.position, data.listInfos, true)
      break
    case 'list_remove':
      void global.list_event.list_remove(data, true)
      break
    case 'list_update':
      void global.list_event.list_update(data, true)
      break
    case 'list_update_position':
      void global.list_event.list_update_position(data.position, data.ids, true)
      break
    case 'list_music_add':
      void global.list_event.list_music_add(data.id, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_move':
      void global.list_event.list_music_move(data.fromId, data.toId, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_remove':
      void global.list_event.list_music_remove(data.listId, data.ids, true)
      break
    case 'list_music_update':
      void global.list_event.list_music_update(data, true)
      break
    case 'list_music_update_position':
      void global.list_event.list_music_update_position(data.listId, data.position, data.ids, true)
      break
    case 'list_music_overwrite':
      void global.list_event.list_music_overwrite(data.listId, data.musicInfos, true)
      break
    case 'list_music_clear':
      void global.list_event.list_music_clear(data, true)
      break
    default:
      break
  }
}

export const register = (_socket: LX.Sync.Socket) => {
  unregister()
  socket = _socket
  socket.on('list:action', handleRemoteListAction)
  // socket.on('list:add', addMusic)
}

export const unregister = () => {
  if (!socket) return
  socket.off('list:action', handleRemoteListAction)
  socket = null
}
