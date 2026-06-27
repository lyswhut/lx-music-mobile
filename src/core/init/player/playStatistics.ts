import { getData, saveData } from '@/plugins/storage'
import playerState from '@/store/player/state'
import { dateFormat } from '@/utils/common'

export interface StatisticsData {
  totalDuration: number
  dailyStats: Record<string, number>
  /** 首次使用日期 Y-M-D，用于计算乐龄 */
  firstUseDate: string
  /** 各音源累计听歌时长（秒），key 为音源码 kg/tx/wy/mg/kw/bd */
  sourceStats: Record<string, number>
}

let stats: StatisticsData = {
  totalDuration: 0,
  dailyStats: {},
  firstUseDate: '',
  sourceStats: {},
}

let sessionStartTime: number | null = null
// 当前计时会话对应的音源，结算时按它归属，避免切歌后把上一首时长记到新歌的音源
let sessionSource: string | undefined
let periodicTimer: NodeJS.Timeout | null = null
let isSaving = false
let pendingSave = false

// 在线歌曲 source 在顶层，下载列表项在 metadata.musicInfo 下
const getCurrentSource = () => {
  const playMusic = playerState.playMusicInfo.musicInfo
  return playMusic
    ? 'source' in playMusic ? playMusic.source : playMusic.metadata.musicInfo.source
    : undefined
}

const saveStats = async() => {
  if (isSaving) {
    pendingSave = true
    return
  }
  isSaving = true
  pendingSave = false
  try {
    await saveData('@listening_statistics', stats)
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
    stats.totalDuration += elapsed
    stats.dailyStats[todayStr] = (stats.dailyStats[todayStr] || 0) + elapsed
    if (sessionSource) stats.sourceStats[sessionSource] = (stats.sourceStats[sessionSource] || 0) + elapsed
    void saveStats()
    global.state_event.statisticsUpdated(stats)
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

export const getStatistics = () => stats

export default () => {
  // 加载初始统计数据
  void getData<StatisticsData>('@listening_statistics').then(data => {
    const today = dateFormat(Date.now(), 'Y-M-D')
    const needInitFirstUse = !data?.firstUseDate
    if (data) {
      stats = {
        totalDuration: data.totalDuration || 0,
        dailyStats: data.dailyStats || {},
        firstUseDate: data.firstUseDate || today,
        sourceStats: data.sourceStats || {},
      }
    } else {
      stats.firstUseDate = today
    }
    // 首次使用日期一旦缺失就立即落盘，锁定乐龄起点
    if (needInitFirstUse) void saveStats()
    global.state_event.statisticsUpdated(stats)
  })

  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handlePause)
  global.app_event.on('error', handlePause)
  global.app_event.on('musicToggled', handleMusicToggled)
}
