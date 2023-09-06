// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import { handleRemoteListAction, getLocalListData, setLocalListData } from '../../../listEvent'
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
const handler: LX.Sync.ClientSyncHandlerListActions<LX.Sync.Socket> = {
  async onListSyncAction(socket, action) {
    if (!socket.moduleReadys?.list) return
    await handleRemoteListAction(action)
  },

  async list_sync_get_md5(socket) {
    logInfo('list:sync:list_sync_get_md5')
    return toMD5(JSON.stringify(await getLocalListData()))
  },

  async list_sync_get_sync_mode(socket) {
    logInfo('list:sync:list_sync_get_sync_mode')
    const unsubscribe = socket.onClose(() => {
      removeSyncModeEvent()
    })
    return selectSyncMode(socket.data.keyInfo.serverName, 'list').finally(unsubscribe)
  },

  async list_sync_get_list_data(socket) {
    logInfo('list:sync:list_sync_get_list_data')
    return getLocalListData()
  },

  async list_sync_set_list_data(socket, data) {
    logInfo('list:sync:list_sync_set_list_data')
    await setLocalListData(data)
  },

  async list_sync_finished(socket) {
    logInfo('list:sync:finished')
    socket.moduleReadys.list = true
    registerEvent(socket)
    socket.onClose(() => {
      unregisterEvent()
    })
  },
}

export default handler


// export default async(socket: LX.Sync.Socket) => new Promise<void>((resolve, reject) => {
//   let listenEvents: Array<() => void> = []
//   const unregisterEvents = () => {
//     while (listenEvents.length) listenEvents.shift()?.()
//   }

//   socket.onClose(() => {
//     unregisterEvents()
//     removeSyncModeEvent()
//     reject(new Error('closed'))
//   })
//   listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_get_list_data', async() => {
//     logInfo('list:sync:list_sync_get_list_data')
//     socket?.sendData('list:sync:list_sync_get_list_data', await getLocalListData(), (err) => {
//       if (err) {
//         logError('list:sync:list_sync_get_list_data', err)
//         socket.close(SYNC_CLOSE_CODE.failed)
//         return
//       }
//       logInfo('list:sync:list_sync_get_list_data', true)
//     })
//   }))
//   listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_get_sync_mode', async() => {
//     logInfo('list:sync:list_sync_get_sync_mode')
//     let mode: LX.Sync.List.SyncMode
//     try {
//       mode = await selectSyncMode(socket.data.keyInfo.serverName)
//     } catch (err: unknown) {
//       logError('list:sync:list_sync_get_sync_mode', err as Error)
//       socket.close(SYNC_CLOSE_CODE.normal)
//       return
//     }
//     socket?.sendData('list:sync:list_sync_get_sync_mode', mode, (err) => {
//       if (err) {
//         logError('list:sync:list_sync_get_sync_mode', err)
//         socket.close(SYNC_CLOSE_CODE.failed)
//         return
//       }
//       logInfo('list:sync:list_sync_get_sync_mode', true)
//     })
//   }))
//   listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_set_data', async(data) => {
//     logInfo('list:sync:list_sync_set_data')
//     await setLocalListData(data)
//     logInfo('list:sync:list_sync_set_data', true)
//   }))
//   listenEvents.push(socket.onRemoteEvent('list:sync:finished', async() => {
//     unregisterEvents()
//     resolve()
//     logInfo('list:sync:finished', true)
//     toast('Sync successfully')
//   }))
// })
