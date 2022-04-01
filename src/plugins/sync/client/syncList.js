import { getStore } from '@/store'
// import { action as commonAction } from '@/store/modules/common'
import { action as listAction } from '@/store/modules/list'
import { toast } from '@/utils/tools'

import { decryptMsg, encryptMsg } from './utils'
import log from '../log'

let socket
let syncAction

const wait = () => new Promise((resolve, reject) => {
  syncAction = [resolve, reject]
})

const sendListData = type => {
  const store = getStore()
  const state = store.getState()
  let listData
  switch (type) {
    case 'all':
      listData = {
        defaultList: state.list.defaultList,
        loveList: state.list.loveList,
        userList: state.list.userList,
      }
      break

    default:
      break
  }
  // console.log('sendListData')
  socket.emit('list:sync', encryptMsg(JSON.stringify({
    action: 'getData',
    data: listData,
  })), () => {
    log.info('[syncList]send data success')
  })
  // console.log('sendListData', 'encryptMsg')
}

const saveList = ({ defaultList, loveList, userList }) => {
  const store = getStore()
  store.dispatch(listAction.setSyncList({ defaultList, loveList, userList }))
}

const handleListSync = enMsg => {
  // console.log('handleListSync', enMsg.length)
  const { action, data } = JSON.parse(decryptMsg(enMsg))
  // console.log('handleListSync', action)
  switch (action) {
    case 'getData':
      log.info('[syncList]get data')
      sendListData(data)
      break
    case 'setData':
      log.info('[syncList]set data')
      saveList(data)
      log.info('[syncList]set data success')
      break
    case 'finished':
      if (!syncAction) return
      log.info('[syncList]finished')
      syncAction[0]()
      syncAction = null
      toast('Sync successfully')
      break
    default:
      break
  }
}

const handleDisconnect = err => {
  if (!syncAction) return
  syncAction[1](err.message ? err : new Error(err))
  syncAction = null
}

export default _socket => {
  socket = _socket
  socket.on('list:sync', handleListSync)
  socket.on('connect_error', handleDisconnect)
  socket.on('disconnect', handleDisconnect)
  return wait()
}
