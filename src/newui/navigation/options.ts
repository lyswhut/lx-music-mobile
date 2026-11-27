import { PALETTES, newUiStatusBarStyle, type ThemeScheme } from '@/newui/theme'

/**
 * 新 UI 屏幕的 react-native-navigation options：
 * 隐藏系统顶栏，状态栏 / 导航栏画到内容后面，背景用新 UI 自己的色板。
 */
export const newUiScreenOptions = (scheme: ThemeScheme) => {
  const bg = PALETTES[scheme].bg
  return {
    topBar: {
      visible: false,
      height: 0,
      drawBehind: false,
    },
    statusBar: {
      drawBehind: true,
      visible: true,
      style: newUiStatusBarStyle(scheme),
      backgroundColor: 'transparent',
    },
    navigationBar: {
      backgroundColor: bg,
    },
    layout: {
      componentBackgroundColor: bg,
    },
  }
}
