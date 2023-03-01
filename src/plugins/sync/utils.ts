import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto'
import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import { userLists } from '@/utils/listManage'


export const aesEncrypt = (text: string, key: string) => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string) => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}

export const getLocalListData = async(): Promise<LX.Sync.ListData> => {
  return Promise.all([
    getListMusics(LIST_IDS.DEFAULT),
    getListMusics(LIST_IDS.LOVE),
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    ...userLists.map(l => getListMusics(l.id)),
  ]).then(([defaultList, loveList, ...userList]) => {
    return {
      defaultList,
      loveList,
      userList: userLists.map((l, i) => ({ ...l, list: userList[i] })),
    }
  })
}

export const setLocalListData = async(listData: LX.Sync.ListData) => {
  await global.list_event.list_data_overwrite(listData, true)
}


export const registerListActionEvent = (sendListAction: (action: LX.Sync.ActionList) => (void | Promise<void>)) => {
  const list_data_overwrite = async(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_data_overwrite', data: listData })
  }
  const list_create = async(position: number, listInfos: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_create', data: { position, listInfos } })
  }
  const list_remove = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_remove', data: ids })
  }
  const list_update = async(lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_update', data: lists })
  }
  const list_update_position = async(position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_update_position', data: { position, ids } })
  }
  const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_overwrite', data: { listId, musicInfos } })
  }
  const list_music_add = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_add', data: { id, musicInfos, addMusicLocationType } })
  }
  const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_move', data: { fromId, toId, musicInfos, addMusicLocationType } })
  }
  const list_music_remove = async(listId: string, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_remove', data: { listId, ids } })
  }
  const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_update', data: musicInfos })
  }
  const list_music_clear = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_clear', data: ids })
  }
  const list_music_update_position = async(listId: string, position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_update_position', data: { listId, position, ids } })
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

export const handleRemoteListAction = async({ action, data }: LX.Sync.ActionList) => {
  // console.log('handleRemoteListAction', action)

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
      return false
  }
  return true
}
