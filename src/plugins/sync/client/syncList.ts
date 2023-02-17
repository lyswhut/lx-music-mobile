// import { getStore } from '@/store'
// import { action as commonAction } from '@/store/modules/common'
// import { action as listAction } from '@/store/modules/list'
import { toast } from '@/utils/tools'

import { decryptMsg, encryptMsg } from './utils'
import log from '../log'
import { LIST_IDS } from '@/config/constant'
import { getListMusics, userLists } from '@/utils/listManage'

let socket: LX.Sync.Socket | null
let syncAction: [() => void, (err: any) => void] | null

const wait = async(): Promise<void> => new Promise((resolve, reject) => {
  syncAction = [resolve, reject]
})

const getListDataFull = async(): Promise<LX.Sync.ListData> => {
  return Promise.all([
    getListMusics(LIST_IDS.DEFAULT),
    getListMusics(LIST_IDS.LOVE),
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    ...userLists.map(l => getListMusics(l.id)),
  ]).then(([defaultList, loveList, ...userList]) => {
    return {
      defaultList,
      loveList,
      userList: userLists.map((l, i) => ({ ...l, list: userList[i] })),
    }
  })
}
const sendListData = async(type: LX.Sync.SyncClientActionGetData) => {
  // const state = store.getState()

  let listData
  switch (type) {
    case 'all':
      listData = await getListDataFull()
      break

    default:
      break
  }
  // console.log('sendListData')
  socket!.emit('list:sync', encryptMsg(JSON.stringify({
    action: 'getData',
    data: listData,
  })), () => {
    log.info('[syncList]send data success')
  })
  // console.log('sendListData', 'encryptMsg')
}

const saveList = ({ defaultList, loveList, userList }: LX.Sync.ListData) => {
  // const store = getStore()
  void global.list_event.list_data_overwrite({ defaultList, loveList, userList }, true)
}

const handleListSync = (enMsg: string) => {
  // console.log('handleListSync', enMsg.length)
  const msg = JSON.parse(decryptMsg(enMsg)) as LX.Sync.SyncClientAction
  // console.log('handleListSync', action)
  switch (msg.action) {
    case 'getData':
      log.info('[syncList]get data')
      void sendListData(msg.data)
      break
    case 'setData':
      log.info('[syncList]set data')
      saveList(msg.data)
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

const handleDisconnect = (err: any) => {
  if (!syncAction) return
  syncAction[1](err.message ? err : new Error(err))
  syncAction = null
}

export default async(_socket: LX.Sync.Socket) => {
  socket = _socket
  socket.on('list:sync', handleListSync)
  socket.on('connect_error', handleDisconnect)
  socket.on('disconnect', handleDisconnect)
  return wait()
}
