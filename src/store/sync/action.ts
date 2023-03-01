import state from './state'


export default {
  setStatus(info: LX.Sync.Status) {
    state.status.status = info.status
    state.status.message = info.message

    global.state_event.syncStatusUpdated({ ...state.status })
  },
  setMessage(message: LX.Sync.Status['message']) {
    state.status.message = message

    global.state_event.syncStatusUpdated({ ...state.status })
  },
  setServerNmae(name: string) {
    state.serverName = name
  },
  setSyncModeComponentId(id: string) {
    state.syncModeComponentId = id
  },
}

