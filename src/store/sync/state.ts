
interface InitState {
  status: LX.Sync.Status
  serverName: string
  type: keyof LX.Sync.ModeTypes
  syncModeComponentId: string
}
const state: InitState = {
  status: {
    status: false,
    message: '',
  },
  serverName: '',
  type: 'list',
  syncModeComponentId: '',
}


export default state
