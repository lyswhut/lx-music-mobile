import { downloadEvent } from '@/event/downloadEvent'
import { state } from './state'

export const setTasks = (tasks: LX.Download.ListItem[]): void => {
  state.tasks = tasks
  downloadEvent.downloadListUpdate()
}

export const setHistory = (history: LX.Download.DownloadHistoryItem[]): void => {
  state.history = history
  downloadEvent.downloadHistoryUpdate()
}

export const addTask = (task: LX.Download.ListItem): void => {
  state.tasks.push(task)
  downloadEvent.downloadListUpdate()
}

export const updateTask = (taskId: string, updates: Partial<LX.Download.ListItem>): void => {
  const index = state.tasks.findIndex(t => t.id === taskId)
  if (index > -1) {
    Object.assign(state.tasks[index], updates)
    downloadEvent.downloadListUpdate()
  }
}

export const removeTask = (taskId: string): void => {
  state.tasks = state.tasks.filter(t => t.id !== taskId)
  downloadEvent.downloadListUpdate()
}

export const addHistory = (item: LX.Download.DownloadHistoryItem): void => {
  state.history.push(item)
  downloadEvent.downloadHistoryUpdate()
}

export const removeHistory = (ids: string[]): void => {
  state.history = state.history.filter(h => !ids.includes(h.id))
  downloadEvent.downloadHistoryUpdate()
}

export const clearHistory = (): void => {
  state.history = []
  downloadEvent.downloadHistoryUpdate()
}

export const setInitialized = (isInitialized: boolean): void => {
  state.isInitialized = isInitialized
  downloadEvent.downloadListUpdate()
}
