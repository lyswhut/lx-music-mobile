import { addTask, updateTask, removeTask, addHistory, setInitialized, setTasks, setHistory, clearHistory } from '@/store/download/action'
import { saveDownloadTasks, saveDownloadHistory, getDownloadTasks, getDownloadHistory, setDownloadSavePath } from '@/utils/data'
import { downloadEvent } from '@/event/downloadEvent'
import { generateFileName } from './filename'
import { getSaveDirectory, ensureDirectory } from './directory'
import { enqueueDownload, saveLyricFile, stopDownload } from './engine'
import { getMusicUrl as getOnlineMusicUrl } from '@/core/music/online'
import { getLyricInfo as fetchOnlineLyricInfo } from '@/core/music/online'
import { externalStorageDirectoryPath, unlink } from '@/utils/fs'
import { toast } from '@/utils/tools'
import { log } from '@/utils/log'
import settingState from '@/store/setting/state'
import { downloadState } from '@/store/download'

let isInited = false

const init = async(): Promise<void> => {
  if (isInited) return

  log.info('[download init] Starting init...')
  try {
    const tasks = await getDownloadTasks()
    const history = await getDownloadHistory()

    log.info('[download init] Loaded tasks:', tasks.length, 'history:', history.length)

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
    log.info('[download init] Init complete. State tasks:', downloadState.tasks.length, 'history:', downloadState.history.length)
  } catch (err) {
    log.error('[download init] Init failed:', err)
  }
}

const isMusicInList = (musicInfo: LX.Music.MusicInfoOnline): boolean => {
  const result = downloadState.tasks.some(t => t.metadata.musicInfo.id === musicInfo.id)
    || downloadState.history.some(h => h.musicInfo.id === musicInfo.id)
  log.info('[isMusicInList]', musicInfo.name, 'inList:', result, 'tasks:', downloadState.tasks.length, 'history:', downloadState.history.length)
  return result
}

const addTaskWithDownload = async(musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality): Promise<boolean> => {
  log.info('[addTaskWithDownload] START - musicInfo:', musicInfo.name, 'id:', musicInfo.id, 'quality:', quality)
  log.info('[addTaskWithDownload] isInitialized:', downloadState.isInitialized)
  log.info('[addTaskWithDownload] current tasks:', downloadState.tasks.length, 'history:', downloadState.history.length)

  if (isMusicInList(musicInfo)) {
    log.info('[addTaskWithDownload] Music already in list, showing tip')
    toast(global.i18n.t('download_exists_tip'))
    return false
  }

  let downloadQuality: LX.Quality = '128k'
  try {
    if (settingState && settingState.setting['download.quality']) {
      downloadQuality = settingState.setting['download.quality'] as LX.Quality
    }
    if (quality) {
      downloadQuality = quality
    }
  } catch (err: any) {
    log.warn('[addTaskWithDownload] Failed to get quality from setting, using default 128k')
  }
  log.info('[addTaskWithDownload] setting quality:', downloadQuality)

  try {
    log.info('[addTaskWithDownload] Getting save directory...')
    const saveDir = await getSaveDirectory()
    log.info('[addTaskWithDownload] saveDir:', saveDir)

    const ext = downloadQuality === 'flac' || downloadQuality === 'flac24bit' ? 'flac' : 'mp3'
    const fileName = generateFileName(musicInfo, downloadQuality, ext)
    const filePath = `${saveDir}/${fileName}`

    const taskId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const task: LX.Download.ListItem = {
      id: taskId,
      isComplate: false,
      status: 'waiting',
      statusText: global.i18n.t('download_waiting_for_url'),
      downloaded: 0,
      total: 0,
      progress: 0,
      speed: '',
      metadata: {
        musicInfo,
        url: null,
        quality: downloadQuality,
        ext: ext as LX.Download.FileExt,
        fileName,
        filePath,
      },
    }

    log.info('[addTaskWithDownload] Task created:', task.id)
    log.info('[addTaskWithDownload] Calling addTask(action)...')
    addTask(task)
    log.info('[addTaskWithDownload] After addTask - state.tasks.length:', downloadState.tasks.length)

    await saveDownloadTasks([...downloadState.tasks])
    log.info('[addTaskWithDownload] Saved tasks to storage')

    downloadEvent.downloadListUpdate()
    log.info('[addTaskWithDownload] Emitted downloadListUpdate event')

    toast(global.i18n.t('download_add_tip'))
    log.info('[addTaskWithDownload] Toast shown')

    void (async() => {
      try {
        await ensureDirectory(saveDir)

        const url = await getOnlineMusicUrl({
          musicInfo,
          quality: downloadQuality,
          isRefresh: false,
        })

        if (!url) {
          updateTask(taskId, {
            status: 'error',
            statusText: global.i18n.t('download_url_failed'),
          })
          await saveDownloadTasks([...downloadState.tasks])
          downloadEvent.downloadListUpdate()
          toast(global.i18n.t('download_url_failed'))
          return
        }

        updateTask(taskId, {
          status: 'run',
          statusText: '',
          metadata: { ...task.metadata, url },
        })
        await saveDownloadTasks([...downloadState.tasks])
        downloadEvent.downloadListUpdate()

        const updatedTask = downloadState.tasks.find(t => t.id === taskId)
        if (!updatedTask) return

        enqueueDownload(
          updatedTask,
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
              const lyricInfo = await fetchOnlineLyricInfo({
                musicInfo,
                isRefresh: false,
              })
              log.info('[Download] Lyric info received, lyric length:', lyricInfo.lyric?.length, 'has tlyric:', !!lyricInfo.tlyric)
              const completedTask = downloadState.tasks.find(t => t.id === taskId)
              if (completedTask) {
                await saveLyricFile(lyricInfo, completedTask.metadata.filePath)
                log.info('[Download] Lyric file saved successfully')
              }
            } catch (err) {
              log.warn('[Download] Failed to save lyric:', err)
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
            downloadEvent.downloadHistoryUpdate()
          },
          async(taskId, error) => {
            updateTask(taskId, {
              status: 'error',
              statusText: error,
            })
            await saveDownloadTasks([...downloadState.tasks])
            downloadEvent.downloadListUpdate()
            toast(global.i18n.t('download_failed') + ': ' + error)
          },
        )
      } catch (err: any) {
        log.error('[Download] Failed to add task:', String(err))
        updateTask(taskId, {
          status: 'error',
          statusText: err.message || global.i18n.t('download_failed'),
        })
        await saveDownloadTasks([...downloadState.tasks])
        downloadEvent.downloadListUpdate()
        toast(global.i18n.t('download_failed'))
      }
    })()

    return true
  } catch (err: any) {
    log.error('[addTaskWithDownload] ERROR:', String(err))
    toast(global.i18n.t('download_failed') + ': ' + (err.message || 'unknown'))
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
