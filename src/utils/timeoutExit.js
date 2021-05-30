import { useEffect, useState } from 'react'
import BackgroundTimer from 'react-native-background-timer'
import { getStore } from '@/store'
import { action as playerAction, STATUS } from '@/store/modules/player'
import { exitApp } from '@/utils/tools'

const isStop = status => {
  switch (status) {
    case STATUS.pause:
    case STATUS.stop:
      return true
    default: return false
  }
}

const timeoutTools = {
  timeout: null,
  time: -1,
  timeHooks: [],
  exit() {
    const store = getStore()
    const state = store.getState()
    if (state.common.setting.player.timeoutExitPlayed && !isStop(state.player.status)) {
      global.isPlayedExit = true
    } else {
      store.dispatch(playerAction.destroy()).finally(() => {
        exitApp()
      })
    }
  },
  clearTimeout() {
    if (!this.timeout) return
    BackgroundTimer.clearInterval(this.timeout)
    this.timeout = null
    this.time = -1
    for (const hook of this.timeHooks) hook(this.time)
  },
  start(time) {
    this.clearTimeout()
    this.time = time
    this.timeout = BackgroundTimer.setInterval(() => {
      if (this.time > 0) {
        this.time--
        for (const hook of this.timeHooks) hook(this.time)
      } else {
        this.clearTimeout()
        this.exit()
      }
    }, 1000)
  },
  addTimeHook(callback) {
    this.timeHooks.push(callback)
    callback(this.time)
  },
  removeTimeHook(callback) {
    this.timeHooks.splice(this.timeHooks.indexOf(callback), 1)
  },
}


export const startTimeoutExit = time => {
  timeoutTools.start(time)
}
export const stopTimeoutExit = () => {
  timeoutTools.clearTimeout()
}

export const getTimeoutExitTime = () => {
  return timeoutTools.time
}

export const useTimeoutExitTime = () => {
  const [time, setTime] = useState(0)
  useEffect(() => {
    const callback = time => {
      setTime(time)
    }
    timeoutTools.addTimeHook(callback)
    return () => { timeoutTools.removeTimeHook(callback) }
  }, [setTime])

  return time
}

