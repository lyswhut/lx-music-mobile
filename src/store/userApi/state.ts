
interface InitState {
  list: LX.UserApi.UserApiInfo[]
  status: {
    status: boolean
    message?: string
  }
  apis: Partial<LX.UserApi.UserApiSources>
}
const state: InitState = {
  list: [],
  status: {
    status: false,
    message: 'initing',
  },
  apis: {},
}


export {
  state,
}
