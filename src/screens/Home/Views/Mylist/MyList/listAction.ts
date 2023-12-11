import { addListMusics, getListMusics, removeUserList, setFetchingListStatus } from '@/core/list'
import { confirmDialog, handleReadFile, handleSaveFile, showImportTip, toast } from '@/utils/tools'
import syncSourceList from '@/core/syncSourceList'
import { log } from '@/utils/log'
import { filterFileName, filterMusicList, formatPlayTime2, toNewMusicInfo } from '@/utils'
import { handleImportListPart } from '@/screens/Home/Views/Setting/settings/Backup/actions'
import { type MusicMetadata, readMetadata, scanAudioFiles } from '@/utils/localMediaMetadata'
import settingState from '@/store/setting/state'

export const handleRemove = (listInfo: LX.List.UserListInfo) => {
  void confirmDialog({
    message: global.i18n.t('list_remove_tip', { name: listInfo.name }),
    confirmButtonText: global.i18n.t('list_remove_tip_button'),
  }).then(isRemove => {
    if (!isRemove) return
    void removeUserList([listInfo.id])
  })
}

const readListData = async(path: string) => {
  let configData: any
  try {
    configData = await handleReadFile(path)
  } catch (error: any) {
    log.error(error.stack)
    throw error
  }
  let listData: LX.ConfigFile.MyListInfoPart['data']
  switch (configData.type) {
    case 'playListPart':
      listData = configData.data
      listData.list = filterMusicList(listData.list.map(m => toNewMusicInfo(m)))
      break
    case 'playListPart_v2':
      listData = configData.data
      break
    default:
      showImportTip(configData.type as string)
      return null
  }
  return listData
}

export const handleImport = (path: string, position: number) => {
  toast(global.i18n.t('setting_backup_part_import_list_tip_unzip'))
  void readListData(path).then(async listData => {
    if (listData == null) return
    void handleImportListPart(listData, position)
  }).catch(() => {
    toast(global.i18n.t('setting_backup_part_import_list_tip_error'))
  })
}

const exportList = async(listInfo: LX.List.MyListInfo, path: string) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playListPart_v2',
    data: {
      ...listInfo,
      list: await getListMusics(listInfo.id),
    },
  }))
  try {
    await handleSaveFile(`${path}/lx_list_part_${filterFileName(listInfo.name)}.lxmc`, data)
  } catch (error: any) {
    log.error(error.stack)
  }
}
export const handleExport = (listInfo: LX.List.MyListInfo, path: string) => {
  toast(global.i18n.t('setting_backup_part_export_list_tip_zip'))
  exportList(listInfo, path).then(() => {
    toast(global.i18n.t('setting_backup_part_export_list_tip_success'))
  }).catch((err: any) => {
    log.error(err.message)
    toast(global.i18n.t('setting_backup_part_export_list_tip_failed') + ': ' + (err.message as string))
  })
}

export const handleSync = (listInfo: LX.List.UserListInfo) => {
  void confirmDialog({
    message: global.i18n.t('list_sync_confirm_tip', { name: listInfo.name }),
    confirmButtonText: global.i18n.t('list_remove_tip_button'),
  }).then(isSync => {
    if (!isSync) return
    void syncSourceList(listInfo).then(() => {
      toast(global.i18n.t('list_update_success', { name: listInfo.name }))
    }).catch(() => {
      toast(global.i18n.t('list_update_error', { name: listInfo.name }))
    })
  })
}

const buildLocalMusicInfo = (filePath: string, metadata: MusicMetadata): LX.Music.MusicInfoLocal => {
  return {
    id: filePath,
    name: metadata.name,
    singer: metadata.singer,
    source: 'local',
    interval: formatPlayTime2(metadata.interval),
    meta: {
      albumName: metadata.albumName,
      filePath,
      songId: filePath,
      picUrl: '',
      ext: metadata.ext,
    },
  }
}
const createLocalMusicInfos = async(filePaths: string[]): Promise<LX.Music.MusicInfoLocal[]> => {
  const list: LX.Music.MusicInfoLocal[] = []
  for await (const path of filePaths) {
    const musicInfo = await readMetadata(path)
    if (!musicInfo) continue
    list.push(buildLocalMusicInfo(path, musicInfo))
  }

  return list
}
const handleAddMusics = async(listId: string, filePaths: string[], index: number = -1, total: number = 0, successNum = 0) => {
  // console.log(index + 1, index + 201)
  if (!total) total = filePaths.length
  const paths = filePaths.slice(index + 1, index + 201)
  const musicInfos = await createLocalMusicInfos(paths)
  successNum += musicInfos.length
  if (musicInfos.length) await addListMusics(listId, musicInfos, settingState.setting['list.addMusicLocationType'])
  index += 200
  if (filePaths.length - 1 > index) await handleAddMusics(listId, filePaths, index, total, successNum)

  toast(global.i18n.t('list_select_local_file_result_tip', { total, success: successNum, failed: total - successNum }), 'long')
}
export const handleImportMediaFile = async(listInfo: LX.List.MyListInfo, path: string) => {
  setFetchingListStatus(listInfo.id, true)
  const files = await scanAudioFiles(path)
  if (files.length) await handleAddMusics(listInfo.id, files)
  else toast(global.i18n.t('list_select_local_file_empty_tip'), 'long')
  setFetchingListStatus(listInfo.id, false)
}
