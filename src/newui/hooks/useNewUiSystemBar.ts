import { useEffect, useRef } from 'react'
import { Navigation } from 'react-native-navigation'

import { newUiStatusBarStyle, useTheme, useThemeMode } from '@/newui/theme'

/** 系统栏配色跟随新 UI 主题（启动 options 用深色打底，挂载后 mergeOptions 校正） */
export const useNewUiSystemBar = (componentId: string) => {
  const theme = useTheme()
  const { scheme } = useThemeMode()
  const mountedRef = useRef(false)

  useEffect(() => {
    // 首帧配色已由 setRoot / push 的 options 带上，这次 mergeOptions 会落在转场起步帧，跳过；
    // 之后主题真的切换时再合并。
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    Navigation.mergeOptions(componentId, {
      statusBar: { style: newUiStatusBarStyle(scheme) },
      navigationBar: { backgroundColor: theme.colors.bg },
      layout: { componentBackgroundColor: theme.colors.bg },
    })
  }, [componentId, scheme, theme.colors.bg])
}
