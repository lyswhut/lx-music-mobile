import { LIST_IDS } from '@/config/constant'
import listAction from '@/store/list/action'
import listState from '@/store/list/state'
import settingState from '@/store/setting/state'
import { fixNewMusicInfoQuality } from '@/utils'
import { saveListPrevSelectId } from '@/utils/data'

/**
 * 覆盖全部列表数据
 * @param data
 */
export const overwriteListFull = async(data: LX.List.ListActionDataOverwrite) => {
  await global.list_event.list_data_overwrite(data)
}


/**
 * 添加用户列表
 */
export const createUserList = async(position: number, listInfos: LX.List.UserListInfo[]) => {
  await global.list_event.list_create(position, listInfos)
}

/**
 * 移除用户列表及列表内歌曲
 */
export const removeUserList = async(ids: string[]) => {
  await global.list_event.list_remove(ids)
}

/**
 * 更新用户列表
 */
export const updateUserList = async(listInfos: LX.List.UserListInfo[]) => {
  await global.list_event.list_update(listInfos)
}

/**
 * 批量移动用户列表位置
 */
export const updateUserListPosition = async(position: number, ids: string[]) => {
  await global.list_event.list_update_position(position, ids)
}


/**
 * 批量添加歌曲到列表
 */
export const addListMusics = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
  await global.list_event.list_music_add(id, musicInfos, addMusicLocationType)
}

/**
 * 跨列表批量移动歌曲
 */
export const moveListMusics = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
  await global.list_event.list_music_move(fromId, toId, musicInfos, addMusicLocationType)
}

/**
 * 批量删除列表内歌曲
 */
export const removeListMusics = async(listId: string, ids: string[]) => {
  await global.list_event.list_music_remove(listId, ids)
}

/**
 * 批量更新列表内歌曲
 */
export const updateListMusics = async(infos: Array<{ id: string, musicInfo: LX.Music.MusicInfo }>) => {
  await global.list_event.list_music_update(infos)
}

/**
 * 批量移动列表内歌曲的位置
 */
export const updateListMusicPosition = async(listId: string, position: number, ids: string[]) => {
  await global.list_event.list_music_update_position(listId, position, ids)
}

/**
 * 覆盖列表内的歌曲
 */
export const overwriteListMusics = async(listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  await global.list_event.list_music_overwrite(listId, musicInfos)
}

/**
 * 覆盖列表内的歌曲
 */
export const clearListMusics = async(ids: string[]) => {
  await global.list_event.list_music_clear(ids)
}

/**
 * 覆盖单个列表
 * @param listInfo
 * @param musics
 */
export const overwriteList = async(listInfoFull: LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull) => {
  let userListInfo
  switch (listInfoFull.id) {
    case LIST_IDS.DEFAULT:
    case LIST_IDS.LOVE:
      break

    default:
      userListInfo = listInfoFull as LX.List.UserListInfo
      await updateUserList([
        {
          name: userListInfo.name,
          id: userListInfo.id,
          source: userListInfo.source,
          sourceListId: userListInfo.sourceListId,
          locationUpdateTime: userListInfo.locationUpdateTime,
        },
      ])
      break
  }
  await overwriteListMusics(listInfoFull.id, listInfoFull.list.map(m => fixNewMusicInfoQuality(m)))
}
/**
 * 覆盖单个列表
 * @param listInfo
 * @param musics
 */
export const createList = async({ name, id = `userlist_${Date.now()}`, list = [], source, sourceListId, position = -1 }: {
  name?: string
  id?: string
  list?: LX.Music.MusicInfo[]
  source?: LX.OnlineSource
  sourceListId?: string
  position?: number
}) => {
  await createUserList(position < 0 ? listState.userList.length : position, [
    {
      id,
      name: name ?? 'list',
      source,
      sourceListId,
      locationUpdateTime: position < 0 ? null : Date.now(),
    },
  ])
  if (list) await addListMusics(id, list, settingState.setting['list.addMusicLocationType'])
}

/**
 * 设置当前激活的歌曲列表
 * @param id
 */
export const setActiveList = (id: string) => {
  if (listState.activeListId == id) return
  listAction.setActiveList(id)
  saveListPrevSelectId(id)
}

/**
 * 设置歌曲列表
 */
export const setUserList = (lists: LX.List.UserListInfo[]) => {
  listAction.setUserLists(lists)
}

/**
 * 设置临时列表内歌曲
 * @param id
 * @param list
 */
export const setTempList = async(id: string, list: LX.Music.MusicInfoOnline[]) => {
  await overwriteListMusics(LIST_IDS.TEMP, list)
  listAction.setTempListMeta({ id })
}


export const setFetchingListStatus = (id: string, status: boolean) => {
  listAction.setFetchingListStatus(id, status)
}


export { getUserLists, getListMusics } from '@/utils/listManage'

