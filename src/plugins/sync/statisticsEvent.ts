import {
  getStatisticsStore,
  getStatisticsSnapshot,
  mergeRemoteStatistics,
  setStatisticsDeviceKey,
  subscribeStatisticsSync,
} from '@/core/init/player/playStatistics'
import { toMD5 } from '@/utils/tools'

export const getLocalStatisticsData = async(): Promise<LX.Statistics.StatisticsData> => {
  return getStatisticsStore() as LX.Statistics.StatisticsData
}

export const getLocalStatisticsMD5 = async(): Promise<string> => {
  return toMD5(getStatisticsSnapshot())
}

/** 远程数据 -> 本地（CRDT 合并，幂等） */
export const setLocalStatisticsData = async(data: LX.Statistics.StatisticsData) => {
  await mergeRemoteStatistics(data)
}

/** 同步完成后把本地 local 桶并入服务端签发的 clientId 桶 */
export const bindStatisticsDevice = async(clientId: string, deviceName?: string) => {
  await setStatisticsDeviceKey(clientId, deviceName)
}

export const handleRemoteStatisticsAction = async(action: LX.Sync.Statistics.ActionList) => {
  switch (action.action) {
    case 'statistics_data_sync':
      await mergeRemoteStatistics(action.data)
      break
    default:
      throw new Error('unknown statistics sync action')
  }
}

/** 注册本地统计变更监听，变更时把全量数据推送给服务端 */
export const registerStatisticsActionEvent = (
  sendStatisticsAction: (action: LX.Sync.Statistics.ActionList) => (void | Promise<void>),
) => {
  return subscribeStatisticsSync(() => {
    void sendStatisticsAction({ action: 'statistics_data_sync', data: getStatisticsStore() as LX.Statistics.StatisticsData })
  })
}
