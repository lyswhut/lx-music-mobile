import state from './state'


export default {
  setStatus(info: LX.Sync.Status) {
    state.status = info.status
    state.message = info.message

    global.state_event.syncStatusUpdated({ ...state })
  },
  setMessage(message: LX.Sync.Status['message']) {
    state.message = message

    global.state_event.syncStatusUpdated({ ...state })
  },
}

