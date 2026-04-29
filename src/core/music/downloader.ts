import { Linking, Platform } from 'react-native'
import { getMusicUrl } from './index'
import settingState from '@/store/setting/state'
import {
  downloadFile,
  ensureMusicDownloadDirectory,
  existsMusicDownloadTarget,
  scanMusicDownloadFile,
} from '@/utils/fs'
import { filterFileName } from '@/utils/common'
import { confirmDialog, requestStoragePermission, toast } from '@/utils/tools'

const AUDIO_EXT_RXP = /\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/

/**
 * 根据歌曲信息与设置生成基础文件名。
 */
const createBaseFileName = (musicInfo: LX.Music.MusicInfoOnline) => {
  const template = settingState.setting['download.fileName']
  const name = template
    .replace('歌名', musicInfo.name)
    .replace('歌手', musicInfo.singer || '未知歌手')
    .trim()
  return filterFileName(name) || `${Date.now()}`
}

/**
 * 从 URL 推断文件后缀，无法识别时回退到 mp3。
 */
const parseExtByUrl = (url: string) => {
  const ext = url.match(AUDIO_EXT_RXP)?.[1]?.toLowerCase()
  return ext && ext.length <= 5 ? ext : 'mp3'
}

/**
 * Android：写入公共「下载」前请求存储权限；拒绝时抛出带文案的错误以便上层提示。
 */
const ensureAndroidStorageForPublicDownload = async() => {
  if (Platform.OS !== 'android') return

  const result = await requestStoragePermission()
  if (result === true) return

  if (result === false) {
    toast(global.i18n.t('download_permission_denied'), 'long')
    throw new Error(global.i18n.t('download_permission_denied'))
  }

  const openSettings = await confirmDialog({
    title: global.i18n.t('download_permission_blocked_title'),
    message: global.i18n.t('download_permission_blocked_message'),
    confirmButtonText: global.i18n.t('download_go_settings'),
    cancelButtonText: global.i18n.t('dialog_cancel'),
  })
  if (openSettings) {
    await Linking.openSettings()
  }
  throw new Error(global.i18n.t('download_permission_blocked_message'))
}

/**
 * 下载在线歌曲到本地目录，并返回最终文件路径。
 * Android：写入系统公共 Download/lxmusic（需存储权限）；iOS：应用沙盒。
 */
export const downloadMusicToLocal = async(musicInfo: LX.Music.MusicInfoOnline) => {
  await ensureAndroidStorageForPublicDownload()

  const downloadDir = await ensureMusicDownloadDirectory()
  toast(global.i18n.t('download_start', { name: musicInfo.name }))

  const url = await getMusicUrl({ musicInfo, isRefresh: false, quality: '128k' })
  const ext = parseExtByUrl(url)
  const baseName = createBaseFileName(musicInfo)
  let index = 0
  let savePath = ''
  while (true) {
    const suffix = index === 0 ? '' : ` (${index})`
    savePath = `${downloadDir}/${baseName}${suffix}.${ext}`.replace(/\/+/g, '/')
    // eslint-disable-next-line no-await-in-loop
    if (!(await existsMusicDownloadTarget(savePath))) break
    index++
  }

  const result = await downloadFile(url, savePath, { background: true }).promise
  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new Error(`download failed: ${result.statusCode}`)
  }

  if (Platform.OS === 'android') {
    await scanMusicDownloadFile(savePath)
  }

  return savePath
}
