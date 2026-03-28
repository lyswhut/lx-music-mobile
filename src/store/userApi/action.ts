import { state } from './state'
import { event } from './event'

export const setStatus = (status: LX.UserApi.UserApiStatus['status'], message: LX.UserApi.UserApiStatus['message']) => {
  state.status.status = status
  state.status.message = message

  event.status_changed({ status, message })
}


export const setUserApiList = (list: LX.UserApi.UserApiInfo[]) => {
  state.list = list

  event.list_changed([...list])
}

export const addUserApi = (info: LX.UserApi.UserApiInfo) => {
  state.list.push(info)

  event.list_changed([...state.list])
}


export const setUserApiAllowShowUpdateAlert = (id: string, enable: boolean) => {
  const targetIndex = state.list.findIndex(api => api.id == id)
  if (targetIndex < 0) return
  state.list[targetIndex].allowShowUpdateAlert = enable
  state.list.splice(targetIndex, 1, { ...state.list[targetIndex] })

  event.list_changed([...state.list])
}
