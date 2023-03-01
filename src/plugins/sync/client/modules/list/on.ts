import { handleRemoteListAction } from '../../../utils'

export default (socket: LX.Sync.Socket) => {
  socket.onRemoteEvent('list:sync:action', (action) => {
    if (!socket.isReady) return
    void handleRemoteListAction(action)
  })
}

