import { createSelector } from 'reselect'
import apiSourceInfo from '@/utils/music/api-source-info'

// sourceInfo(state, getters, rootState, { sourceNames }) {
//   return { sources: sources.map(item => ({ id: item.id, name: sourceNames[item.id] })), sortList }
// },
// tags: state => state.tags,
// isVisibleListDetail: state => state.isVisibleListDetail,
// selectListInfo: state => state.selectListInfo,
export const common = state => state.common
export const navMenus = state => state.common.nav.menus
export const navActiveIndex = state => state.common.nav.activeIndex

export const setting = state => state.common.setting

export const componentIds = state => state.common.componentIds

export const activeLangId = state => state.common.setting.langId

export const isAgreePact = state => state.common.setting.isAgreePact

export const isPlayHighQuality = state => state.common.setting.player.highQuality
export const isHandleAudioFocus = state => state.common.setting.player.isHandleAudioFocus
export const playerCacheSize = state => state.common.setting.player.cacheSize

export const themes = state => state.common.themes
export const activeThemeId = state => state.common.setting.themeId
export const theme = createSelector(
  [themes, activeThemeId],
  (themes, activeThemeId) => (themes[activeThemeId] || themes.green).colors)
export const themeList = createSelector(themes, themes => Object.values(themes))

export const versionInfo = state => state.common.versionInfo

export const prevSelectListId = state => state.common.setting.list.prevSelectListId
export const addMusicLocationType = state => state.common.setting.list.addMusicLocationType

export const togglePlayMethod = state => state.common.setting.player.togglePlayMethod

export const downloadFileName = state => state.common.setting.download.fileName


export const sourceNameType = state => state.common.setting.sourceNameType

export const isEnableDesktopLyric = state => state.common.setting.desktopLyric.enable
export const isLockDesktopLyric = state => state.common.setting.desktopLyric.isLock
export const themeDesktopLyric = state => state.common.setting.desktopLyric.theme
export const desktopLyricPosition = state => state.common.setting.desktopLyric.position
export const desktopLyricTextPosition = state => state.common.setting.desktopLyric.textPosition

export const timeoutExit = state => state.common.setting.player.timeoutExit
export const timeoutExitPlayed = state => state.common.setting.player.timeoutExitPlayed
export const isShowLyricTranslation = state => state.common.setting.player.isShowLyricTranslation

export const activeApiSourceId = state => state.common.setting.apiSource

export const isEnableSync = state => state.common.setting.sync.enable
export const syncStatus = state => state.common.syncStatus

const apiSourceListFormated = apiSourceInfo.map(api => ({
  id: api.id,
  name: api.name,
  disabled: api.disabled,
}))
export const apiSourceList = state => apiSourceListFormated

export const supportQualitys = state => apiSourceInfo.find(s => s.id == state.common.setting.apiSource).supportQualitys
