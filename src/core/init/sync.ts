import { connectServer } from '@/plugins/sync'
import { updateSetting } from '@/core/common'
// import { SYNC_CODE } from '@/config/constant'
import { getSyncHost } from '@/plugins/sync/data'


export default async(setting: LX.AppSetting) => {
  if (!setting['sync.enable']) return

  const host = await getSyncHost()
  // console.log(host)
  if (!host) {
    updateSetting({ 'sync.enable': false })
    return
  }
  void connectServer(host)
}
