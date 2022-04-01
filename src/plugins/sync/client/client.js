import { io } from 'socket.io/client-dist/socket.io'
import { aesEncrypt } from './utils'
import * as modules from '../modules'
import { action as commonAction } from '@/store/modules/common'
import { getStore } from '@/store'
import registerSyncListHandler from './syncList'
import log from '../log'

const handleConnection = (socket) => {
  for (const module of Object.values(modules)) {
    module.registerListHandler(socket)
  }
}

let socket
let listSyncPromise
export const connect = (host, port, keyInfo) => {
  socket = io(`ws://${host}:${port}`, {
    path: '/sync',
    reconnectionAttempts: 5,
    transports: ['websocket'],
    query: {
      i: keyInfo.clientId,
      t: aesEncrypt('lx-music connect', keyInfo.key, keyInfo.iv),
    },
  })

  listSyncPromise = registerSyncListHandler(socket)

  socket.on('connect', async() => {
    console.log('connect')
    log.info('connect')
    const store = getStore()
    global.syncKeyInfo = keyInfo
    store.dispatch(commonAction.setSyncStatus({
      status: false,
      message: 'Wait syncing...',
    }))
    try {
      await listSyncPromise
    } catch (err) {
      console.log(err)
      log.r_error(err.stack)
      store.dispatch(commonAction.setSyncStatus({
        status: false,
        message: err.message,
      }))
      return
    }
    log.info('sync list success')
    handleConnection(socket)
    log.info('register list sync service success')
    store.dispatch(commonAction.setSyncStatus({
      status: true,
      message: '',
    }))
  })
  socket.on('connect_error', (err) => {
    console.log(err.message)
    log.error('connect error: ', err.stack)
    const store = getStore()
    store.dispatch(commonAction.setSyncStatus({
      status: false,
      message: err.message,
    }))
    // if (err.message === 'invalid credentials') {
    //   socket.auth.token = 'efgh'
    //   socket.connect()
    // }
  })
  socket.on('disconnect', (reason) => {
    console.log('disconnect', reason)
    log.warn('disconnect: ', reason)
    const store = getStore()
    store.dispatch(commonAction.setSyncStatus({
      status: false,
      message: reason,
    }))
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
  await socket.close()
  socket = null
}
