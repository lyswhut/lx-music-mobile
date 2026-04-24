import { v4 as uuidv4 } from 'uuid'
import { addTask, updateTask, removeTask, addHistory, setInitialized, setTasks, setHistory, clearHistory } from '@/store/download/action'
import { saveDownloadTasks, saveDownloadHistory, getDownloadTasks, getDownloadHistory, setDownloadSavePath } from '@/utils/data'
import { downloadEvent } from '@/event/downloadEvent'
import { generateFileName } from './filename'
import { getSaveDirectory, ensureDirectory } from './directory'
import { enqueueDownload, checkStorageSpace, saveLyricFile, stopDownload } from './engine'
import { getMusicUrl as getOnlineMusicUrl } from '@/core/music/online'
import { getLyric as fetchOnlineLyric } from '@/core/music/online'
import { externalStorageDirectoryPath, unlink } from '@/utils/fs'
import { toast } from '@/utils/common'
import { useI18n } from '@/lang/i18n'
import settingState from '@/store/setting/state'
import { downloadState } from '@/store/download/state'

let isInited = false

const init = async(): Promise<void> => {
  if (isInited) return

  const tasks = await getDownloadTasks()
  const history = await getDownloadHistory()

  const completedTasks: LX.Download.ListItem[] = []
  const failedTasks: LX.Download.DownloadHistoryItem[] = []

  for (const task of tasks) {
    if (task.status === 'completed') {
      completedTasks.push(task)
    } else {
      failedTasks.push({
        id: task.id,
        musicInfo: task.metadata.musicInfo,
        quality: task.metadata.quality,
        ext: task.metadata.ext,
        fileName: task.metadata.fileName,
        filePath: task.metadata.filePath,
        status: 'failed',
        downloadedSize: task.downloaded,
        fileSize: task.total,
        addedTime: Date.now(),
        completedTime: null,
        errorMessage: task.statusText || '下载中断',
      })
    }
  }

  setTasks([])
  setHistory([...history, ...completedTasks.map(t => ({
    id: t.id,
    musicInfo: t.metadata.musicInfo,
    quality: t.metadata.quality,
    ext: t.metadata.ext,
    fileName: t.metadata.fileName,
    filePath: t.metadata.filePath,
    status: 'completed' as const,
    downloadedSize: t.downloaded,
    fileSize: t.total,
    addedTime: Date.now(),
    completedTime: Date.now(),
    errorMessage: null,
  })), ...failedTasks])

  await saveDownloadTasks([])
  await saveDownloadHistory([...history, ...completedTasks.map(t => ({
    id: t.id,
    musicInfo: t.metadata.musicInfo,
    quality: t.metadata.quality,
    ext: t.metadata.ext,
    fileName: t.metadata.fileName,
    filePath: t.metadata.filePath,
    status: 'completed' as const,
    downloadedSize: t.downloaded,
    fileSize: t.total,
    addedTime: Date.now(),
    completedTime: Date.now(),
    errorMessage: null,
  })), ...failedTasks])

  setInitialized(true)
  isInited = true
}

const isMusicInList = (musicInfo: LX.Music.MusicInfoOnline): boolean => {
  return downloadState.tasks.some(t => t.metadata.musicInfo.id === musicInfo.id)
    || downloadState.history.some(h => h.musicInfo.id === musicInfo.id)
}

const addTaskWithDownload = async(musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality): Promise<boolean> => {
  if (isMusicInList(musicInfo)) {
    toast('download_exists_tip')
    return false
  }

  const downloadQuality = quality || settingState.setting['download.quality']
  const saveDir = await getSaveDirectory()

  const hasSpace = await checkStorageSpace()
  if (!hasSpace) {
    toast('download_storage_insufficient')
    return false
  }

  try {
    const urlResult = await getOnlineMusicUrl(musicInfo, downloadQuality)
    const url = urlResult.url

    if (!url) {
      toast('download_url_failed')
      return false
    }

    const ext = downloadQuality === 'flac' || downloadQuality === 'flac24bit' ? 'flac' : 'mp3'
    const fileName = generateFileName(musicInfo, downloadQuality, ext)
    const filePath = `${saveDir}/${fileName}`

    await ensureDirectory(saveDir)

    const taskId = uuidv4()
    const task: LX.Download.ListItem = {
      id: taskId,
      isComplate: false,
      status: 'run',
      statusText: '',
      downloaded: 0,
      total: 0,
      progress: 0,
      speed: '',
      metadata: {
        musicInfo,
        url,
        quality: downloadQuality,
        ext: ext as LX.Download.FileExt,
        fileName,
        filePath,
      },
    }

    addTask(task)
    await saveDownloadTasks([...downloadState.tasks])

    enqueueDownload(
      task,
      (progress) => {
        updateTask(taskId, {
          progress: progress.progress,
          speed: progress.speed,
          downloaded: progress.downloaded,
          total: progress.total,
          statusText: `Downloading... ${(progress.progress * 100).toFixed(1)}%`,
        })
      },
      async(taskId, fileSize) => {
        updateTask(taskId, {
          isComplate: true,
          status: 'completed',
          statusText: 'Completed',
          total: fileSize,
        })

        try {
          const lyricInfo = await fetchOnlineLyric(musicInfo)
          const completedTask = downloadState.tasks.find(t => t.id === taskId)
          if (completedTask) {
            await saveLyricFile(lyricInfo, completedTask.metadata.filePath)
          }
        } catch (err) {
          console.warn('[Download] Failed to save lyric:', err)
        }

        const completedTask = downloadState.tasks.find(t => t.id === taskId)
        if (completedTask) {
          const historyItem: LX.Download.DownloadHistoryItem = {
            id: completedTask.id,
            musicInfo: completedTask.metadata.musicInfo,
            quality: completedTask.metadata.quality,
            ext: completedTask.metadata.ext,
            fileName: completedTask.metadata.fileName,
            filePath: completedTask.metadata.filePath,
            status: 'completed',
            downloadedSize: completedTask.downloaded,
            fileSize: completedTask.total,
            addedTime: Date.now(),
            completedTime: Date.now(),
            errorMessage: null,
          }

          addHistory(historyItem)
          removeTask(taskId)

          await saveDownloadTasks(downloadState.tasks.filter(t => t.id !== taskId))
          await saveDownloadHistory([...downloadState.history])
        }

        downloadEvent.downloadListUpdate()
      },
      async(taskId, error) => {
        updateTask(taskId, {
          status: 'error',
          statusText: error,
        })
        await saveDownloadTasks([...downloadState.tasks])
        downloadEvent.downloadListUpdate()
      },
    )

    toast('download_add_tip')
    downloadEvent.downloadListUpdate()
    return true
  } catch (err: any) {
    console.error('[Download] Failed to add task:', err)
    toast('download_failed')
    return false
  }
}

const deleteTask = async(taskId: string): Promise<void> => {
  const task = downloadState.tasks.find(t => t.id === taskId)
  if (task) {
    if (task.status === 'run') {
      stopDownload(taskId)
    }
    removeTask(taskId)
    await saveDownloadTasks([...downloadState.tasks])
    downloadEvent.downloadListUpdate()
    return
  }

  const historyItem = downloadState.history.find(h => h.id === taskId)
  if (historyItem && historyItem.filePath) {
    try {
      await unlink(historyItem.filePath)
    } catch {
      // File may not exist
    }
  }
  if (historyItem) {
    const newHistory = downloadState.history.filter(h => h.id !== taskId)
    setHistory(newHistory)
    await saveDownloadHistory(newHistory)
    downloadEvent.downloadHistoryUpdate()
  }
}

const retryTask = async(taskId: string): Promise<boolean> => {
  const historyItem = downloadState.history.find(h => h.id === taskId)
  if (!historyItem) return false

  const newHistory = downloadState.history.filter(h => h.id !== taskId)
  setHistory(newHistory)
  await saveDownloadHistory(newHistory)

  return addTaskWithDownload(historyItem.musicInfo, historyItem.quality)
}

const clearAllHistory = async(): Promise<void> => {
  setHistory([])
  await saveDownloadHistory([])
  downloadEvent.downloadHistoryUpdate()
}

const getTasks = (): LX.Download.ListItem[] => {
  return [...downloadState.tasks]
}

const getHistory = (): LX.Download.DownloadHistoryItem[] => {
  return [...downloadState.history]
}

const getDownloadingCount = (): number => {
  return downloadState.tasks.filter(t => t.status === 'run').length
}

export const downloadManager = {
  init,
  addTask: addTaskWithDownload,
  isMusicInList,
  deleteTask,
  retryTask,
  clearHistory: clearAllHistory,
  getTasks,
  getHistory,
  getDownloadingCount,
}
