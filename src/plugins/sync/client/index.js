import handleAuth from './auth'
import { connect as socketConnect, disconnect as socketDisconnect } from './client'
import { getSyncHost } from '@/utils/tools'
import { action as commonAction } from '@/store/modules/common'
import { getStore } from '@/store'
import { SYNC_CODE } from './config'

const handleConnect = async authCode => {
  const hostInfo = await getSyncHost()
  if (!hostInfo || !hostInfo.host || !hostInfo.port) throw new Error('Unknown service address')
  await disconnect(false)
  const keyInfo = await handleAuth(hostInfo.host, hostInfo.port, authCode)
  await socketConnect(hostInfo.host, hostInfo.port, keyInfo)
}
const handleDisconnect = async() => {
  await socketDisconnect()
}

const connect = authCode => {
  const store = getStore()
  store.dispatch(commonAction.setSyncStatus({
    status: false,
    message: SYNC_CODE.connecting,
  }))
  return handleConnect(authCode).then(() => {
    const store = getStore()
    store.dispatch(commonAction.setSyncStatus({
      status: true,
      message: '',
    }))
  }).catch(err => {
    const store = getStore()
    store.dispatch(commonAction.setSyncStatus({
      status: false,
      message: err.message,
    }))
  })
}

const disconnect = (isResetStatus = true) => handleDisconnect().then(() => {
  if (isResetStatus) {
    const store = getStore()
    store.dispatch(commonAction.setSyncStatus({
      status: false,
      message: '',
    }))
  }
}).catch(err => {
  const store = getStore()
  store.dispatch(commonAction.setSyncStatus({
    message: err.message,
  }))
})

export {
  connect,
  disconnect,
  SYNC_CODE,
}
