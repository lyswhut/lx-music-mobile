import { getData, setData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config'
import { action as playerAction, getter as playerGetter } from '@/store/modules/player'
import { mergeSetting } from '@/config/setting'
import { changeLanguage } from '@/plugins/i18n'
import music from '@/utils/music'
import { getVersionInfo } from '@/utils/version'
import { compareVer } from '@/utils'
// import { setMaxCache } from '@/plugins/player/utils'
import { showVersionModal } from '@/navigation'
import { VERSION_STATUS } from '@/config/constant'
// import { screenUnkeepAwake } from '@/utils/utils'

export const TYPES = {
  updateSetting: null,
  setComponentId: null,
  removeComponentId: null,
  setNavActiveIndex: null,
  setNavScreenName: null,
  setPlayNextMode: null,
  setPrevSelectListId: null,
  setApiSource: null,
  setTheme: null,
  setIsAutoTheme: null,
  setSystemColor: null,
  setSearchSource: null,
  setAgreePact: null,
  setSongList: null,
  setLang: null,
  setPlayerCacheSize: null,
  setIsPlayHighQuality: null,
  setSourceNameType: null,
  setTop: null,
  setIgnoreVersion: null,
  setVersionInfo: null,
  setShareType: null,
  setTimeoutExit: null,
  setIsHandleAudioFocus: null,
  setAddMusicLocationType: null,
  setIsShowLyricTranslation: null,
  setIsEnableSync: null,
  setSyncStatus: null,
  setIsClickPlayList: null,
  setIsShowDesktopLyric: null,
  setIsUseDesktopLyric: null,
  setIsLockDesktopLyric: null,
  setThemeDesktopLyric: null,
  setDesktopLyricPosition: null,
  setDesktopLyricTextPosition: null,
  setDesktopLyricStyle: null,
  setPlayerPortraitStyle: null,
  setPlayerLandscapeStyle: null,
  setIsShowNotificationImage: null,
}
for (const key of Object.keys(TYPES)) {
  TYPES[key] = `common__${key}`
}

const settingKey = storageDataPrefix.setting

export const checkVersion = () => async(dispatch, getState) => {
  let versionInfo
  try {
    const { version, desc, history } = await getVersionInfo()
    versionInfo = {
      version,
      desc,
      history,
    }
  } catch (err) {
    versionInfo = {
      version: '0.0.0',
      desc: null,
      history: [],
    }
  }
  // const versionInfo = {
  //   version: '1.9.0',
  //   desc: '- 更新xxx\n- 修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达',
  //   history: [{ version: '1.8.0', desc: '- 更新xxx22\n- 修复xxx22' }, { version: '1.7.0', desc: '- 更新xxx22\n- 修复xxx22' }],
  // }
  versionInfo.status =
   versionInfo.version == '0.0.0'
     ? VERSION_STATUS.unknown
     : compareVer(process.versions.app, versionInfo.version) < 0
       ? VERSION_STATUS.available
       : VERSION_STATUS.latest

  const { common } = getState()

  if (common.setting.ignoreVersion != versionInfo.version && versionInfo.status == VERSION_STATUS.available) {
    versionInfo.showModal = true
    dispatch(setVersionInfo(versionInfo))
    showVersionModal()
  } else {
    versionInfo.showModal = false
    dispatch(setVersionInfo(versionInfo))
  }
  // console.log(compareVer(process.versions.app, versionInfo.version))
  // console.log(process.versions.app, versionInfo.version)
}

export const setVersionInfo = versionInfo => {
  return {
    type: TYPES.setVersionInfo,
    payload: versionInfo,
  }
}

export const initSetting = () => async(dispatch, getState) => {
  const setting = await getData(settingKey)
  if (!setting) return
  global.globalObj.qualityList = music.supportQuality[setting.apiSource]
  global.globalObj.apiSource = setting.apiSource
  await dispatch(updateSetting(mergeSetting(setting)))
}

export const updateSetting = setting => async(dispatch, getState) => {
  dispatch({
    type: TYPES.updateSetting,
    payload: setting,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setComponentId = data => ({
  type: TYPES.setComponentId,
  payload: data,
})
export const removeComponentId = id => {
  return {
    type: TYPES.removeComponentId,
    payload: id,
  }
}

export const setNavActiveIndex = index => ({
  type: TYPES.setNavActiveIndex,
  payload: index,
})

export const setTimeoutExit = ({ time, isPlayed }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setTimeoutExit,
    payload: { time, isPlayed },
  })
  const state = getState()
  await setData(settingKey, state.common.setting)
}

export const setPrevSelectListId = id => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setPrevSelectListId,
    payload: id,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setPlayNextMode = mode => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setPlayNextMode,
    payload: mode,
  })
  dispatch(playerAction.clearPlayedList())
  const state = getState()
  if (mode == 'random') dispatch(playerAction.addMusicToPlayedList(playerGetter.playMusicInfo(state)))
  await setData(settingKey, state.common.setting)
}

export const setApiSource = id => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setApiSource,
    payload: id,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIgnoreVersion = version => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIgnoreVersion,
    payload: version,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setTheme = id => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setTheme,
    payload: id,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsAutoTheme = enabled => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsAutoTheme,
    payload: enabled,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setSystemColor = color => ({
  type: TYPES.setSystemColor,
  payload: color,
})

export const setLang = id => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setLang,
    payload: id,
  })
  changeLanguage(id)
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setSourceNameType = id => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setSourceNameType,
    payload: id,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setSearchSource = ({ searchSource, tempSearchSource }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setSearchSource,
    payload: { searchSource, tempSearchSource },
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setAgreePact = isAgreePact => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setAgreePact,
    payload: isAgreePact,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setLeaderboard = ({ tabId, source }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setLeaderboard,
    payload: { tabId, source },
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setSongList = ({ sortId, tagInfo, source }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setSongList,
    payload: { sortId, tagInfo, source },
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setTop = ({ tabId, source }) => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setTop,
    payload: { tabId, source },
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setPlayerCacheSize = size => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setPlayerCacheSize,
    payload: size,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
  // setMaxCache(size)
}

export const setIsPlayHighQuality = highQuality => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsPlayHighQuality,
    payload: highQuality,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsHandleAudioFocus = flag => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsHandleAudioFocus,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setAddMusicLocationType = type => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setAddMusicLocationType,
    payload: type,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsShowLyricTranslation = flag => async(dispatch, getState) => {
  dispatch(playerAction.toggleTranslation(flag))
  dispatch({
    type: TYPES.setIsShowLyricTranslation,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsShowDesktopLyric = flag => async(dispatch, getState) => {
  await dispatch(playerAction.toggleDesktopLyric(flag))
  dispatch({
    type: TYPES.setIsShowDesktopLyric,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setIsUseDesktopLyric = flag => async(dispatch, getState) => {
  dispatch(playerAction.setUseDesktopLyric(flag))
  dispatch({
    type: TYPES.setIsUseDesktopLyric,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setIsLockDesktopLyric = flag => async(dispatch, getState) => {
  dispatch(playerAction.toggleDesktopLyricLock(flag))
  dispatch({
    type: TYPES.setIsLockDesktopLyric,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setThemeDesktopLyric = theme => async(dispatch, getState) => {
  dispatch(playerAction.setDesktopLyricTheme(theme))
  dispatch({
    type: TYPES.setThemeDesktopLyric,
    payload: theme,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setIsClickPlayList = flag => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsClickPlayList,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setDesktopLyricStyle = style => async(dispatch, getState) => {
  dispatch(playerAction.setDesktopLyricStyle(style))
  dispatch({
    type: TYPES.setDesktopLyricStyle,
    payload: style,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setDesktopLyricPosition = position => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setDesktopLyricPosition,
    payload: position,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
export const setDesktopLyricTextPosition = position => async(dispatch, getState) => {
  const textPosition = { ...getState().common.setting.desktopLyric.textPosition, ...position }
  dispatch(playerAction.setDesktopLyricTextPosition(textPosition))
  dispatch({
    type: TYPES.setDesktopLyricTextPosition,
    payload: textPosition,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsEnableSync = flag => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsEnableSync,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setSyncStatus = statusInfo => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setSyncStatus,
    payload: statusInfo,
  })
}

export const setPlayerPortraitStyle = style => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setPlayerPortraitStyle,
    payload: style,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setPlayerLandscapeStyle = style => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setPlayerLandscapeStyle,
    payload: style,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setShareType = type => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setShareType,
    payload: type,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}

export const setIsShowNotificationImage = flag => async(dispatch, getState) => {
  dispatch({
    type: TYPES.setIsShowNotificationImage,
    payload: flag,
  })
  const { common } = getState()
  await setData(settingKey, common.setting)
}
