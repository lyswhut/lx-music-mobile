import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'

import type { ThemeMode, ThemeScheme } from './types'

/**
 * 新 UI 主题的「导航侧」共通件：冷启动 await 读取持久化模式后再 setRoot，
 * push 转场用内存快照，避免首帧黑底 / 旧主题闪动。
 */

/** 持久化 key 单一定义 */
export const NEW_UI_THEME_STORAGE_KEY = 'newui.themeMode'

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system'

/** mode → 渲染 scheme：system 时跟随 Appearance，深浅未知回退 dark */
export const resolveScheme = (mode: ThemeMode): ThemeScheme =>
  mode === 'system' ? (Appearance.getColorScheme() === 'light' ? 'light' : 'dark') : mode

/** 出厂缺省档 = ThemeProvider 的 useState('light')，快照初值与之对齐 */
const DEFAULT_SCHEME: ThemeScheme = 'light'
const DEFAULT_MODE: ThemeMode = 'light'

let cachedScheme: ThemeScheme = DEFAULT_SCHEME

/** ThemeProvider 解析出 scheme 后回写快照；push 转场同步读它 */
export const cacheNewUiScheme = (scheme: ThemeScheme) => {
  cachedScheme = scheme
}

export const getCachedNewUiScheme = (): ThemeScheme => cachedScheme

/**
 * 冷启动持久化 mode 快照：setNewUiRoot 读完 AsyncStorage 后写入，
 * ThemeProvider 的 useState 初始值读它使第一帧即落在正确主题；null 表示尚未读过。
 */
let persistedInitialMode: ThemeMode | null = null

/** setNewUiRoot 读完 AsyncStorage 后同步存入；也由 ThemeProvider 的 useEffect 覆盖 */
export const setPersistedInitialMode = (mode: ThemeMode) => {
  persistedInitialMode = mode
}

/** ThemeProvider useState 同步读此值做初始 state */
export const getPersistedInitialMode = (): ThemeMode | null => persistedInitialMode

/** 冷启动读持久化模式并解析成 scheme；读失败/无存值回出厂缺省档（与 ThemeProvider 兜底一致） */
export const readPersistedNewUiScheme = async (): Promise<ThemeScheme> => {
  try {
    const saved = await AsyncStorage.getItem(NEW_UI_THEME_STORAGE_KEY)
    const mode = isThemeMode(saved) ? saved : DEFAULT_MODE
    // 同步存入模块级快照，供 ThemeProvider 同步 useState 初始值读取
    persistedInitialMode = mode
    return resolveScheme(mode)
  } catch {
    // 读失败显式落出厂缺省档，保持与 try 分支一致（persistedInitialMode / cachedScheme 同步对齐）
    persistedInitialMode = DEFAULT_MODE
    return DEFAULT_SCHEME
  }
}
