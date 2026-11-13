import { useEffect } from 'react'
import { Navigation } from 'react-native-navigation'

import { newUiStatusBarStyle, useTheme, useThemeMode } from '@/newui/theme'

/**
 * 系统栏配色跟随新 UI 主题（启动 options 用深色打底，屏幕挂载后 mergeOptions 校正）。
 * MainScreen 与播放页共用；从 MainScreen 原样抽出，行为不变。
 */
export const useNewUiSystemBar = (componentId: string) => {
  const theme = useTheme()
  const { scheme } = useThemeMode()

  useEffect(() => {
    Navigation.mergeOptions(componentId, {
      statusBar: { style: newUiStatusBarStyle(scheme) },
      navigationBar: { backgroundColor: theme.colors.bg },
      layout: { componentBackgroundColor: theme.colors.bg },
    })
  }, [componentId, scheme, theme.colors.bg])
}
