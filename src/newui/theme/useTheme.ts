import { useContext } from 'react'

import { ThemeContext } from './context'
import type { Theme, ThemeContextValue } from './types'

const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (context == null) {
    throw new Error('useTheme / useThemeMode 必须在 <ThemeProvider>（@/newui/theme）内使用')
  }
  return context
}

/** 读取当前生效主题（色板随 scheme 切换而更新） */
export const useTheme = (): Theme => useThemeContext().theme

/** 读取 / 切换主题模式：mode（用户选择）、scheme（解析结果）、setMode（自动持久化） */
export const useThemeMode = (): Pick<ThemeContextValue, 'mode' | 'scheme' | 'setMode'> => {
  const { mode, scheme, setMode } = useThemeContext()
  return { mode, scheme, setMode }
}
