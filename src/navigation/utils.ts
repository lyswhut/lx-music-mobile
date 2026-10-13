/**
 * overlay / 返回 等导航工具(保持原导出签名,内部改用 navigationRef)。
 */
import { navigate, goBack, popToTop } from './navigationRef'
import {
  VERSION_MODAL,
  PACT_MODAL,
  SYNC_MODE_MODAL,
} from './screenNames'

export const getStatusBarStyle = (isDark: boolean) => isDark ? 'light' : 'dark'

export const dismissOverlay = async(_compId?: string) => { goBack() }

export const pop = async(_compId?: string) => { goBack() }
export const popToRoot = async(_compId?: string) => { popToTop() }
export const popTo = async(_compId?: string) => { goBack() }

export const showPactModal = () => { navigate(PACT_MODAL) }
export const showVersionModal = () => { navigate(VERSION_MODAL) }
export const showSyncModeModal = () => { navigate(SYNC_MODE_MODAL) }
