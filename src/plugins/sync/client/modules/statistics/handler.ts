// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import {
  handleRemoteStatisticsAction,
  getLocalStatisticsData,
  setLocalStatisticsData,
  getLocalStatisticsMD5,
  bindStatisticsDevice,
} from '../../../statisticsEvent'
import { getDeviceName } from '@/utils/nativeModules/utils'
import log from '../../../log'
import { registerEvent, unregisterEvent } from './localEvent'

const logInfo = (eventName: string) => {
  log.info(`[${eventName}]${eventName.replace('statistics:sync:', '').replace(/_/g, ' ')}`)
}

// 必须在把数据发给服务端「之前」把本地 local 桶并入服务端签发的 clientId 桶，
// 否则服务端会以 'local' 为 key 存一份、客户端 rekey 后以 clientId 存一份，
// 下次同步两份都在 → 聚合时重复计数。clientId 在连接时即可知，rekey 幂等可重复调。
let boundClientId: string | null = null
const ensureDeviceBound = async(socket: LX.Sync.Socket) => {
  const clientId = socket.data.keyInfo.clientId
  if (boundClientId == clientId) return
  const deviceName = await getDeviceName().catch(() => undefined)
  await bindStatisticsDevice(clientId, deviceName)
  // rekey 幂等，并发重复调用安全
  // eslint-disable-next-line require-atomic-updates
  boundClientId = clientId
  socket.onClose(() => {
    boundClientId = null
  })
}

const handler: LX.Sync.ClientSyncHandlerStatisticsActions<LX.Sync.Socket> = {
  async onStatisticsSyncAction(socket, action) {
    if (!socket.moduleReadys?.statistics) return
    await handleRemoteStatisticsAction(action)
  },

  async statistics_sync_get_md5(socket) {
    logInfo('statistics:sync:statistics_sync_get_md5')
    await ensureDeviceBound(socket)
    return getLocalStatisticsMD5()
  },

  async statistics_sync_get_data(socket) {
    logInfo('statistics:sync:statistics_sync_get_data')
    await ensureDeviceBound(socket)
    return getLocalStatisticsData()
  },

  async statistics_sync_set_data(socket, data) {
    logInfo('statistics:sync:statistics_sync_set_data')
    await setLocalStatisticsData(data)
  },

  async statistics_sync_finished(socket) {
    logInfo('statistics:sync:finished')
    socket.moduleReadys.statistics = true
    registerEvent(socket)
    socket.onClose(() => {
      unregisterEvent()
    })
  },
}

export default handler
