import initOn from './on'
import initSend from './send'

export default (socket: LX.Sync.Socket) => {
  initOn(socket)
  initSend(socket)
}
