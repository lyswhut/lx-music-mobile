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
  setServerInfo(name: string, type: keyof LX.Sync.ModeTypes) {
    state.serverName = name
    state.type = type
  },
  setSyncModeComponentId(id: string) {
    state.syncModeComponentId = id
  },
}

