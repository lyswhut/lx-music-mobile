import { registerListActionEvent } from '../../../utils'

let unregisterLocalListAction: (() => void) | null

export const registerEvent = (socket: LX.Sync.Socket) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterLocalListAction = registerListActionEvent((action) => {
    if (!socket?.isReady) return
    void socket.remoteSyncList.onListSyncAction(action)
  })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
