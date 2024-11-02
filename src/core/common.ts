import { hideDesktopLyric } from './desktopLyric'
import { exitApp as utilExitApp } from '@/utils/nativeModules/utils'
import { destroy as destroyPlayer } from '@/plugins/player/utils'
import { initSetting as initAppSetting } from '@/config/setting'
import { setLanguage as applyLanguage } from '@/lang/i18n'

import settingActions from '@/store/setting/action'
import settingState from '@/store/setting/state'
import commonActions from '@/store/common/action'
import commonState, { type InitState as CommonStateType } from '@/store/common/state'

import { storageDataPrefix } from '@/config/constant'
import { saveData } from '@/plugins/storage'
import { throttle } from '@/utils/common'
import { getSelectedManagedFolder, saveFontSize, saveViewPrevState, setSelectedManagedFolder } from '@/utils/data'
import { showPactModal as handleShowPactModal } from '@/navigation'
import { hideDesktopLyricView } from '@/utils/nativeModules/lyricDesktop'
import { getPersistedUriList, selectManagedFolder } from '@/utils/fs'


const throttleSaveSetting = throttle(() => {
  void saveData(storageDataPrefix.setting, settingState.setting)
})

/**
 * 初始化设置
 */
export const initSetting = async() => {
  const setting = (await initAppSetting()).setting
  settingActions.updateSetting(setting)
  return setting
}

/**
 * 更新设置
 * @param setting 新设置
 */
export const updateSetting = (setting: Partial<LX.AppSetting>) => {
  settingActions.updateSetting(setting)
  throttleSaveSetting()
}

export const setLanguage = (locale: Parameters<typeof applyLanguage>[0]) => {
  updateSetting({ 'common.langId': locale })
  global.state_event.languageChanged(locale)
  requestAnimationFrame(() => {
    applyLanguage(locale)
  })
}


let isDestroying = false
export const exitApp = (reason: string) => {
  console.log('Handle Exit App, Reason: ' + reason)
  if (isDestroying) return
  isDestroying = true
  void Promise.all([
    hideDesktopLyric(),
    destroyPlayer(),
    hideDesktopLyricView(),
  ]).finally(() => {
    isDestroying = false
    utilExitApp()
  })
}

export const setFontSize = (size: number) => {
  commonActions.setFontSize(size)
  void saveFontSize(size)
}

export const setStatusbarHeight = (size: number) => {
  commonActions.setStatusbarHeight(size)
}

export const setComponentId = (name: keyof CommonStateType['componentIds'], id: string) => {
  commonActions.setComponentId(name, id)
}
export const removeComponentId = (name: string) => {
  commonActions.removeComponentId(name)
}

export const setNavActiveId = (id: Parameters<typeof commonActions.setNavActiveId>['0']) => {
  if (id == commonState.navActiveId) return
  commonActions.setNavActiveId(id)
  if (id != 'nav_setting') {
    commonActions.setLastNavActiveId(id)
    saveViewPrevState({ id })
  }
}

export const showPactModal = () => {
  handleShowPactModal()
}

export const checkStoragePermissions = async() => {
  const selectedManagedFolder = await getSelectedManagedFolder()
  if (selectedManagedFolder) return (await getPersistedUriList()).some(uri => selectedManagedFolder.startsWith(uri))
  return false
}

export const requestStoragePermission = async() => {
  const isGranted = await checkStoragePermissions()
  if (isGranted) return isGranted

  const uri = await selectManagedFolder()
  if (!uri.isDirectory) return false
  await setSelectedManagedFolder(uri.path)
  return true
}

export const setBgPic = (pic: string | null) => {
  commonActions.setBgPic(pic)
}
