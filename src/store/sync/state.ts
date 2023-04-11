
interface InitState {
  status: LX.Sync.Status
  serverName: string
  syncModeComponentId: string
}
const state: InitState = {
  status: {
    status: false,
    message: '',
  },
  serverName: '',
  syncModeComponentId: '',
}


export default state
