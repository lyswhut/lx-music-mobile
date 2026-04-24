import RNFS from 'react-native-fs'
import { FileSystem } from 'react-native-file-system'
import { getSaveDirectory, ensureDirectory } from './directory'
import { generateFileName } from './filename'
import { downloadEvent } from '@/event/downloadEvent'
import { addTask, updateTask, removeTask } from '@/store/download/action'
import { saveDownloadTasks, saveDownloadHistory, getDownloadTasks, getDownloadHistory } from '@/utils/data'
import settingState from '@/store/setting/state'
import { getMusicUrl as getOnlineMusicUrl } from '@/core/music/online'
import { getLyric as fetchOnlineLyric } from '@/core/music/online'
import musicSdk from '@/utils/musicSdk'
import { externalStorageDirectoryPath, writeFile, unlink, mkdir, readDir } from '@/utils/fs'
import { toast } from '@/utils/common'
import { writeLyric } from '@/utils/nativeModules/utils'

const MAX_CONCURRENT = 3
const MIN_REQUIRED_SPACE = 100 * 1024 * 1024 // 100MB

interface DownloadQueueItem {
  task: LX.Download.ListItem
  onProgress: (progress: LX.Download.ProgressInfo) => void
  onComplete: (taskId: string, fileSize: number) => void
  onError: (taskId: string, error: string) => void
}

let activeCount = 0
let queue: DownloadQueueItem[] = []

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond > 1024 * 1024) {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  }
  return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
}

const parseErrorMessage = (err: any): string => {
  const message = err?.message ?? err?.toString() ?? 'unknown_error'
  if (message.includes('ECONNABORTED')) return '请求超时'
  if (message.includes('ENOTFOUND')) return '无法连接到服务器'
  if (message.includes('ECONNRESET') || message.includes('ETIMEDOUT')) return '网络连接失败'
  if (message.includes('ENOENT')) return '文件路径不存在'
  if (message.includes('EACCES')) return '没有写入权限'
  return message
}

const processNextInQueue = () => {
  if (queue.length === 0 || activeCount >= MAX_CONCURRENT) return

  const next = queue.shift()!
  activeCount++

  updateTask(next.task.id, { status: 'run' })

  const downloadOptions: RNFS.DownloadFileOptions = {
    fromUrl: next.task.metadata.url ?? '',
    toFile: next.task.metadata.filePath,
    background: true,
    discretionary: false,
    progressInterval: 500,
    begin: (res) => {
      console.log('[Download] begin:', res.jobId)
    },
    progress: (res) => {
      const progress = res.contentLength > 0 ? res.bytesWritten / res.contentLength : 0
      const speed = res.bytesWrittenPerSecond ?? 0
      next.onProgress({
        progress,
        speed: formatSpeed(speed),
        downloaded: res.bytesWritten,
        total: res.contentLength,
      })
    },
  }

  RNFS.downloadFile(downloadOptions).promise
    .then((res) => {
      activeCount--
      if (res.statusCode === 200 || res.statusCode === 206) {
        next.onComplete(next.task.id, res.bytesWritten)
      } else {
        next.onError(next.task.id, `HTTP ${res.statusCode}: ${res.description ?? ''}`)
      }
    })
    .catch((err) => {
      activeCount--
      next.onError(next.task.id, parseErrorMessage(err))
    })
    .finally(() => {
      processNextInQueue()
    })
}

export const enqueueDownload = (
  task: LX.Download.ListItem,
  onProgress: (progress: LX.Download.ProgressInfo) => void,
  onComplete: (taskId: string, fileSize: number) => void,
  onError: (taskId: string, error: string) => void,
): void => {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++
    updateTask(task.id, { status: 'run' })

    const downloadOptions: RNFS.DownloadFileOptions = {
      fromUrl: task.metadata.url ?? '',
      toFile: task.metadata.filePath,
      background: true,
      discretionary: false,
      progressInterval: 500,
      begin: (res) => {
        console.log('[Download] begin:', res.jobId)
      },
      progress: (res) => {
        const progress = res.contentLength > 0 ? res.bytesWritten / res.contentLength : 0
        const speed = res.bytesWrittenPerSecond ?? 0
        onProgress({
          progress,
          speed: formatSpeed(speed),
          downloaded: res.bytesWritten,
          total: res.contentLength,
        })
      },
    }

    RNFS.downloadFile(downloadOptions).promise
      .then((res) => {
        activeCount--
        if (res.statusCode === 200 || res.statusCode === 206) {
          onComplete(task.id, res.bytesWritten)
        } else {
          onError(task.id, `HTTP ${res.statusCode}: ${res.description ?? ''}`)
        }
      })
      .catch((err) => {
        activeCount--
        onError(task.id, parseErrorMessage(err))
      })
      .finally(() => {
        processNextInQueue()
      })
  } else {
    updateTask(task.id, { status: 'waiting' })
    queue.push({ task, onProgress, onComplete, onError })
  }
}

export const stopDownload = (taskId: string): void => {
  RNFS.stopDownload(taskId)
}

export const getAvailableStorage = async(): Promise<number> => {
  try {
    const fsInfo = await FileSystem.getFSInfo()
    return fsInfo.freeSpace
  } catch {
    return 0
  }
}

export const checkStorageSpace = async(requiredSize?: number): Promise<boolean> => {
  const available = await getAvailableStorage()
  return available > (requiredSize ?? MIN_REQUIRED_SPACE)
}

export const saveLyricFile = async(lyricInfo: LX.Music.LyricInfo, filePath: string): Promise<void> => {
  const lyricType = settingState.setting['download.lyricType']
  const lyric = lyricInfo.lyric

  if (!lyric) return

  if (lyricType === 'embed') {
    try {
      await writeLyric(filePath, lyric)
    } catch (err) {
      console.warn('[Download] Failed to embed lyric:', err)
    }
  } else {
    const lrcPath = filePath.replace(/\.\w+$/, '.lrc')
    await writeFile(lrcPath, lyric, 'utf8')
  }
}
