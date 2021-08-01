import { encryptMsg } from '../../client/utils'

let socket

export const sendListAction = (action, data) => {
  if (!socket) return
  socket.emit('list:action', encryptMsg(JSON.stringify({ action, data })))
}

export const register = _socket => {
  socket = _socket
}

export const unregister = () => {
  socket = null
}
