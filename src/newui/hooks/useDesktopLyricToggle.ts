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
  /** 开关回显（真相 = 设置键 desktopLyric.enable，与旧 UI 同一开关） */
  enabled: boolean
  /** 播放页工具行 #btnFloat 按下 */
  toggle: () => void
  /** 悬浮窗权限未授予时的引导层显隐（载体 = 共通件 ConfirmSheet，由调用方挂在屏内） */
  askPermission: boolean
  /** 引导层右键：走旧 UI 既有授权流程的落点（跳系统「显示悬浮窗口」授权界面） */
  onPermissionConfirm: () => void
  /** 引导层收层（左键 / 遮罩 / 返回键，旧 UI 那两枚键在 ConfirmSheet 里本就同一回调） */
  onPermissionDismiss: () => void
}

/**
 * 「LRC 浮窗」开关（播放页工具行 .pt-btn #btnFloat）。
 * 本项目的歌词浮窗是**系统级悬浮窗**（原生模块 lyricDesktop，窗口宿主在 App 之外、
 * 能盖在其它应用之上），不是 RN 层浮层，因此接线复用旧 UI 既有的一整套：
 * 开 = checkDesktopLyricOverlayPermission() → showDesktopLyric()，
 * 关 = hideDesktopLyric()；状态真相是设置键 `desktopLyric.enable`（与旧 UI 同一个开关，
 * 桌面歌词的逐行推送、位置记忆、样式项都由 core/desktopLyric 与 core/init/player/lyric 承担，
 * 新 UI 不另写一套）。
 * 授权引导（阶段 3 换线时补齐，对齐旧 UI components/DesktopLyricEnable 的两步之分）：
 * 无权限 → 弹共通件 ConfirmSheet 征求 → 同意则 openDesktopLyricOverlayPermissionActivity()
 * 跳系统授权界面；不同意就保持关。旧 UI 那层载体是旧主题 ConfirmAlert（新 UI 禁止复用旧组件/
 * 旧主题），故这里换成本层的 ConfirmSheet 承载，**授权动作本身仍是旧 UI 那两条既有 core 函数**。
 * QA 2026-10-14 D-01（P0）修复（换线后依旧成立）：
 * ① 未在播任何曲目时窗口没有可见内容，不开开关不报成功，文案是如实的「先在放一首歌」；
 * ② 删除「进入播放页自动隐藏」假承诺——系统悬浮窗的可见处在 App 外，开启文案改「回到桌面查看」。
 */
export const useDesktopLyricToggle = (): DesktopLyricToggle => {
  const enabled = useSettingValue('desktopLyric.enable')
  const musicInfo = usePlayerMusicInfo()
  const busyRef = useRef(false)
  const [askPermission, setAskPermission] = useState(false)

  const toggle = useCallback(() => {
    if (busyRef.current) return
    if (!enabled && musicInfo.id == null) {
      // 没有在播曲目：浮窗无内容可显，不得声称「已开启」（D-01 最低标准）
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
          // 权限没给：开关回原位，并弹出「去授予」引导（旧 UI 同款两步）
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
    // 旧 UI 的「同意并前往」= openDesktopLyricOverlayPermissionActivity（core/desktopLyric 再导出的
    // 原生桥），授权完成后回 App 再点一次浮窗钮即为系统悬浮窗
    void openDesktopLyricOverlayPermissionActivity()
  }, [])

  const onPermissionDismiss = useCallback(() => {
    setAskPermission(false)
  }, [])

  return { enabled, toggle, askPermission, onPermissionConfirm, onPermissionDismiss }
}

