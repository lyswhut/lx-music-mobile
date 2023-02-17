import { connect, SYNC_CODE } from '@/plugins/sync'
import { updateSetting } from '@/core/common'


export default async(setting: LX.AppSetting) => {
  if (!setting['sync.enable']) return

  connect().catch(err => {
    switch (err.message) {
      case SYNC_CODE.unknownServiceAddress:
      case SYNC_CODE.missingAuthCode:
      case SYNC_CODE.authFailed:
        updateSetting({ 'sync.enable': false })
        break
    }
  })
}
