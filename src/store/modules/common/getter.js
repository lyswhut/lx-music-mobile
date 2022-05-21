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

export const systemColor = state => state.common.systemColor
export const isAutoTheme = state => state.common.setting.isAutoTheme
export const themeList = state => state.common.themes
export const activeThemeId = state => state.common.setting.themeId
export const activeTheme = createSelector(
  [themeList, activeThemeId, isAutoTheme, systemColor],
  (themeList, activeThemeId, isAutoTheme, systemColor) => {
    const themeId = isAutoTheme && systemColor == 'dark' ? 'black' : activeThemeId
    return themeList.find(theme => theme.id === themeId) || themeList[0]
  })
export const theme = createSelector(activeTheme, activeTheme => activeTheme.colors)
export const isDarkTheme = createSelector(activeTheme, activeTheme => activeTheme.isDark)
export const statusBarStyle = createSelector(isDarkTheme, isDarkTheme => isDarkTheme ? 'light-content' : 'dark-content')

export const versionInfo = state => state.common.versionInfo

export const prevSelectListId = state => state.common.setting.list.prevSelectListId
export const addMusicLocationType = state => state.common.setting.list.addMusicLocationType

export const togglePlayMethod = state => state.common.setting.player.togglePlayMethod

export const downloadFileName = state => state.common.setting.download.fileName


export const sourceNameType = state => state.common.setting.sourceNameType

export const isClickPlayList = state => state.common.setting.list.isClickPlayList

export const isEnableDesktopLyric = state => state.common.setting.desktopLyric.enable
export const isLockDesktopLyric = state => state.common.setting.desktopLyric.isLock
export const themeDesktopLyric = state => state.common.setting.desktopLyric.theme
export const desktopLyricPosition = state => state.common.setting.desktopLyric.position
export const desktopLyricTextPosition = state => state.common.setting.desktopLyric.textPosition
export const desktopLyricStyle = state => state.common.setting.desktopLyric.style
export const desktopLyricWidth = state => state.common.setting.desktopLyric.width
export const desktopLyricMaxLineNum = state => state.common.setting.desktopLyric.maxLineNum

export const timeoutExit = state => state.common.setting.player.timeoutExit
export const timeoutExitPlayed = state => state.common.setting.player.timeoutExitPlayed
export const isShowLyricTranslation = state => state.common.setting.player.isShowLyricTranslation
export const isShowLyricRoma = state => state.common.setting.player.isShowLyricRoma
export const isS2t = state => state.common.setting.player.isS2t

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

export const playerPortraitStyle = state => state.common.setting.player.portrait.style
export const playerLandscapeStyle = state => state.common.setting.player.landscape.style

export const shareType = state => state.common.setting.shareType

export const isShowNotificationImage = state => state.common.setting.player.isShowNotificationImage
