import handleAuth from './auth'
import { connect as socketConnect, disconnect as socketDisconnect } from './client'
import { getSyncHost } from '@/utils/data'
import { SYNC_CODE } from './config'
import log from '../log'
import { setSyncMessage, setSyncStatus } from '@/core/sync'

const handleConnect = async(authCode?: string) => {
  const hostInfo = await getSyncHost()
  // console.log(hostInfo)
  if (!hostInfo || !hostInfo.host || !hostInfo.port) throw new Error(SYNC_CODE.unknownServiceAddress)
  await disconnect(false)
  const keyInfo = await handleAuth(hostInfo.host, hostInfo.port, authCode)
  socketConnect(hostInfo.host, hostInfo.port, keyInfo)
}
const handleDisconnect = async() => {
  await socketDisconnect()
}

const connect = async(authCode?: string) => {
  setSyncStatus({
    status: false,
    message: SYNC_CODE.connecting,
  })
  return handleConnect(authCode).then(() => {
    setSyncStatus({
      status: true,
      message: '',
    })
  }).catch(async err => {
    setSyncStatus({
      status: false,
      message: err.message,
    })
    switch (err.message) {
      case SYNC_CODE.connectServiceFailed:
      case SYNC_CODE.missingAuthCode:
        break
      default:
        log.r_warn(err.message)
        break
    }

    return Promise.reject(err)
  })
}

const disconnect = async(isResetStatus = true) => handleDisconnect().then(() => {
  log.info('disconnect...')
  if (isResetStatus) {
    setSyncStatus({
      status: false,
      message: '',
    })
  }
}).catch((err: any) => {
  log.error(`disconnect error: ${err.message as string}`)
  setSyncMessage(err.message)
})

export {
  connect,
  disconnect,
  SYNC_CODE,
}
