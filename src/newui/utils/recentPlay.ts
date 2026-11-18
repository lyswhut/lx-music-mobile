import AsyncStorage from '@react-native-async-storage/async-storage'

import { isOnlineMusic } from './song'

/**
 * 「最近播放」历史（新 UI 自有记录与存储，不碰播放核心）。
 *
 * 为什么需要它（2026-10-12 真机走查：播完一首歌，「我的」页最近播放仍空白）：
 * 播放核心里的 `playerState.playedList` 并不是收听历史，而是**随机播放去重池**——
 * 只有播放模式为 random 时才写入（src/core/player/player.ts:195/263、
 * src/core/init/player/player.ts:52），且换列表即清空（player.ts:279/293）、
 * 切模式也清空（init/player/player.ts:50），也从不落盘。
 * 非随机模式下它恒为空，界面不能靠它当「最近播放」。
 *
 * 做法：在既有事件 `global.state_event.playMusicInfoChanged`（切歌时核心必发，
 * src/store/player/action.ts:19-22）之上补一层新 UI 自己的订阅，
 * 记下「开始播放过的在线曲目」，本机 AsyncStorage 持久化，跨重启留存。
 */
const STORAGE_KEY = 'newui.recentPlays'

/** 历史留存上限（界面取前 30 条展示，多备一些防止近期一首歌反复播把别的挤掉） */
const MAX_RECORDS = 100

/** 落盘防抖间隔：连点几首歌时不必每次都写存储 */
const SAVE_DEBOUNCE_MS = 400

type Listener = () => void

let history: LX.Music.MusicInfoOnline[] = []
let loadPromise: Promise<void> | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let started = false
const listeners = new Set<Listener>()

const notify = () => {
  for (const listener of listeners) listener()
}

const persist = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch(() => {
      // 存储写失败不打断播放：历史记录本机内存里仍有效
    })
  }, SAVE_DEBOUNCE_MS)
}

/** 读回校验：只留形状完整且是在线曲目的条目（旧存档/异常数据直接丢弃） */
const sanitizeStored = (raw: string): LX.Music.MusicInfoOnline[] => {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is LX.Music.MusicInfoOnline =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as { id?: unknown }).id === 'string' &&
        isOnlineMusic(item as LX.Player.PlayMusic),
    )
  } catch {
    return []
  }
}

/** 只从存储读一次；读回后通知订阅者刷新 */
const load = (): Promise<void> => {
  if (loadPromise) return loadPromise
  loadPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      if (!raw) return
      const stored = sanitizeStored(raw)
      if (!stored.length) return
      // 读回期间可能已新记了歌（冷启动立刻切歌）：按 id 去重合并，新记录在前
      const fresh = history.filter(m => !stored.some(s => s.id === m.id))
      history = [...fresh, ...stored].slice(0, MAX_RECORDS)
      notify()
    })
    .catch(() => {
      // 读失败视为无历史：界面照常显示空态
    })
  return loadPromise
}

/** 事件签名里的 playMusicInfo（store/player/state 的 InitState['playMusicInfo']）只用到 musicInfo 一个字段 */
const handlePlayMusicInfoChanged = (playMusicInfo: { musicInfo: LX.Player.PlayMusic | null }) => {
  const musicInfo = playMusicInfo.musicInfo
  if (!musicInfo) return
  // 只记在线曲目：本地/下载条目各自的列表体系另有一套，且本页播放入口只收在线曲
  if (!isOnlineMusic(musicInfo)) return
  // 同一首反复播只留最近一次：刚记的就是它则不动（单曲循环切回原曲也走这里）
  if (history[0]?.id === musicInfo.id) return
  history = [musicInfo, ...history.filter(m => m.id !== musicInfo.id)].slice(0, MAX_RECORDS)
  persist()
  notify()
}

/** 启动记录（幂等）：主屏挂载时调一次，之后整个 App 生命周期内都在记 */
export const startNewUiRecentPlayRecorder = () => {
  if (started) return
  started = true
  void load()
  global.state_event.on('playMusicInfoChanged', handlePlayMusicInfoChanged)
}

/** 当前历史快照（引用稳定：只有记歌时才换新数组，供订阅者直读） */
export const getNewUiRecentPlays = (): LX.Music.MusicInfoOnline[] => history

/** 订阅历史变化（订阅即触发一次读盘，晚挂载的页面也能拿到全部历史） */
export const subscribeNewUiRecentPlays = (listener: Listener): (() => void) => {
  listeners.add(listener)
  void load()
  return () => {
    listeners.delete(listener)
  }
}

/** 清空历史（「我的」页「清空记录」入口）：内存与存储一起清 */
export const clearNewUiRecentPlays = () => {
  history = []
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
    // 清存储失败：下次冷启动最多又读回旧记录
  })
  notify()
}
