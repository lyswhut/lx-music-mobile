import { initSetting } from '@/config/setting'
import { TYPES } from './action'
import music from '@/utils/music'
import { Themes } from '@/theme'
import { NAV_VIEW_NAMES, VERSION_STATUS } from '@/config/constant'


const setting = initSetting()


global.globalObj = {
  qualityList: music.supportQuality[setting.setting.apiSource],
  apiSource: setting.setting.apiSource,
}

const initialState = {
  ...setting,
  nav: {
    activeIndex: 0,
    menus: [
      { id: 'search', name: '搜索', icon: 'search-2' },
      { id: 'songList', name: '歌单', icon: 'album' },
      { id: 'top', name: '排行榜', icon: 'leaderboard' },
      { id: 'love', name: '收藏', icon: 'love' },
      // { id: 'download', name: '下载', icon: 'download-2' },
      { id: 'setting', name: '设置', icon: 'setting' },
    ],
  },
  qualityList: music.supportQuality[setting.setting.apiSource],
  themes: Themes,
  systemColor: null,
  versionInfo: {
    status: VERSION_STATUS.checking,
    downloadProgress: {
      total: 0,
      current: 0,
    },
    showModal: false,
    version: null,
    desc: '',
    history: [],
  },
  syncStatus: {
    status: false,
    message: '',
  },
  componentIds: {},
}

initialState.nav.menus.forEach(({ id }, index) => {
  NAV_VIEW_NAMES[id] = index
})

const mutations = {
  [TYPES.updateSetting](state, setting) {
    return {
      ...state,
      setting: {
        ...state.setting,
        ...setting,
      },
    }
  },
  [TYPES.setComponentId](state, { name, id }) {
    return {
      ...state,
      componentIds: {
        ...state.componentIds,
        [name]: id,
      },
    }
  },
  [TYPES.removeComponentId](state, removeId) {
    const newComponentIds = { ...state.componentIds }
    for (const [name, id] of Object.entries(state.componentIds)) {
      if (id == removeId) {
        newComponentIds[name] = null
        break
      }
    }
    return {
      ...state,
      componentIds: newComponentIds,
    }
  },
  [TYPES.setNavActiveIndex](state, index) {
    if (index === state.nav.activeIndex) return state
    return {
      ...state,
      nav: {
        ...state.nav,
        activeIndex: index,
      },
    }
  },
  [TYPES.setPrevSelectListId](state, id) {
    return {
      ...state,
      setting: {
        ...state.setting,
        list: {
          ...state.setting.list,
          prevSelectListId: id,
        },
      },
    }
  },
  [TYPES.setAddMusicLocationType](state, type) {
    return {
      ...state,
      setting: {
        ...state.setting,
        list: {
          ...state.setting.list,
          addMusicLocationType: type,
        },
      },
    }
  },
  [TYPES.setAgreePact](state, isAgreePact) {
    return {
      ...state,
      setting: {
        ...state.setting,
        isAgreePact,
      },
    }
  },
  [TYPES.setSearchSource](state, { searchSource, tempSearchSource }) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        search: {
          ...state.setting.search,
        },
      },
    }
    if (searchSource != null) newState.setting.search.searchSource = searchSource
    if (tempSearchSource != null) newState.setting.search.tempSearchSource = tempSearchSource
    return newState
  },
  [TYPES.setLeaderboard](state, { tabId, source }) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        leaderboard: {
          ...state.setting.leaderboard,
        },
      },
    }
    if (tabId != null) newState.setting.leaderboard.tabId = tabId
    if (source != null) newState.setting.leaderboard.source = source
    return newState
  },
  [TYPES.setSongList](state, { sortId, tagInfo, source }) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        songList: {
          ...state.setting.songList,
        },
      },
    }
    if (tagInfo != null) newState.setting.songList.tagInfo = tagInfo
    if (sortId != null) newState.setting.songList.sortId = sortId
    if (source != null) newState.setting.songList.source = source
    return newState
  },
  [TYPES.setTop](state, { tabId, source }) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        leaderboard: {
          ...state.setting.leaderboard,
        },
      },
    }
    if (tabId != null) newState.setting.leaderboard.tabId = tabId
    if (source != null) newState.setting.leaderboard.source = source
    return newState
  },
  [TYPES.setApiSource](state, id) {
    global.globalObj.apiSource = id
    global.globalObj.supportQuality = music.supportQuality[id]

    return {
      ...state,
      setting: {
        ...state.setting,
        apiSource: id,
      },
    }
  },
  [TYPES.setIgnoreVersion](state, version) {
    return {
      ...state,
      setting: {
        ...state.setting,
        ignoreVersion: version,
      },
    }
  },
  [TYPES.setTheme](state, id) {
    return {
      ...state,
      setting: {
        ...state.setting,
        themeId: id,
      },
    }
  },
  [TYPES.setIsAutoTheme](state, enabled) {
    return {
      ...state,
      setting: {
        ...state.setting,
        isAutoTheme: enabled,
      },
    }
  },
  [TYPES.setSystemColor](state, color) {
    return {
      ...state,
      systemColor: color,
    }
  },
  [TYPES.setLang](state, id) {
    return {
      ...state,
      setting: {
        ...state.setting,
        langId: id,
      },
    }
  },
  [TYPES.setSourceNameType](state, id) {
    return {
      ...state,
      setting: {
        ...state.setting,
        sourceNameType: id,
      },
    }
  },
  [TYPES.setPlayNextMode](state, mode) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          togglePlayMethod: mode,
        },
      },
    }
  },
  [TYPES.setStartupAutoPlay](state, startupAutoPlay) {
    return {
      ...state,
      setting: {
        ...state.setting,
        startupAutoPlay,
      },
    }
  },
  [TYPES.setPlayerCacheSize](state, size) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          cacheSize: size,
        },
      },
    }
  },
  [TYPES.setIsPlayHighQuality](state, highQuality) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          highQuality,
        },
      },
    }
  },
  [TYPES.setIsHandleAudioFocus](state, isHandleAudioFocus) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          isHandleAudioFocus,
        },
      },
    }
  },
  [TYPES.setIsShowLyricTranslation](state, isShowLyricTranslation) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          isShowLyricTranslation,
        },
      },
    }
  },
  [TYPES.setIsShowLyricRoma](state, isShowLyricRoma) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          isShowLyricRoma,
        },
      },
    }
  },
  [TYPES.setIsS2T](state, isS2t) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          isS2t,
        },
      },
    }
  },
  [TYPES.setIsShowDesktopLyric](state, isShowDesktopLyric) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          enable: isShowDesktopLyric,
        },
      },
    }
  },
  [TYPES.setIsLockDesktopLyric](state, isLock) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          isLock,
        },
      },
    }
  },
  [TYPES.setThemeDesktopLyric](state, theme) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          theme,
        },
      },
    }
  },
  [TYPES.setIsClickPlayList](state, enable) {
    return {
      ...state,
      setting: {
        ...state.setting,
        list: {
          ...state.setting.list,
          isClickPlayList: enable,
        },
      },
    }
  },
  [TYPES.setDesktopLyricStyle](state, style) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          style: {
            ...state.setting.desktopLyric.style,
            ...style,
          },
        },
      },
    }
  },
  [TYPES.setDesktopLyricPosition](state, position) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          position,
        },
      },
    }
  },
  [TYPES.setDesktopLyricSingleLine](state, isSingleLine) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          isSingleLine,
        },
      },
    }
  },
  [TYPES.setDesktopLyricShowToggleAnima](state, showToggleAnima) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          showToggleAnima,
        },
      },
    }
  },
  [TYPES.setDesktopLyricWidth](state, width) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          width,
        },
      },
    }
  },
  [TYPES.setDesktopLyricMaxLineNum](state, maxLineNum) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          maxLineNum,
        },
      },
    }
  },
  [TYPES.setDesktopLyricTextPosition](state, textPosition) {
    return {
      ...state,
      setting: {
        ...state.setting,
        desktopLyric: {
          ...state.setting.desktopLyric,
          textPosition,
        },
      },
    }
  },
  [TYPES.setVersionInfo](state, versionInfo) {
    return {
      ...state,
      versionInfo: {
        ...state.versionInfo,
        ...versionInfo,
      },
    }
  },
  [TYPES.setTimeoutExit](state, { time, isPlayed }) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
        },
      },
    }
    if (time != null) newState.setting.player.timeoutExit = time
    if (isPlayed != null) newState.setting.player.timeoutExitPlayed = isPlayed

    return newState
  },
  [TYPES.setIsEnableSync](state, isEnableSync) {
    const newState = {
      ...state,
      setting: {
        ...state.setting,
        sync: {
          ...state.setting.sync,
          enable: isEnableSync,
        },
      },
    }
    return newState
  },
  [TYPES.setSyncStatus](state, { status, message }) {
    const newState = {
      ...state,
      syncStatus: {
        ...state.syncStatus,
      },
    }
    if (status != null) newState.syncStatus.status = status
    if (message != null) newState.syncStatus.message = message
    return newState
  },
  [TYPES.setPlayerPortraitStyle](state, style) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          portrait: {
            ...state.setting.player.portrait,
            style,
          },
        },
      },
    }
  },
  [TYPES.setPlayerLandscapeStyle](state, style) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          landscape: {
            ...state.setting.player.landscape,
            style,
          },
        },
      },
    }
  },
  [TYPES.setShareType](state, shareType) {
    return {
      ...state,
      setting: {
        ...state.setting,
        shareType,
      },
    }
  },
  [TYPES.setIsShowNotificationImage](state, flag) {
    return {
      ...state,
      setting: {
        ...state.setting,
        player: {
          ...state.setting.player,
          isShowNotificationImage: flag,
        },
      },
    }
  },
}

export default (state = initialState, action) =>
  mutations[action.type]
    ? mutations[action.type](state, action.payload)
    : state
