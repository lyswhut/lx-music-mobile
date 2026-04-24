import { useEffect, useState } from 'react'
import { state, type InitState } from './state'
import { downloadEvent } from '@/event/downloadEvent'

export const useDownloadTasks = (): LX.Download.ListItem[] => {
  const [tasks, setTasks] = useState(state.tasks)

  useEffect(() => {
    const handler = () => {
      setTasks([...state.tasks])
    }
    downloadEvent.on('downloadListUpdate', handler)
    return () => {
      downloadEvent.off('downloadListUpdate', handler)
    }
  }, [])

  return tasks
}

export const useDownloadHistory = (): LX.Download.DownloadHistoryItem[] => {
  const [history, setHistory] = useState(state.history)

  useEffect(() => {
    const handler = () => {
      setHistory([...state.history])
    }
    downloadEvent.on('downloadHistoryUpdate', handler)
    return () => {
      downloadEvent.off('downloadHistoryUpdate', handler)
    }
  }, [])

  return history
}

export const useDownloadTaskStatus = (taskId: string): LX.Download.DownloadTaskStatus | null => {
  const [status, setStatus] = useState<LX.Download.DownloadTaskStatus | null>(null)

  useEffect(() => {
    const handler = () => {
      const task = state.tasks.find(t => t.id === taskId)
      setStatus(task ? task.status : null)
    }
    handler()
    downloadEvent.on('downloadListUpdate', handler)
    return () => {
      downloadEvent.off('downloadListUpdate', handler)
    }
  }, [taskId])

  return status
}

export const useIsInitialized = (): boolean => {
  const [isInitialized, setIsInitialized] = useState(state.isInitialized)

  useEffect(() => {
    const handler = () => {
      setIsInitialized(state.isInitialized)
    }
    downloadEvent.on('downloadListUpdate', handler)
    return () => {
      downloadEvent.off('downloadListUpdate', handler)
    }
  }, [])

  return isInitialized
}
