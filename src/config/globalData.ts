import { version } from '../../package.json'
import { createAppEventHub } from '@/event/appEvent'
import { createListEventHub } from '@/event/listEvent'
import { createStateEventHub } from '@/event/stateEvent'
if (process.versions == null) {
  // @ts-expect-error
  process.versions = {
    app: version,
  }
} else process.versions.app = version

// global.i18n = null

// let screenW = Dimensions.get('window').width
// let screenH = Dimensions.get('window').height
// if (screenW > screenH) {
//   const temp = screenW
//   screenW = screenH
//   screenH = temp
// }


global.lx = {
  fontSize: 1,
  playerStatus: {
    isInitialized: false,
    isRegisteredService: false,
    isIniting: false,
  },

  restorePlayInfo: null,
  // allList: null,
  // globalObj: null,
  // listScrollPosition: {},
  // listSort: {},

  isScreenKeepAwake: false,

  // 是否播放完后退出应用
  isPlayedStop: false,

  // prevListPlayIndex: -1,

  // syncKeyInfo: {},

  isEnableSyncLog: false,

  playerTrackId: '',

  gettingUrlId: '',

  qualityList: {},

  jumpMyListPosition: false,

  settingActiveId: 'basic',

  homePagerIdle: true,

  // syncKeyInfo: initValue as LX.Sync.KeyInfo,

  // windowInfo: {
  //   screenW,
  //   screenH,
  //   fontScale: PixelRatio.getFontScale(),
  //   pixelRatio: PixelRatio.get(),
  //   screenPxW: PixelRatio.getPixelSizeForLayoutSize(screenW),
  //   screenPxH: PixelRatio.getPixelSizeForLayoutSize(screenH),
  // },
}

global.app_event = createAppEventHub()
global.list_event = createListEventHub()
global.state_event = createStateEventHub()
