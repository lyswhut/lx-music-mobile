/**
 * @format
 */


// import '@/utils/log'
import './shim'
import '@/utils/errorHandle'
import { init as initLog, log } from '@/utils/log'
import '@/config/globalData'
import SplashScreen from 'react-native-splash-screen'
import { init as initNavigation, navigations, showPactModal } from '@/navigation'
import { registerPlaybackService } from '@/plugins/player'
import { getStore } from '@/store'
import { action as commonAction } from '@/store/modules/common'
import { action as playerAction } from '@/store/modules/player'
import { action as listAction } from '@/store/modules/list'
import { init as initMusicTools } from '@/utils/music'
import { init as initLyric, toggleTranslation } from '@/utils/lyric'
import { showLyric, onPositionChange } from '@/utils/lyricDesktop'
import { init as initI18n, supportedLngs } from '@/plugins/i18n'
import { deviceLanguage, getPlayInfo, toast } from '@/utils/tools'
import { LIST_ID_PLAY_TEMP } from '@/config/constant'
import { connect, SYNC_CODE } from '@/plugins/sync'

console.log('starting app...')

let store
let isInited = false
let isFirstRun = true
initLog()

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
    let setting = store.getState().common.setting
    toggleTranslation(setting.player.isShowLyricTranslation)
    if (setting.sync.enable) {
      connect().catch(err => {
        if (err.message == SYNC_CODE.unknownServiceAddress) {
          store.dispatch(commonAction.setIsEnableSync(false))
        }
      })
    }
    if (setting.desktopLyric.enable) {
      showLyric(
        setting.desktopLyric.isLock,
        setting.desktopLyric.theme,
        setting.desktopLyric.position.x,
        setting.desktopLyric.position.y,
        setting.desktopLyric.textPosition.x,
        setting.desktopLyric.textPosition.y,
      ).catch(() => {
        store.dispatch(commonAction.setIsShowDesktopLyric(false))
      })
    }
    onPositionChange(position => {
      store.dispatch(commonAction.setDesktopLyricPosition(position))
    })

    let lang = setting.langId
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
      if (info.listId != LIST_ID_PLAY_TEMP) {
        info.list = global.allList[info.listId]
        if (info.list) info.list = info.list.list
      }

      if (!info.list || !info.list[info.index]) {
        const info2 = { ...info }
        if (info2.list) {
          info2.music = info2.list[info2.index]?.name
          info2.list = info2.list.length
        }
        toast('恢复播放数据失败，请去错误日志查看', 'long')
        log.warn('Restore Play Info failed: ', JSON.stringify(info2, null, 2))

        return
      }
      global.restorePlayInfo = info

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

initNavigation(() => {
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

