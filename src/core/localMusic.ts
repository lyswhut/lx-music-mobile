import { createList, removeUserList } from '@/core/list'
import { updateSetting } from '@/core/common'
import { scanAudioFiles, readMetadata, type MusicMetadataFull } from '@/utils/localMediaMetadata'
import settingState from '@/store/setting/state'
import { toast } from '@/utils/tools'
import { formatPlayTime2 } from '@/utils'

/**
 * 简单的字符串 hash，用于生成稳定的 musicId
 */
const strHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return 'local_' + Math.abs(hash).toString(36)
}

/**
 * 构建 MusicInfoLocal 对象，缺失信息用假数据填充
 */
const buildLocalMusicInfo = (filePath: string, metadata: MusicMetadataFull | null): LX.Music.MusicInfoLocal => {
  const ext = filePath.substring(filePath.lastIndexOf('.') + 1)
  const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '未知歌曲'

  return {
    id: strHash(filePath),
    name: metadata?.name || fileName,
    singer: metadata?.singer || '未知歌手',
    source: 'local',
    interval: metadata ? formatPlayTime2(metadata.interval) : '0:00',
    meta: {
      albumName: metadata?.albumName || '未知专辑',
      filePath,
      songId: filePath,
      picUrl: '',
      ext: metadata?.ext || ext,
    },
  }
}

export const getFolderPath = (): string => {
  return settingState.setting['localMusic.folderPath'] || ''
}

export const setFolderPath = (path: string) => {
  updateSetting({ 'localMusic.folderPath': path })
}

export const getListId = (): string => {
  return settingState.setting['localMusic.listId'] || ''
}

export interface ScanProgress {
  current: number
  total: number
  currentFile: string
}

export interface ScanResult {
  total: number
  success: number
  failed: number
}

let lastScanResult: ScanResult = { total: 0, success: 0, failed: 0 }

export const getScanResult = (): ScanResult => lastScanResult

/**
 * 执行扫描：扫描文件夹 → 读取标签 → 创建/更新列表
 */
export const startScan = async(onProgress?: (progress: ScanProgress) => void): Promise<ScanResult> => {
  const folderPath = getFolderPath()
  if (!folderPath) {
    toast(global.i18n.t('setting_localMusic_no_folder'), 'long')
    return { total: 0, success: 0, failed: 0 }
  }

  // 1. 扫描音频文件
  const files = await scanAudioFiles(folderPath)
  if (!files.length) {
    toast(global.i18n.t('setting_localMusic_empty'), 'long')
    lastScanResult = { total: 0, success: 0, failed: 0 }
    return lastScanResult
  }

  const total = files.length
  const musicInfos: LX.Music.MusicInfoLocal[] = []
  const failedPaths: string[] = []

  // 2. 逐个读取元数据
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.({
      current: i + 1,
      total,
      currentFile: file.name,
    })

    try {
      const metadata = await readMetadata(file.path)
      musicInfos.push(buildLocalMusicInfo(file.path, metadata))
    } catch {
      // 读取失败也用假数据填充
      musicInfos.push(buildLocalMusicInfo(file.path, null))
      failedPaths.push(file.path)
    }
  }

  // 3. 查找并删除旧的"本地音乐"列表
  const oldListId = getListId()
  if (oldListId) {
    try {
      await removeUserList([oldListId])
    } catch {
      // 旧列表可能已被手动删除，忽略错误
    }
  }

  // 4. 创建新的"本地音乐"列表
  const listName = global.i18n.t('setting_localMusic_list_name')
  const newListId = `userlist_${Date.now()}`
  await createList({
    name: listName,
    id: newListId,
    list: musicInfos,
    position: 0,
  })

  // 5. 保存新列表 ID
  updateSetting({ 'localMusic.listId': newListId })

  const success = total - failedPaths.length
  lastScanResult = { total, success, failed: failedPaths.length }

  if (failedPaths.length) {
    toast(global.i18n.t('setting_localMusic_scan_complete', { total }) + '\n' + global.i18n.t('setting_localMusic_scan_failed', { failed: failedPaths.length }), 'long')
  } else {
    toast(global.i18n.t('setting_localMusic_scan_complete', { total }), 'long')
  }

  return lastScanResult
}
