import Event from './Event'

import { saveUserList, removeListMusics, saveListMusics } from '@/utils/data'
import {
  userLists,
  userListCreate,
  userListsUpdate,
  userListsRemove,
  userListsUpdatePosition,
  listDataOverwrite,
  listMusicOverwrite,
  listMusicAdd,
  listMusicMove,
  listMusicRemove,
  listMusicUpdateInfo,
  listMusicUpdatePosition,
  listMusicClear,
  allMusicList,
} from '@/utils/listManage'
import { LIST_IDS } from '@/config/constant'
import { setActiveList, setUserList } from '@/core/list'
import listState from '@/store/list/state'

const updateUserList = async(userLists: LX.List.UserListInfo[]) => {
  await saveUserList(userLists)
  setUserList(userLists)
}

const checkListExist = (changedIds: string[]) => {
  const index = changedIds.indexOf(listState.activeListId)
  if (index < 0 || listState.allList.some(l => l.id == listState.activeListId)) return
  setActiveList(LIST_IDS.DEFAULT)
}

export const checkUpdateList = async(changedIds: string[]) => {
  if (!changedIds.length) return
  await saveListMusics(changedIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics })))
  global.app_event.myListMusicUpdate(changedIds)
}


// {
//   // sync: {
//   //   send_action_list: 'send_action_list',
//   //   handle_action_list: 'handle_action_list',
//   //   send_sync_list: 'send_sync_list',
//   //   handle_sync_list: 'handle_sync_list',
//   // },
// }

export class ListEvent extends Event {
  /**
   * 现有歌曲列表更改时触发的事件
   * @param ids
   */
  // list_music_changed(ids: string[]) {
  //   this.emit('list_music_changed', ids)
  // }

  /**
   * 覆盖整个列表数据
   * @param listData 列表数据
   * @param isRemote 是否属于远程操作
   */
  async list_data_overwrite(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) {
    const oldIds = userLists.map(l => l.id)
    const changedIds = listDataOverwrite(listData)
    await updateUserList(userLists)
    // await checkUpdateList(changedIds)
    const removedList = oldIds.filter(id => !allMusicList.has(id))
    if (removedList.length) await removeListMusics(removedList)
    const allListIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userLists.map(l => l.id)]
    if (changedIds.includes(LIST_IDS.TEMP)) allListIds.push(LIST_IDS.TEMP)
    await saveListMusics([...allListIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics }))])

    global.app_event.myListMusicUpdate(changedIds)
    this.emit('list_data_overwrite', listData, isRemote)
    checkListExist(changedIds)
  }

  /**
   * 批量创建列表
   * @param position 列表位置
   * @param lists 列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_create(position: number, lists: LX.List.UserListInfo[], isRemote: boolean = false) {
    // const changedIds: string[] = []
    for (const list of lists) {
      userListCreate({ ...list, position })
      // changedIds.push(list.id)
    }
    await updateUserList(userLists)
    this.emit('list_create', position, lists, isRemote)
  }

  /**
   * 批量删除列表及列表内歌曲
   * @param ids 列表ids
   * @param isRemote 是否属于远程操作
   */
  async list_remove(ids: string[], isRemote: boolean = false) {
    const changedIds = userListsRemove(ids)
    await updateUserList(userLists)
    await removeListMusics(ids)
    this.emit('list_remove', ids, isRemote)
    global.app_event.myListMusicUpdate(changedIds)

    checkListExist(changedIds)
  }

  /**
   * 批量更新列表信息
   * @param lists 列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_update(lists: LX.List.UserListInfo[], isRemote: boolean = false) {
    userListsUpdate(lists)
    await updateUserList(userLists)
    this.emit('list_update', lists, isRemote)
  }

  /**
   * 批量更新列表位置
   * @param position 列表位置
   * @param ids 列表ids
   * @param isRemote 是否属于远程操作
   */
  async list_update_position(position: number, ids: string[], isRemote: boolean = false) {
    userListsUpdatePosition(position, ids)
    await updateUserList(userLists)
    this.emit('list_update_position', position, ids, isRemote)
  }

  /**
   * 覆盖列表内歌曲
   * @param listId 列表id
   * @param musicInfos 音乐信息
   * @param isRemote 是否属于远程操作
   */
  async list_music_overwrite(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) {
    const changedIds = await listMusicOverwrite(listId, musicInfos)
    await checkUpdateList(changedIds)
    this.emit('list_music_overwrite', listId, musicInfos, isRemote)
  }

  /**
   * 批量添加歌曲到列表
   * @param listId 列表id
   * @param musicInfos 添加的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async list_music_add(listId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) {
    const changedIds = await listMusicAdd(listId, musicInfos, addMusicLocationType)
    await checkUpdateList(changedIds)
    this.emit('list_music_add', listId, musicInfos, addMusicLocationType, isRemote)
  }

  /**
   * 批量移动歌曲
   * @param fromId 源列表id
   * @param toId 目标列表id
   * @param musicInfos 移动的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async list_music_move(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) {
    const changedIds = await listMusicMove(fromId, toId, musicInfos, addMusicLocationType)
    await checkUpdateList(changedIds)
    this.emit('list_music_move', fromId, toId, musicInfos, addMusicLocationType, isRemote)
  }

  /**
   * 批量移除歌曲
   * @param listId
   * @param listId 列表Id
   * @param ids 要删除歌曲的id
   * @param isRemote 是否属于远程操作
   */
  async list_music_remove(listId: string, ids: string[], isRemote: boolean = false) {
    const changedIds = await listMusicRemove(listId, ids)
    // console.log(changedIds)
    await checkUpdateList(changedIds)
    this.emit('list_music_remove', listId, ids, isRemote)
  }

  /**
   * 批量更新歌曲信息
   * @param musicInfos 歌曲&列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_music_update(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) {
    const changedIds = await listMusicUpdateInfo(musicInfos)
    await checkUpdateList(changedIds)
    this.emit('list_music_update', musicInfos, isRemote)
  }

  /**
   * 清空列表内的歌曲
   * @param ids 列表Id
   * @param isRemote 是否属于远程操作
   */
  async list_music_clear(ids: string[], isRemote: boolean = false) {
    const changedIds = await listMusicClear(ids)
    await checkUpdateList(changedIds)
    this.emit('list_music_clear', ids, isRemote)
  }

  /**
   * 批量更新歌曲位置
   * @param listId 列表ID
   * @param position 新位置
   * @param ids 歌曲id
   * @param isRemote 是否属于远程操作
   */
  async list_music_update_position(listId: string, position: number, ids: string[], isRemote: boolean = false) {
    const changedIds = await listMusicUpdatePosition(listId, position, ids)
    await checkUpdateList(changedIds)
    this.emit('list_music_update_position', listId, position, ids, isRemote)
  }
}


type EventMethods = Omit<EventType, keyof Event>


declare class EventType extends ListEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

export type ListEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>
export const createListEventHub = (): ListEventTypes => {
  return new ListEvent()
}

