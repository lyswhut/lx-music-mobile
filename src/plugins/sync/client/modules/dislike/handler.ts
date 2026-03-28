// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import { handleRemoteDislikeAction, getLocalDislikeData, setLocalDislikeData } from '../../../dislikeEvent'
import log from '../../../log'
// import { SYNC_CLOSE_CODE } from '@/config/constant'
import { removeSyncModeEvent, selectSyncMode } from '@/core/sync'
import { toMD5 } from '@/utils/tools'
import { registerEvent, unregisterEvent } from './localEvent'

const logInfo = (eventName: string, success = false) => {
  log.info(`[${eventName}]${eventName.replace('list:sync:list_sync_', '').replace(/_/g, ' ')}${success ? ' success' : ''}`)
}
// const logError = (eventName: string, err: Error) => {
//   log.error(`[${eventName}]${eventName.replace('list:sync:list_sync_', '').replace(/_/g, ' ')} error: ${err.message}`)
// }
const handler: LX.Sync.ClientSyncHandlerDislikeActions<LX.Sync.Socket> = {
  async onDislikeSyncAction(socket, action) {
    if (!socket.moduleReadys?.dislike) return
    await handleRemoteDislikeAction(action)
  },

  async dislike_sync_get_md5(socket) {
    logInfo('dislike:sync:dislike_sync_get_md5')
    return toMD5((await getLocalDislikeData()).trim())
  },


  async dislike_sync_get_sync_mode(socket) {
    logInfo('dislike:sync:dislike_sync_get_sync_mode')
    const unsubscribe = socket.onClose(() => {
      removeSyncModeEvent()
    })
    return selectSyncMode(socket.data.keyInfo.serverName, 'dislike').finally(unsubscribe)
  },

  async dislike_sync_get_list_data(socket) {
    logInfo('dislike:sync:dislike_sync_get_list_data')
    return getLocalDislikeData()
  },

  async dislike_sync_set_list_data(socket, data) {
    logInfo('dislike:sync:dislike_sync_set_list_data')
    await setLocalDislikeData(data)
  },

  async dislike_sync_finished(socket) {
    logInfo('dislike:sync:finished')
    socket.moduleReadys.dislike = true
    registerEvent(socket)
    socket.onClose(() => {
      unregisterEvent()
    })
  },
}

export default handler
