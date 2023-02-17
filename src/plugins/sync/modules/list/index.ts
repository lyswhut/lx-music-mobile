import { register as registerOn, unregister as unregisterOn } from './on'
import {
  register as registerSend,
  unregister as unregisterSend,
} from './send'

export const registerListHandler = (_socket: LX.Sync.Socket) => {
  unregisterListHandler()
  registerOn(_socket)
  registerSend(_socket)
}

export const unregisterListHandler = () => {
  unregisterOn()
  unregisterSend()
}

export * from './send'
