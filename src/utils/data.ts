import { getData, saveData, getAllKeys, removeDataMultiple, saveDataMultiple, removeData, getDataMultiple } from '@/plugins/storage'
import { DEFAULT_SETTING, LIST_IDS, storageDataPrefix, type NAV_ID_Type } from '@/config/constant'
import { throttle } from './common'
// import { gzip, ungzip } from '@/utils/nativeModules/gzip'
// import { readFile, writeFile, temporaryDirectoryPath, unlink } from '@/utils/fs'
// import { isNotificationsEnabled, openNotificationPermissionActivity, shareText } from '@/utils/nativeModules/utils'
// import { i18n } from '@/plugins/i18n'
// import musicSdk from '@/utils/musicSdk'

const fontSizeKey = storageDataPrefix.fontSize
const themeKey = storageDataPrefix.theme
const playInfoStorageKey = storageDataPrefix.playInfo
const userListKey = storageDataPrefix.userList
const viewPrevStateKey = storageDataPrefix.viewPrevState
const listScrollPositionKey = storageDataPrefix.listScrollPosition
const listUpdateInfoKey = storageDataPrefix.listUpdateInfo
const ignoreVersionKey = storageDataPrefix.ignoreVersion
const searchSettingKey = storageDataPrefix.searchSetting
const searchHistoryListKey = storageDataPrefix.searchHistoryList
const songListSettingKey = storageDataPrefix.songListSetting
const leaderboardSettingKey = storageDataPrefix.leaderboardSetting
const listPrevSelectIdKey = storageDataPrefix.listPrevSelectId
const syncAuthKeyPrefix = storageDataPrefix.syncAuthKey
const syncHostPrefix = storageDataPrefix.syncHost
const syncHostHistoryPrefix = storageDataPrefix.syncHostHistory
const listPrefix = storageDataPrefix.list

// const defaultListKey = listPrefix + 'default'
// const loveListKey = listPrefix + 'love'

let listPosition: LX.List.ListPositionInfo
let listPrevSelectId: string
let listUpdateInfo: LX.List.ListUpdateInfo

let searchSetting: typeof DEFAULT_SETTING['search']
let songListSetting: typeof DEFAULT_SETTING['songList']
let leaderboardSetting: typeof DEFAULT_SETTING['leaderboard']
let searchHistoryList: string[]

const saveListPositionThrottle = throttle(() => {
  void saveData(listScrollPositionKey, listPosition)
}, 1000)
const saveSearchSettingThrottle = throttle(() => {
  void saveData(searchSettingKey, searchSetting)
}, 1000)
const saveSearchHistoryThrottle = throttle(() => {
  void saveData(searchHistoryListKey, searchHistoryList)
}, 1000)
const saveSongListSettingThrottle = throttle(() => {
  void saveData(songListSettingKey, songListSetting)
}, 1000)
const saveLeaderboardSettingThrottle = throttle(() => {
  void saveData(leaderboardSettingKey, leaderboardSetting)
}, 1000)
const saveViewPrevStateThrottle = throttle((state) => {
  void saveData(viewPrevStateKey, state)
}, 1000)

export const getFontSize = async() => (await getData<number>(fontSizeKey) ?? 1)
export const saveFontSize = async(size: number) => {
  await saveData(fontSizeKey, size)
}

export const getUserTheme = async() => (await getData<LX.Theme[]>(themeKey) ?? [])
export const saveUserTheme = async(themes: LX.Theme[]) => {
  await saveData(themeKey, themes)
}


const initPosition = async() => {
  listPosition ??= await getData(listScrollPositionKey) ?? {}
}
export const getListPosition = async(id: string): Promise<number> => {
  await initPosition()
  return listPosition[id] ?? 0
}
export const saveListPosition = async(id: string, position?: number) => {
  await initPosition()
  listPosition[id] = position ?? 0
  saveListPositionThrottle()
}
export const removeListPosition = async(id: string) => {
  await initPosition()
  delete listPosition[id]
  saveListPositionThrottle()
}
export const overwriteListPosition = async(ids: string[]) => {
  await initPosition()
  const removedIds = []
  for (const id of Object.keys(listPosition)) {
    if (ids.includes(id)) continue
    removedIds.push(id)
  }
  for (const id of removedIds) delete listPosition[id]
  saveListPositionThrottle()
}

const saveListPrevSelectIdThrottle = throttle(() => {
  void saveData(listPrevSelectIdKey, listPrevSelectId)
}, 200)
export const getListPrevSelectId = async() => {
  listPrevSelectId ??= await getData(listPrevSelectIdKey) ?? LIST_IDS.DEFAULT
  return listPrevSelectId || LIST_IDS.DEFAULT
}
export const saveListPrevSelectId = (id: string) => {
  listPrevSelectId = id
  saveListPrevSelectIdThrottle()
}

const saveListUpdateInfoThrottle = throttle(() => {
  void saveData(listUpdateInfoKey, listUpdateInfo)
}, 1000)

const initListUpdateInfo = async() => {
  listUpdateInfo ??= await getData(listUpdateInfoKey) ?? {}
}
export const getListUpdateInfo = async() => {
  await initListUpdateInfo()
  return listUpdateInfo
}
export const saveListUpdateInfo = async(info: LX.List.ListUpdateInfo) => {
  await initListUpdateInfo()
  listUpdateInfo = info
  saveListUpdateInfoThrottle()
}
export const setListAutoUpdate = async(id: string, enable: boolean) => {
  await initListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.isAutoUpdate = enable
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfoThrottle()
}
export const setListUpdateTime = async(id: string, time: number) => {
  await initListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.updateTime = time
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfoThrottle()
}
// export const setListUpdateInfo = (id, { updateTime, isAutoUpdate }) => {
//   listUpdateInfo[id] = { updateTime, isAutoUpdate }
//   saveListUpdateInfo()
// }
export const removeListUpdateInfo = async(id: string) => {
  await initListUpdateInfo()
  delete listUpdateInfo[id]
  saveListUpdateInfoThrottle()
}
export const overwriteListUpdateInfo = async(ids: string[]) => {
  await initListUpdateInfo()
  const removedIds = []
  for (const id of Object.keys(listUpdateInfo)) {
    if (ids.includes(id)) continue
    removedIds.push(id)
  }
  for (const id of removedIds) delete listUpdateInfo[id]
  saveListUpdateInfoThrottle()
}

let ignoreVersion: string | null
export const saveIgnoreVersion = (version: string | null) => {
  ignoreVersion = version
  if (version == null) {
    void removeData(ignoreVersionKey)
  } else {
    void saveData(ignoreVersionKey, version)
  }
}
// 获取忽略更新的版本号
export const getIgnoreVersion = async() => {
  if (ignoreVersion === undefined) ignoreVersion = (await getData<string | null>(ignoreVersionKey)) ?? null
  return ignoreVersion
}


export const getSearchSetting = async() => {
  searchSetting ??= await getData(searchSettingKey) ?? { ...DEFAULT_SETTING.search }
  return { ...searchSetting }
}
export const saveSearchSetting = async(setting: Partial<typeof DEFAULT_SETTING['search']>) => {
  if (!searchSetting) await getSearchSetting()
  let requiredSave = false
  if (setting.source && searchSetting.source != setting.source) requiredSave = true
  if (setting.type && searchSetting.type != setting.type) requiredSave = true
  if (setting.temp_source && searchSetting.temp_source != setting.temp_source) requiredSave = true

  if (!requiredSave) return
  searchSetting = Object.assign(searchSetting, setting)
  saveSearchSettingThrottle()
}

export const getSearchHistory = async() => {
  searchHistoryList ??= await getData(searchHistoryListKey) ?? []
  return [...searchHistoryList]
}
export const saveSearchHistory = async(historyList: typeof searchHistoryList) => {
  if (!searchHistoryList) await getSearchHistory()
  searchHistoryList = historyList
  saveSearchHistoryThrottle()
}

export const getSongListSetting = async() => {
  songListSetting ??= await getData(songListSettingKey) ?? { ...DEFAULT_SETTING.songList }
  return { ...songListSetting }
}
export const saveSongListSetting = async(setting: Partial<typeof DEFAULT_SETTING['songList']>) => {
  if (!songListSetting) await getSongListSetting()
  songListSetting = Object.assign(songListSetting, setting)
  saveSongListSettingThrottle()
}

export const getLeaderboardSetting = async() => {
  leaderboardSetting ??= await getData(leaderboardSettingKey) ?? { ...DEFAULT_SETTING.leaderboard }
  return { ...leaderboardSetting }
}
export const saveLeaderboardSetting = async(setting: Partial<typeof DEFAULT_SETTING['leaderboard']>) => {
  if (!leaderboardSetting) await getLeaderboardSetting()
  leaderboardSetting = Object.assign(leaderboardSetting, setting)
  saveLeaderboardSettingThrottle()
}

export const getViewPrevState = async() => {
  return await getData<{ id: NAV_ID_Type }>(viewPrevStateKey) ?? { ...DEFAULT_SETTING.viewPrevState }
}
export const saveViewPrevState = (state: { id: NAV_ID_Type }) => {
  saveViewPrevStateThrottle(state)
}


/**
 * 获取用户列表
 */
export const getUserLists = async(): Promise<LX.List.UserListInfo[]> => {
  const list = await getData<LX.List.UserListInfo[]>(userListKey)
  return list ?? []
}

/**
 * 保存用户列表
 * @param listInfo
 */
export const saveUserList = async(listInfo: LX.List.UserListInfo[]) => {
  await saveData(userListKey, listInfo)
}

/**
 * 获取列表内歌曲
 * @param listId 列表id
 * @returns
 */
export const getListMusics = async(listId: string): Promise<LX.Music.MusicInfo[]> => {
  const list = await getData<LX.Music.MusicInfo[]>(listPrefix + listId)
  return list ?? []
}

/**
 * 保存列表内歌曲
 * @param listData 列表数据
 */
export const saveListMusics = async(listData: Array<{ id: string, musics: LX.Music.MusicInfo[] }>) => {
  if (listData.length > 1) {
    await saveDataMultiple(listData.map(list => ([listPrefix + list.id, list.musics])))
  } else {
    const list = listData[0]
    await saveData(listPrefix + list.id, list.musics)
  }
}

/**
 * 移除歌曲列表
 * @param ids
 */
export const removeListMusics = async(ids: string[]): Promise<void> => {
  if (ids.length > 1) {
    await removeDataMultiple(ids.map(id => {
      // delete global.lx.listScrollPosition[id]
      // delete global.lx.listSort[id]
      return listPrefix + id
    }))
  } else {
    await removeData(listPrefix + ids[0])
  }
  // await saveData(listSortPrefix, global.lx.listSort)
  // delaySaveListScrollPosition(global.lx.listScrollPosition)
}


export const getMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality) => getData<string>(`${storageDataPrefix.musicUrl}${musicInfo.id}_${type}`).then((url) => url ?? '')
export const saveMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality, url: string) => saveData(`${storageDataPrefix.musicUrl}${musicInfo.id}_${type}`, url)
export const clearMusicUrl = async(keys?: string[]) => {
  if (!keys) keys = (await getAllKeys()).filter(key => key.startsWith(storageDataPrefix.musicUrl))
  await removeDataMultiple(keys)
}

export const getLyric = async(musicInfo: LX.Music.MusicInfo) => getData<LX.Music.LyricInfo>(`${storageDataPrefix.lyric}${musicInfo.id}`).then(lrcInfo => lrcInfo ?? { lyric: '' })
export const saveLyric = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo) => saveData(`${storageDataPrefix.lyric}${musicInfo.id}`, lyricInfo)
export const clearLyric = async(keys?: string[]) => {
  if (!keys) keys = (await getAllKeys()).filter(key => key.startsWith(storageDataPrefix.lyric))
  await removeDataMultiple(keys)
}
export const saveEditedLyric = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo) => saveData(`${storageDataPrefix.lyric}${musicInfo.id}_edited`, lyricInfo)
export const clearEditedLyric = async() => {
  let keys = (await getAllKeys()).filter(key => key.startsWith(storageDataPrefix.lyric) && key.endsWith('_edited'))
  await removeDataMultiple(keys)
}
export const getPlayerLyric = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Player.LyricInfo> => {
  return getDataMultiple([
    `${storageDataPrefix.lyric}${musicInfo.id}`,
    `${storageDataPrefix.lyric}${musicInfo.id}_edited`,
  ]).then(([lrcInfo, lrcInfo_edited]) => {
    const lyricInfo: LX.Music.LyricInfo = lrcInfo_edited[1] as LX.Music.LyricInfo | null ?? {
      lyric: '',
    }
    let rawLyricInfo: LX.Music.LyricInfo = lrcInfo[1] as LX.Music.LyricInfo | null ?? {
      lyric: '',
    }
    return lyricInfo.lyric ? {
      ...lyricInfo,
      rawlrcInfo: rawLyricInfo,
    } : {
      ...rawLyricInfo,
      rawlrcInfo: rawLyricInfo,
    }
  })
}

export const getOtherSource = async(id: string) => getData<LX.Music.MusicInfoOnline[]>(`${storageDataPrefix.musicOtherSource}${id}`).then((url) => url ?? [])
export const saveOtherSource = async(id: string, sourceInfo: LX.Music.MusicInfoOnline[]) => saveData(`${storageDataPrefix.musicOtherSource}${id}`, sourceInfo)
export const clearOtherSource = async(keys?: string[]) => {
  if (!keys) keys = (await getAllKeys()).filter(key => key.startsWith(storageDataPrefix.musicOtherSource))
  await removeDataMultiple(keys)
}

// export const clearMusicUrlAndLyric = async() => {
//   let keys = (await getAllKeys()).filter(key => key.startsWith(storageDataPrefix.musicUrl) || key.startsWith(storageDataPrefix.lyric))
//   await removeDataMultiple(keys)
// }

export const getMetaCache = async() => {
  const keys = await getAllKeys()
  const info = {
    otherSourceKeys: [] as string[],
    // musicUrlKeys: [] as string[],
    lyricKeys: [] as string[],
  }

  for (const key of keys) {
    if (key.startsWith(storageDataPrefix.musicOtherSource)) info.otherSourceKeys.push(key)
    else if (key.startsWith(storageDataPrefix.lyric)) info.lyricKeys.push(key)
  }

  return info
}

export const savePlayInfo = async(playInfo: LX.Player.SavedPlayInfo) => {
  return saveData(playInfoStorageKey, playInfo)
}
// 获取上次关闭时的当前歌曲播放信息
export const getPlayInfo = async() => {
  return getData<LX.Player.SavedPlayInfo | null>(playInfoStorageKey)
}

export const getSyncAuthKey = async(serverId: string) => {
  const keys = await getData<Record<string, LX.Sync.KeyInfo>>(syncAuthKeyPrefix)
  if (!keys) return null
  return keys[serverId] ?? null
}
export const setSyncAuthKey = async(serverId: string, info: LX.Sync.KeyInfo) => {
  let keys = await getData<Record<string, LX.Sync.KeyInfo>>(syncAuthKeyPrefix) ?? {}
  keys[serverId] = info
  await saveData(syncAuthKeyPrefix, keys)
}

let syncHostInfo: string
export const getSyncHost = async() => {
  if (syncHostInfo === undefined) {
    syncHostInfo = await getData(syncHostPrefix) ?? ''

    // 清空1.0.0之前版本的同步主机
    if (typeof syncHostInfo == 'object') syncHostInfo = ''
  }
  return syncHostInfo
}
export const setSyncHost = async(host: string) => {
  // let hostInfo = await getData(syncHostPrefix) || {}
  // hostInfo.host = host
  // hostInfo.port = port
  syncHostInfo = host
  await saveData(syncHostPrefix, syncHostInfo)
}
let syncHostHistory: string[]
export const getSyncHostHistory = async() => {
  if (syncHostHistory === undefined) {
    syncHostHistory = await getData(syncHostHistoryPrefix) ?? []

    // 清空1.0.0之前版本的同步历史
    if (syncHostHistory.length && typeof syncHostHistory[0] !== 'string') syncHostHistory = []
  }
  return syncHostHistory
}
export const addSyncHostHistory = async(host: string) => {
  let syncHostHistory = await getSyncHostHistory()
  if (syncHostHistory.some(h => h == host)) return
  syncHostHistory.unshift(host)
  if (syncHostHistory.length > 20) syncHostHistory = syncHostHistory.slice(0, 20) // 最多存储20个
  await saveData(syncHostHistoryPrefix, syncHostHistory)
}
export const removeSyncHostHistory = async(index: number) => {
  syncHostHistory.splice(index, 1)
  await saveData(syncHostHistoryPrefix, syncHostHistory)
}

