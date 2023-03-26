/* eslint-disable no-var */
import type { AppEventTypes } from '@/event/appEvent'
import type { ListEventTypes } from '@/event/listEvent'
import type { StateEventTypes } from '@/event/stateEvent'
import type { I18n } from '@/lang/i18n'
import type { Buffer as _Buffer } from 'buffer'
import type { SettingScreenIds } from '@/screens/Home/Views/Setting'

// interface Process {
//   env: {
//     NODE_ENV: 'development' | 'production'
//   }
//   versions: {
//     app: string
//   }
// }
interface GlobalData {
  fontSize: number
  gettingUrlId: string

  // event_app: AppType
  // event_list: ListType

  playerStatus: {
    isInitialized: boolean
    isRegisteredService: boolean
    isIniting: boolean
  }
  restorePlayInfo: LX.Player.SavedPlayInfo | null
  isScreenKeepAwake: boolean
  isPlayedStop: boolean
  isEnableSyncLog: boolean
  playerTrackId: string

  qualityList: LX.QualityList

  jumpMyListPosition: boolean

  settingActiveId: SettingScreenIds

  /**
   * 首页是否正在滚动中，用于防止意外误触播放歌曲
   */
  homePagerIdle: boolean

  // windowInfo: {
  //   screenW: number
  //   screenH: number
  //   fontScale: number
  //   pixelRatio: number
  //   screenPxW: number
  //   screenPxH: number
  // }

  // syncKeyInfo: LX.Sync.KeyInfo
}


declare global {
  var isDev: boolean
  var lx: GlobalData
  var i18n: I18n
  var app_event: AppEventTypes
  var list_event: ListEventTypes
  var state_event: StateEventTypes

  var Buffer: typeof _Buffer

  module NodeJS {
    interface ProcessVersions {
      app: string
    }
  }
  // var process: Process
}

export {}
