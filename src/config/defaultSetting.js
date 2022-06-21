// const path = require('path')
// const os = require('os')
// const { isMac } = require('./utils')
import { MUSIC_TOGGLE_MODE } from './constant'

const defaultSetting = {
  version: '1.26',
  player: {
    togglePlayMethod: MUSIC_TOGGLE_MODE.listLoop,
    highQuality: false,
    isSavePlayTime: false,
    cacheSize: 1024, // unit MB
    timeoutExit: '',
    timeoutExitPlayed: true,
    isHandleAudioFocus: true,
    isShowLyricTranslation: false,
    isShowLyricRoma: false,
    isShowNotificationImage: true,
    isS2t: false, // 是否将歌词从简体转换为繁体
    portrait: {
      style: {
        lrcFontSize: 160,
      },
    },
    landscape: {
      style: {
        lrcFontSize: 180,
      },
    },
  },
  desktopLyric: {
    enable: false,
    isLock: false,
    theme: 'green',
    width: 100,
    maxLineNum: 5,
    isSingleLine: false,
    showToggleAnima: true,
    // width: 380,
    // height: 420,
    position: {
      x: 0,
      y: 0,
    },
    textPosition: {
      x: 'left',
      y: 'top',
    },
    style: {
      fontSize: 180,
      opacity: 100,
      // isZoomActiveLrc: true,
    },
  },
  list: {
    isClickPlayList: false,
    isShowSource: true,
    prevSelectListId: 'default',
    isSaveScrollLocation: true,
    addMusicLocationType: 'top',
  },
  download: {
    enable: false,
    // savePath: path.join(os.homedir(), 'Desktop'),
    fileName: '歌名 - 歌手',
    maxDownloadNum: 3,
    isDownloadLrc: false,
    isEmbedPic: true,
    isEmbedLyric: false,
  },
  leaderboard: {
    source: 'kw',
    tabId: 'kw__16',
  },
  songList: {
    source: 'kw',
    sortId: 'new',
    tagInfo: {
      name: '默认',
      id: null,
    },
  },
  odc: {
    isAutoClearSearchInput: false,
    isAutoClearSearchList: false,
  },
  search: {
    searchSource: 'kw',
    tempSearchSource: 'kw',
    isShowHotSearch: false,
    isShowHistorySearch: false,
    isFocusSearchBox: false,
  },
  sync: {
    enable: false,
  },
  // network: {
  //   proxy: {
  //     enable: false,
  //     host: '',
  //     port: '',
  //     username: '',
  //     password: '',
  //   },
  // },
  themeId: 'green',
  isAutoTheme: true,
  langId: null,
  sourceId: 'kw',
  apiSource: 'temp',
  sourceNameType: 'alias',
  shareType: 'system',
  // randomAnimate: true,
  ignoreVersion: null,
  isAgreePact: false,
  startupAutoPlay: false,
  autoHidePlayBar: true,
}

const overwriteSetting = {
  // songList: {
  //   source: 'kw',
  //   sortId: '',
  // },
  // search: {
  //   searchSource: 'kw',
  // },
  // player: {
  //   cacheSize: 1024,
  // },
}

// 使用新年皮肤
// if (new Date().getMonth() < 2) defaultSetting.themeId = 9


export {
  defaultSetting,
  overwriteSetting,
}
