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
  [TYPES.setVersionInfo](state, versionInfo) {
    return {
      ...state,
      versionInfo: {
        ...state.versionInfo,
        ...versionInfo,
      },
    }
  },
}

export default (state = initialState, action) =>
  mutations[action.type]
    ? mutations[action.type](state, action.payload)
    : state
