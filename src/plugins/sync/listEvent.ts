import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import { userLists } from '@/utils/listManage'

// 构建列表信息对象，用于统一字段位置顺序
export const buildUserListInfoFull = ({ id, name, source, sourceListId, list, locationUpdateTime }: LX.List.UserListInfoFull) => {
  return {
    id,
    name,
    source,
    sourceListId,
    locationUpdateTime,
    list,
  }
}

export const getLocalListData = async(): Promise<LX.Sync.List.ListData> => {
  return Promise.all([
    getListMusics(LIST_IDS.DEFAULT),
    getListMusics(LIST_IDS.LOVE),
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    ...userLists.map(l => getListMusics(l.id)),
  ]).then(([defaultList, loveList, ...userList]) => {
    return {
      defaultList,
      loveList,
      userList: userLists.map((l, i) => buildUserListInfoFull({ ...l, list: userList[i] })),
    }
  })
}

export const setLocalListData = async(listData: LX.Sync.List.ListData) => {
  await global.list_event.list_data_overwrite(listData, true)
}


export const registerListActionEvent = (sendListAction: (action: LX.Sync.List.ActionList) => (void | Promise<void>)) => {
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

export const handleRemoteListAction = async({ action, data }: LX.Sync.List.ActionList) => {
  // console.log('handleRemoteListAction', action)

  switch (action) {
    case 'list_data_overwrite':
      await global.list_event.list_data_overwrite(data, true)
      break
    case 'list_create':
      await global.list_event.list_create(data.position, data.listInfos, true)
      break
    case 'list_remove':
      await global.list_event.list_remove(data, true)
      break
    case 'list_update':
      await global.list_event.list_update(data, true)
      break
    case 'list_update_position':
      await global.list_event.list_update_position(data.position, data.ids, true)
      break
    case 'list_music_add':
      await global.list_event.list_music_add(data.id, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_move':
      await global.list_event.list_music_move(data.fromId, data.toId, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_remove':
      await global.list_event.list_music_remove(data.listId, data.ids, true)
      break
    case 'list_music_update':
      await global.list_event.list_music_update(data, true)
      break
    case 'list_music_update_position':
      await global.list_event.list_music_update_position(data.listId, data.position, data.ids, true)
      break
    case 'list_music_overwrite':
      await global.list_event.list_music_overwrite(data.listId, data.musicInfos, true)
      break
    case 'list_music_clear':
      await global.list_event.list_music_clear(data, true)
      break
    default:
      throw new Error('unknown list sync action')
  }
}
