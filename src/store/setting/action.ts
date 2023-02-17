import { updateSetting as mergeSetting } from '@/config/setting'
import state from './state'


export default {
  // mergeSetting(newSetting: Partial<LX.AppSetting>) {
  //   for (const [key, value] of Object.entries(newSetting)) {
  //     // @ts-expect-error
  //     state[key] = value
  //   }
  // },
  initSetting(newSetting: LX.AppSetting) {
    state.setting = newSetting
  },
  updateSetting(newSetting: Partial<LX.AppSetting>) {
    const result = mergeSetting(newSetting)
    state.setting = result.setting
    global.state_event.configUpdated(result.updatedSettingKeys, result.updatedSetting)
  },
}

