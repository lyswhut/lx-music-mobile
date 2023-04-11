import { filterMusicList, toNewMusicInfo } from '@/utils'
import { LIST_IDS, storageDataPrefix, storageDataPrefixOld } from '@/config/constant'
import { getAllKeys, getData, getDataMultiple, removeData, saveData } from '@/plugins/storage'
import { allMusicList, listDataOverwrite, userLists } from '@/utils/listManage'
import { saveListMusics, saveUserList } from '@/utils/data'


interface OldUserListInfo {
  name: string
  id: string
  source?: LX.OnlineSource
  sourceListId?: string
  locationUpdateTime?: number
  list: any[]
}


/* export const migrateListData = async() => {
  let playList = await parseDataFile<{ defaultList?: { list: any[] }, loveList?: { list: any[] }, tempList?: { list: any[] }, userList?: OldUserListInfo[] }>('playList.json')
  let listDataAll: LX.List.ListDataFull = {
    defaultList: [],
    loveList: [],
    userList: [],
    tempList: [],
  }
  let isRequiredSave = false
  if (playList) {
    if (playList.defaultList) listDataAll.defaultList = filterMusicList(playList.defaultList.list.map(m => toNewMusicInfo(m)))
    if (playList.loveList) listDataAll.loveList = filterMusicList(playList.loveList.list.map(m => toNewMusicInfo(m)))
    if (playList.tempList) listDataAll.tempList = filterMusicList(playList.tempList.list.map(m => toNewMusicInfo(m)))
    if (playList.userList) {
      listDataAll.userList = playList.userList.map(l => {
        return {
          ...l,
          locationUpdateTime: l.locationUpdateTime ?? null,
          list: filterMusicList(l.list.map(m => toNewMusicInfo(m))),
        }
      })
    }
    isRequiredSave = true
  } else {
    const config = await parseDataFile<{ list?: { defaultList?: any[], loveList?: any[] } }>('config.json')
    if (config?.list) {
      const list = config.list
      if (list.defaultList) listDataAll.defaultList = filterMusicList(list.defaultList.map(m => toNewMusicInfo(m)))
      if (list.loveList) listDataAll.loveList = filterMusicList(list.loveList.map(m => toNewMusicInfo(m)))
      isRequiredSave = true
    }
  }
  if (isRequiredSave) await global.lx.worker.dbService.listDataOverwrite(listDataAll)

  const lyricData = await parseDataFile<Record<string, LX.Music.LyricInfo>>('lyrics_edited.json')
  if (lyricData) {
    for await (const [id, info] of Object.entries(lyricData)) {
      await global.lx.worker.dbService.editedLyricAdd(id, info)
    }
  }
}
 */
export const getAllListData = async(): Promise<{
  defaultList?: { list: any[] }
  loveList?: { list: any[] }
  tempList?: { list: any[] }
  userList?: OldUserListInfo[]
}> => {
  const defaultListKey = storageDataPrefixOld.list + 'default'
  const loveListKey = storageDataPrefixOld.list + 'love'
  let defaultList
  let loveList
  let userList = []
  let keys = await getAllKeys()
  const listKeys: string[] = []
  for (const key of keys) {
    if (key.startsWith(storageDataPrefixOld.list)) {
      listKeys.push(key)
    }
  }
  const listData = await getDataMultiple(listKeys) as Array<[string, any]>
  for (const [key, value] of listData) {
    switch (key) {
      case defaultListKey:
        defaultList = value
        break
      case loveListKey:
        loveList = value
        break
      default:
        userList.push(value)
        break
    }
  }

  const listSort: Record<string, number> = await getData(storageDataPrefixOld.listSort) ?? {}

  userList.sort((a, b) => {
    if (listSort[a.id] == null) return listSort[b.id] == null ? -1 : 1
    return listSort[b.id] == null ? 1 : listSort[a.id] - listSort[b.id]
  })
  userList.forEach((list, index) => {
    if (listSort[list.id] == null) {
      listSort[list.id] = index
      delete list.location
    }
  })

  return {
    defaultList,
    loveList,
    userList,
  }
}

/**
 * 迁移 v1.0.0 之前的 list data
 * @returns
 */
export const migrateListData = async() => {
  const playList = await getAllListData()
  let listDataAll: LX.List.ListDataFull = {
    defaultList: [],
    loveList: [],
    userList: [],
    tempList: [],
  }
  if (playList.defaultList) listDataAll.defaultList = filterMusicList(playList.defaultList.list.map(m => toNewMusicInfo(m)))
  if (playList.loveList) listDataAll.loveList = filterMusicList(playList.loveList.list.map(m => toNewMusicInfo(m)))
  if (playList.userList) {
    listDataAll.userList = playList.userList.map(l => {
      return {
        ...l,
        locationUpdateTime: l.locationUpdateTime ?? null,
        list: filterMusicList(l.list.map(m => toNewMusicInfo(m))),
      }
    })
  }
  listDataOverwrite(listDataAll)
  await saveUserList(userLists)
  const allListIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userLists.map(l => l.id)]
  await saveListMusics([...allListIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics }))])
  await removeData(storageDataPrefixOld.listSort)

  const listPosition = await getData(storageDataPrefixOld.listPosition)
  if (listPosition != null) {
    await saveData(storageDataPrefix.listScrollPosition, listPosition)
    await removeData(storageDataPrefixOld.listPosition)
  }
}

const timeStr2Intv = (timeStr: string) => {
  let intvArr = timeStr.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += parseInt(intvArr.pop() as string) * unit
    unit *= 60
  }
  return intv
}
const migratePlayInfo = async() => {
  const playInfo = await getData<any>(storageDataPrefixOld.playInfo)
  if (playInfo == null) return
  if (playInfo.list !== undefined) delete playInfo.list
  if (playInfo.maxTime) playInfo.maxTime = timeStr2Intv(playInfo.maxTime)
  await saveData(storageDataPrefix.playInfo, playInfo)
}
/**
 * 迁移 v1.0.0 之前的 meta 数据
 * @returns
 */
export const migrateMetaData = async() => {
  await migratePlayInfo()
  // const [playInfo] = await getDataMultiple([
  //   storageDataPrefixOld.listPosition,
  //   storageDataPrefixOld.playInfo,
  // ])

  // await saveDataMultiple([
  //   // [storageDataPrefix.listScrollPosition, listPosition[1]],
  //   [storageDataPrefix.playInfo, migratePlayInfo(playInfo[1])],
  // ])
  // await removeDataMultiple([
  //   storageDataPrefix.listScrollPosition,
  // ])
}

