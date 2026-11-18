import { PALETTES, newUiStatusBarStyle, type ThemeScheme } from '@/newui/theme'

/**
 * 新 UI 屏幕的 react-native-navigation options：
 * 隐藏系统顶栏，状态栏 / 导航栏画到内容后面，页面背景用新 UI 自己的色板。
 * 启动时无法同步读到用户选择的模式，故先用深色打底，屏幕挂载后再 mergeOptions 校正
 * （见 screens/Main/index.tsx）。
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
