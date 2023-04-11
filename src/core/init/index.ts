import { initSetting, showPactModal } from '@/core/common'
import registerPlaybackService from '@/plugins/player/service'
import initTheme from './theme'
import initI18n from './i18n'
import initPlayer from './player'
import dataInit from './dataInit'
import initSync from './sync'
// import syncSetting from './syncSetting'
import { setUserApi } from '@/core/apiSource'
import commonActions from '@/store/common/action'
import settingState from '@/store/setting/state'
import { checkUpdate } from '@/core/version'

let isFirstPush = true
const handlePushedHomeScreen = () => {
  if (settingState.setting['common.isAgreePact']) {
    if (isFirstPush) {
      isFirstPush = false
      void checkUpdate()
    }
  } else {
    if (isFirstPush) isFirstPush = false
    showPactModal()
  }
}

let isInited = false
export default async() => {
  if (isInited) return handlePushedHomeScreen
  commonActions.setFontSize(global.lx.fontSize)
  const setting = await initSetting()
  // console.log(setting)

  await initTheme(setting)
  await initI18n(setting)

  setUserApi(setting['common.apiSource'])

  registerPlaybackService()
  await initPlayer(setting)
  await dataInit(setting)

  void initSync(setting)

  // syncSetting()

  isInited = true

  return handlePushedHomeScreen
}
