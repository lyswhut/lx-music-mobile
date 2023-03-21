import { useEffect, useState } from 'react'
import BackgroundTimer from 'react-native-background-timer'
import { exitApp } from '@/core/common'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'

type Hook = (time: number, isPlayedStop: boolean) => void

const timeoutTools = {
  bgTimeout: null as number | null,
  timeout: null as NodeJS.Timer | null,
  startTime: 0,
  time: -1,
  timeHooks: [] as Hook[],
  exit() {
    if (settingState.setting['player.timeoutExitPlayed'] && playerState.isPlay) {
      global.lx.isPlayedStop = true
      this.callHooks()
    } else {
      exitApp()
    }
  },
  getTime() {
    return Math.max(this.time - Math.round((performance.now() - this.startTime) / 1000), -1)
  },
  callHooks() {
    const time = this.getTime()
    for (const hook of this.timeHooks) {
      hook(time, global.lx.isPlayedStop)
    }
  },
  clearTimeout() {
    if (!this.bgTimeout) return
    BackgroundTimer.clearTimeout(this.bgTimeout)
    clearInterval(this.timeout as NodeJS.Timer)
    this.bgTimeout = null
    this.timeout = null
    this.time = -1
    this.callHooks()
  },
  start(time: number) {
    this.clearTimeout()
    this.time = time
    this.startTime = performance.now()
    this.bgTimeout = BackgroundTimer.setTimeout(() => {
      this.clearTimeout()
      this.exit()
    }, time * 1000)
    this.timeout = setInterval(() => {
      this.callHooks()
    }, 1000)
  },
  addTimeHook(hook: Hook) {
    this.timeHooks.push(hook)
    hook(this.getTime(), global.lx.isPlayedStop)
  },
  removeTimeHook(hook: Hook) {
    this.timeHooks.splice(this.timeHooks.indexOf(hook), 1)
  },
}


export const startTimeoutExit = (time: number) => {
  timeoutTools.start(time)
}
export const stopTimeoutExit = () => {
  timeoutTools.clearTimeout()
}

export const getTimeoutExitTime = () => {
  return timeoutTools.time
}

export const useTimeoutExitTimeInfo = () => {
  const [info, setInfo] = useState({ time: 0, isPlayedStop: false })
  useEffect(() => {
    const hook: Hook = (time, isPlayedStop) => {
      setInfo({ time, isPlayedStop })
    }
    timeoutTools.addTimeHook(hook)
    return () => { timeoutTools.removeTimeHook(hook) }
  }, [setInfo])

  return info
}

export const onTimeUpdate = (handler: Hook) => {
  timeoutTools.addTimeHook(handler)

  return () => {
    timeoutTools.removeTimeHook(handler)
  }
}


export const cancelTimeoutExit = () => {
  global.lx.isPlayedStop = false
  timeoutTools.callHooks()
}
