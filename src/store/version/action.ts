import state, { type InitState } from './state'


export default {
  setVersionInfo(info: Partial<InitState['versionInfo']>) {
    Object.assign(state.versionInfo, info)
    global.state_event.versionInfoUpdated({ ...state.versionInfo })
  },
  setIgnoreVersion(version: InitState['ignoreVersion']) {
    state.ignoreVersion = version
    global.state_event.versionInfoIgnoreVersionUpdated(version)
  },
  setProgress(info: InitState['progress']) {
    if (state.progress.total != info.total) {
      state.progress.total = info.total
    }
    state.progress.current = info.current

    global.state_event.versionDownloadProgressUpdated({ ...state.progress })
  },
  setVisibleModal(visible: boolean) {
    if (state.showModal == visible) return
    state.showModal = visible
  },
}

