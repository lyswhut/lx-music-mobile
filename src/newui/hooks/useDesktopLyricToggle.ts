import { useCallback, useRef, useState } from 'react'

import {
  checkDesktopLyricOverlayPermission,
  hideDesktopLyric,
  openDesktopLyricOverlayPermissionActivity,
  showDesktopLyric,
} from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { NEW_UI_PLAYER_LRC_TOAST } from '@/newui/const'
import { showNewUiToast } from '@/newui/utils'

export interface DesktopLyricToggle {
  /** 开关回显（真相 = 设置键 desktopLyric.enable） */
  enabled: boolean
  /** 播放页工具行开关按钮 */
  toggle: () => void
  /** 悬浮窗权限未授予时的引导层显隐（载体 = ConfirmSheet，由调用方挂在屏内） */
  askPermission: boolean
  /** 引导层确认：跳系统「显示悬浮窗口」授权界面 */
  onPermissionConfirm: () => void
  /** 引导层收起 */
  onPermissionDismiss: () => void
}

/**
 * 「LRC 浮窗」开关：歌词浮窗是系统级悬浮窗（原生模块 lyricDesktop，宿主在 App 之外），
 * 开 = 检查权限后 showDesktopLyric()，关 = hideDesktopLyric()，状态真相是 desktopLyric.enable。
 * 无权限时弹 ConfirmSheet 引导，同意则跳系统授权界面。
 * 未在播任何曲目时窗口无可见内容，不声称已开启；可见处在 App 外，文案是「回到桌面查看」。
 */
export const useDesktopLyricToggle = (): DesktopLyricToggle => {
  const enabled = useSettingValue('desktopLyric.enable')
  const musicInfo = usePlayerMusicInfo()
  const busyRef = useRef(false)
  const [askPermission, setAskPermission] = useState(false)

  const toggle = useCallback(() => {
    if (busyRef.current) return
    if (!enabled && musicInfo.id == null) {
      // 没有在播曲目：浮窗无内容可显，不得声称「已开启」
      showNewUiToast(NEW_UI_PLAYER_LRC_TOAST.noSong)
      return
    }
    busyRef.current = true
    const next = !enabled
    if (next) {
      void (async () => {
        try {
          await checkDesktopLyricOverlayPermission()
          await showDesktopLyric()
          updateSetting({ 'desktopLyric.enable': true })
          showNewUiToast(NEW_UI_PLAYER_LRC_TOAST.on)
        } catch {
          // 权限没给：开关回原位并弹「去授予」引导
          updateSetting({ 'desktopLyric.enable': false })
          showNewUiToast(NEW_UI_PLAYER_LRC_TOAST.needPermission, 'long')
          setAskPermission(true)
        }
      })().finally(() => {
        busyRef.current = false
      })
    } else {
      void (async () => {
        try {
          await hideDesktopLyric()
        } finally {
          updateSetting({ 'desktopLyric.enable': false })
          showNewUiToast(NEW_UI_PLAYER_LRC_TOAST.off)
          busyRef.current = false
        }
      })()
    }
  }, [enabled, musicInfo.id])

  const onPermissionConfirm = useCallback(() => {
    setAskPermission(false)
    // 跳系统授权界面；授权完成后回 App 再点一次浮窗钮
    void openDesktopLyricOverlayPermissionActivity()
  }, [])

  const onPermissionDismiss = useCallback(() => {
    setAskPermission(false)
  }, [])

  return { enabled, toggle, askPermission, onPermissionConfirm, onPermissionDismiss }
}

