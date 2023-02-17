import { io } from 'socket.io-client'
import { aesEncrypt } from './utils'
import * as modules from '../modules'
// import { action as commonAction } from '@/store/modules/common'
// import { getStore } from '@/store'
import registerSyncListHandler from './syncList'
import log from '../log'
import { setSyncStatus } from '@/core/sync'
import { SYNC_CODE } from './config'

const handleConnection = (socket: LX.Sync.Socket) => {
  for (const module of Object.values(modules)) {
    module.registerListHandler(socket)
  }
}

let socket: LX.Sync.Socket | null
let listSyncPromise: Promise<void>
export const connect = (host: string, port: string, keyInfo: LX.Sync.KeyInfo) => {
  socket = io(`ws://${host}:${port}`, {
    path: '/sync',
    reconnectionAttempts: 5,
    transports: ['websocket'],
    query: {
      i: keyInfo.clientId,
      t: aesEncrypt(SYNC_CODE.msgConnect, keyInfo.key),
    },
  })

  listSyncPromise = registerSyncListHandler(socket)

  socket.on('connect', async() => {
    console.log('connect')
    log.info('connect')
    // const store = getStore()
    // global.lx.syncKeyInfo = keyInfo
    setSyncStatus({
      status: false,
      message: 'Wait syncing...',
    })
    try {
      await listSyncPromise
    } catch (err: any) {
      console.log(err)
      log.r_error(err.stack)
      setSyncStatus({
        status: false,
        message: err.message,
      })
      return
    }
    log.info('sync list success')
    handleConnection(socket as LX.Sync.Socket)
    log.info('register list sync service success')
    setSyncStatus({
      status: true,
      message: '',
    })
  })
  socket.on('connect_error', (err) => {
    console.log(err.message)
    log.error('connect error: ', err.stack)
    setSyncStatus({
      status: false,
      message: err.message,
    })
    // if (err.message === 'invalid credentials') {
    //   socket.auth.token = 'efgh'
    //   socket.connect()
    // }
  })
  socket.on('disconnect', (reason) => {
    console.log('disconnect', reason)
    log.warn('disconnect: ', reason)
    setSyncStatus({
      status: false,
      message: reason,
    })
    // if (reason === 'io server disconnect') {
    //   // the disconnection was initiated by the server, you need to reconnect manually
    //   socket.connect()
    // }
    // else the socket will automatically try to reconnect
  })

  // ws.onopen = () => {
  // // connection opened
  //   ws.send('something') // send a message
  // }

  // ws.onmessage = (e) => {
  // // a message was received
  //   console.log(e.data)
  // }

  // ws.onerror = (e) => {
  // // an error occurred
  //   console.log(e.message)
  // }

  // ws.onclose = (e) => {
  // // connection closed
  //   console.log(e.code, e.reason)
  // }
}

export const disconnect = async() => {
  if (!socket) return
  log.info('disconnecting...')
  socket.close()
  socket = null
}

