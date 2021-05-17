/**
 * @format
 */


// import '@/utils/log'
import './shim'
import '@/utils/errorHandle'
import '@/config/globalData'
import SplashScreen from 'react-native-splash-screen'
import { init as initNavigation, navigations, showPactModal } from '@/navigation'
import { registerPlaybackService } from '@/plugins/player'
import { getStore } from '@/store'
import { action as commonAction } from '@/store/modules/common'
import { action as playerAction } from '@/store/modules/player'
import { action as listAction } from '@/store/modules/list'
import { init as initMusicTools } from '@/utils/music'
import { init as initLyric } from '@/plugins/lyric'
import { init as initI18n, supportedLngs } from '@/plugins/i18n'
import { deviceLanguage, getPlayInfo } from '@/utils/tools'
import { LIST_ID_PLAY_TEMP, LIST_ID_PLAY_LATER } from '@/config/constant'

console.log('starting app...')

let store
let isInited = false
let isFirstRun = true

const init = () => {
  if (isInited) return Promise.resolve()
  isInited = true
  store = getStore()
  // console.log('deviceLanguage', deviceLanguage)
  return Promise.all([
    store.dispatch(commonAction.initSetting()),
    store.dispatch(listAction.initList()),
    initLyric(),
    registerPlaybackService(),
  ]).then(() => {
    let lang = store.getState().common.setting.langId
    let needSetLang = false
    if (!supportedLngs.includes(lang)) {
      if (typeof deviceLanguage == 'string' && supportedLngs.includes(deviceLanguage)) {
        lang = deviceLanguage
      } else {
        lang = 'en_us'
      }
      needSetLang = true
    }
    console.log(lang)
    return initI18n(lang).then(() => {
      if (needSetLang) return store.dispatch(commonAction.setLang(lang))
    })
    // .catch(_ => _)
    // StatusBar.setHidden(false)
    // console.log('init')
  }).then(() => {
    initMusicTools()
    getPlayInfo().then(info => {
      if (!info) return
      global.restorePlayInfo = info
      if (info.listId != LIST_ID_PLAY_TEMP && info.listId != LIST_ID_PLAY_LATER) {
        info.list = global.allList[info.listId]
        if (info.list) info.list = info.list.list
      }
      store.dispatch(playerAction.setList({
        list: {
          list: info.list,
          id: info.listId,
        },
        index: info.index,
      }))
    })
  })
}

initNavigation(async() => {
  init().then(() => {
    navigations.pushHomeScreen()
    SplashScreen.hide()
    if (!store.getState().common.setting.isAgreePact) {
      showPactModal()
    } else {
      if (isFirstRun) {
        isFirstRun = false
        store.dispatch(commonAction.checkVersion())
      }
    }
  })
})

