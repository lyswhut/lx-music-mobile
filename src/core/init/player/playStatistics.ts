import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import playerState from '@/store/player/state'
import { dateFormat } from '@/utils/common'
import {
  type StatisticsStore,
  type DeviceStatistics,
  type StatisticsData,
  LOCAL_DEVICE_KEY,
  createEmptyStore,
  createEmptyDevice,
  migrate,
  mergeStore,
  rekeyDevice,
  aggregate,
  stableStringify,
} from './statisticsMerge'

export type { StatisticsData, StatisticsStore } from './statisticsMerge'

const STORAGE_KEY = storageDataPrefix.listeningStatistics
const PLATFORM = 'lx_music_mobile'

// 分桶存储（持久化/同步用）。本地累加只写 devices[currentDeviceKey]。
let store: StatisticsStore = createEmptyStore()
// 配置同步前为 LOCAL_DEVICE_KEY；首次同步拿到 clientId 后 rekey 成 clientId。
let currentDeviceKey = LOCAL_DEVICE_KEY

let sessionStartTime: number | null = null
// 当前计时会话对应的音源，结算时按它归属，避免切歌后把上一首时长记到新歌的音源
let sessionSource: string | undefined
let periodicTimer: NodeJS.Timeout | null = null
let isSaving = false
let pendingSave = false

// 同步推送：本地累加变更后通知同步层（节流，避免心跳每 10s 都推服务器）
const SYNC_PUSH_THROTTLE = 60000
let syncPushListeners: Array<() => void> = []
let lastSyncPush = 0
let syncPushTimer: NodeJS.Timeout | null = null
const notifySyncPush = () => {
  lastSyncPush = Date.now()
  for (const listener of syncPushListeners) listener()
}
const scheduleSyncPush = (immediate = false) => {
  if (!syncPushListeners.length) return
  if (immediate) {
    if (syncPushTimer) { clearTimeout(syncPushTimer); syncPushTimer = null }
    notifySyncPush()
    return
  }
  if (syncPushTimer) return
  const waitTime = Math.max(0, SYNC_PUSH_THROTTLE - (Date.now() - lastSyncPush))
  syncPushTimer = setTimeout(() => {
    syncPushTimer = null
    notifySyncPush()
  }, waitTime)
}

/** 同步层订阅本地统计变更，返回取消订阅函数 */
export const subscribeStatisticsSync = (listener: () => void) => {
  syncPushListeners.push(listener)
  return () => {
    syncPushListeners = syncPushListeners.filter(l => l != listener)
  }
}

// 在线歌曲 source 在顶层，下载列表项在 metadata.musicInfo 下
const getCurrentSource = () => {
  const playMusic = playerState.playMusicInfo.musicInfo
  return playMusic
    ? 'source' in playMusic ? playMusic.source : playMusic.metadata.musicInfo.source
    : undefined
}

const getCurrentBucket = (): DeviceStatistics => {
  let bucket = store.devices[currentDeviceKey]
  if (!bucket) bucket = store.devices[currentDeviceKey] = createEmptyDevice(dateFormat(Date.now(), 'Y-M-D'), PLATFORM)
  return bucket
}

const emitUpdated = () => {
  global.state_event.statisticsUpdated(aggregate(store))
}

const saveStats = async() => {
  if (isSaving) {
    pendingSave = true
    return
  }
  isSaving = true
  pendingSave = false
  try {
    await saveData(STORAGE_KEY, store)
  } catch (err) {
    console.error('Failed to save listening stats:', err)
  } finally {
    // 单线程下 isSaving 是有意的重入锁，finally 中解锁安全
    // eslint-disable-next-line require-atomic-updates
    isSaving = false
    if (pendingSave) {
      void saveStats()
    }
  }
}

const accumulate = (isStillPlaying: boolean) => {
  if (sessionStartTime == null) return
  const now = Date.now()
  let elapsed = Math.floor((now - sessionStartTime) / 1000)

  if (elapsed <= 0) {
    // 处理用户往回调整系统时钟的情况
    sessionStartTime = isStillPlaying ? now : null
    return
  }

  // 边际限制与防刷策略：
  // 1. 定期累加心跳限幅（上限限制为30秒）
  if (isStillPlaying && elapsed > 30) {
    elapsed = 10 // 重置为心跳周期
  }

  // 2. 切歌/暂停等累计限幅（上限不能超过单首歌曲时长 + 30秒，未获取到时长则默认限幅3600秒）
  const maxPlayTime = playerState.progress.maxPlayTime || 3600
  if (elapsed > maxPlayTime + 30) {
    elapsed = Math.floor(maxPlayTime)
  }

  if (elapsed > 0) {
    const todayStr = dateFormat(Date.now(), 'Y-M-D')
    const bucket = getCurrentBucket()
    bucket.totalDuration += elapsed
    bucket.dailyStats[todayStr] = (bucket.dailyStats[todayStr] || 0) + elapsed
    if (sessionSource) bucket.sourceStats[sessionSource] = (bucket.sourceStats[sessionSource] || 0) + elapsed
    void saveStats()
    emitUpdated()
    // 播放中心跳节流推送；暂停/停止（!isStillPlaying）时立即推送以尽快落到服务端
    scheduleSyncPush(!isStillPlaying)
  }

  sessionStartTime = isStillPlaying ? now : null
}

const startPeriodicTimer = () => {
  stopPeriodicTimer()
  periodicTimer = setInterval(() => {
    accumulate(true)
  }, 10000)
}

const stopPeriodicTimer = () => {
  if (periodicTimer) {
    clearInterval(periodicTimer)
    periodicTimer = null
  }
}

const handlePlay = () => {
  sessionStartTime = Date.now()
  sessionSource = getCurrentSource()
  startPeriodicTimer()
}

const handlePause = () => {
  accumulate(false)
  stopPeriodicTimer()
}

const handleMusicToggled = () => {
  // 先用上一首的 sessionSource 结算，再切换到新歌的音源
  if (sessionStartTime != null) {
    accumulate(playerState.isPlay)
  }
  if (playerState.isPlay) {
    sessionStartTime = Date.now()
    sessionSource = getCurrentSource()
    startPeriodicTimer()
  } else {
    stopPeriodicTimer()
  }
}

/** UI 用：跨设备聚合后的扁平统计 */
export const getStatistics = (): StatisticsData => aggregate(store)

/** 同步用：完整分桶数据 */
export const getStatisticsStore = (): StatisticsStore => store

/** 同步用：规范化序列化（跨端一致，供 MD5） */
export const getStatisticsSnapshot = (): string => stableStringify(store)

/** 同步用：合并远程分桶数据（幂等），落盘并通知 UI */
export const mergeRemoteStatistics = async(remote: StatisticsStore | null) => {
  if (!remote) return
  store = mergeStore(store, remote)
  await saveStats()
  emitUpdated()
}

/**
 * 首次成功同步、拿到服务端 clientId 时调用：
 * 把本地累加的 local 桶并入 clientId 桶，之后只写 clientId 桶。
 */
export const setStatisticsDeviceKey = async(clientId: string, deviceName?: string) => {
  if (!clientId || currentDeviceKey == clientId) {
    if (deviceName) {
      const bucket = getCurrentBucket()
      bucket.deviceName = deviceName
      bucket.platform = PLATFORM
      await saveStats()
    }
    return
  }
  store = rekeyDevice(store, currentDeviceKey, clientId)
  currentDeviceKey = clientId
  const bucket = getCurrentBucket()
  bucket.platform = PLATFORM
  if (deviceName) bucket.deviceName = deviceName
  await saveStats()
  emitUpdated()
}

export default () => {
  // 加载初始统计数据（含 v1 扁平 -> v2 分桶迁移）
  void getData<unknown>(STORAGE_KEY).then(raw => {
    store = migrate(raw, currentDeviceKey, { platform: PLATFORM })

    const today = dateFormat(Date.now(), 'Y-M-D')
    const hadBucket = !!store.devices[currentDeviceKey]
    const bucket = getCurrentBucket()
    const needInitFirstUse = !bucket.firstUseDate
    if (needInitFirstUse) bucket.firstUseDate = today

    // 迁移过、首次初始化、或本设备桶新建 -> 立即落盘
    const isV2 = !!raw && (raw as { version?: number }).version == 2
    if (!isV2 || needInitFirstUse || !hadBucket) void saveStats()
    emitUpdated()
  })

  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handlePause)
  global.app_event.on('error', handlePause)
  global.app_event.on('musicToggled', handleMusicToggled)
}
