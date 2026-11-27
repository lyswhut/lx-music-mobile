import { createContext } from 'react'

import type { ThemeContextValue } from './types'

/** 新 UI 主题上下文；null 表示未挂载 ThemeProvider（由 hooks 抛错兜底） */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
