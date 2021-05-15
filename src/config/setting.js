import { compareVer, objectDeepMerge } from '../utils'
import { defaultSetting, overwriteSetting } from './defaultSetting'
import apiSource from '../utils/music/api-source-info'

export const mergeSetting = setting => {
  const defaultSettingCopy = JSON.parse(JSON.stringify(defaultSetting))
  const overwriteSettingCopy = JSON.parse(JSON.stringify(overwriteSetting))

  if (!setting) {
    setting = defaultSettingCopy
  } else if (compareVer(setting.version, defaultSettingCopy.version) < 0) {
    objectDeepMerge(defaultSettingCopy, setting)
    objectDeepMerge(defaultSettingCopy, overwriteSettingCopy)
    setting = defaultSettingCopy
  }

  if (!apiSource.some(api => api.id === setting.apiSource && !api.disabled)) {
    const api = apiSource.find(api => !api.disabled)
    if (api) setting.apiSource = api.id
  }

  return setting
}

/**
 * 初始化设置
 * @param {*} setting
 */

export const initSetting = () => {
  // const { version: settingVersion, setting: newSetting } = mergeSetting(setting, electronStore_config.get('version'))


  // newSetting.controlBtnPosition = 'right'
  // electronStore_config.set('version', settingVersion)
  // electronStore_config.set('setting', newSetting)
  // return newSetting
  return {
    setting: defaultSetting,
    settingVersion: defaultSetting.version,
  }
}
