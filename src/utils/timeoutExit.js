import { useEffect, useState } from 'react'
import BackgroundTimer from 'react-native-background-timer'
import { getStore } from '@/store'
import { STATUS } from '@/store/modules/player'
import { exitApp } from '@/utils/common'

const timeoutTools = {
  timeout: null,
  time: -1,
  timeHooks: [],
  exit() {
    const store = getStore()
    const state = store.getState()
    if (state.common.setting.player.timeoutExitPlayed && state.player.status == STATUS.playing) {
      global.isPlayedExit = true
      this.callHooks()
    } else {
      exitApp()
    }
  },
  callHooks() {
    for (const hook of this.timeHooks) {
      hook({
        time: this.time,
        isPlayedExit: global.isPlayedExit,
      })
    }
  },
  clearTimeout() {
    if (!this.timeout) return
    BackgroundTimer.clearInterval(this.timeout)
    this.timeout = null
    this.time = -1
    this.callHooks()
  },
  start(time) {
    this.clearTimeout()
    this.time = time
    this.timeout = BackgroundTimer.setInterval(() => {
      if (this.time > 0) {
        this.time--
        this.callHooks()
      } else {
        this.clearTimeout()
        this.exit()
      }
    }, 1000)
  },
  addTimeHook(hook) {
    this.timeHooks.push(hook)
    hook({
      time: this.time,
      isPlayedExit: global.isPlayedExit,
    })
  },
  removeTimeHook(hook) {
    this.timeHooks.splice(this.timeHooks.indexOf(hook), 1)
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

export const useTimeoutExitTimeInfo = () => {
  const [info, setInfo] = useState({ time: 0, isPlayedExit: false })
  useEffect(() => {
    const hook = ({ time, isPlayedExit }) => {
      setInfo({ time, isPlayedExit })
    }
    timeoutTools.addTimeHook(hook)
    return () => { timeoutTools.removeTimeHook(hook) }
  }, [setInfo])

  return info
}

export const cancelTimeoutExit = () => {
  global.isPlayedExit = false
  timeoutTools.callHooks()
}
