import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'

import {
  cacheNewUiScheme,
  getPersistedInitialMode,
  isThemeMode,
  NEW_UI_THEME_STORAGE_KEY,
  resolveScheme,
  setPersistedInitialMode,
} from './launchScheme'
import { ThemeContext } from './context'
import { PALETTES } from './tokens'
import type { Theme, ThemeContextValue, ThemeMode, ThemeScheme } from './types'

/**
 * 新 UI 主题提供者：light / dark / system 三档，system 跟随系统实时变化；
 * 缺省 light，选择持久化到 AsyncStorage，切换立即生效。
 */
export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const systemScheme = useColorScheme()
  // 初始值读 launchScheme 已同步好的持久化 mode，避免首帧默认值闪动；未读到则回退 'light'
  const [mode, setModeState] = useState<ThemeMode>(getPersistedInitialMode() ?? 'light')
  // 若用户在异步读取完成前手动切换过，以用户操作为准，避免被旧值覆盖
  const userChangedRef = useRef(false)

  useEffect(() => {
    let alive = true
    void AsyncStorage.getItem(NEW_UI_THEME_STORAGE_KEY)
      .then(saved => {
        if (!alive || userChangedRef.current) return
        if (isThemeMode(saved)) setModeState(saved)
      })
      .catch(() => {
        // 读取失败保持当前缺省模式（light），不影响启动
      })
    return () => {
      alive = false
    }
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    userChangedRef.current = true
    setModeState(next)
    // 同步模块级快照：push 转场的背景色与新屏初始值都读它，运行中切主题后立即跟上
    const nextScheme = resolveScheme(next)
    cacheNewUiScheme(nextScheme)
    setPersistedInitialMode(next)
    void AsyncStorage.setItem(NEW_UI_THEME_STORAGE_KEY, next).catch(() => {
      // 持久化失败不影响本次切换（下次启动回到上一次成功的值）
    })
  }, [])

  // 系统深浅未知（useColorScheme 返回 null）时按 dark 解析
  const scheme: ThemeScheme = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode

  const theme = useMemo<Theme>(() => ({ scheme, colors: PALETTES[scheme] }), [scheme])

  // 把解析结果回写导航侧快照，避免 push 转场先渲染旧主题再校正
  useEffect(() => {
    cacheNewUiScheme(scheme)
  }, [scheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, theme, setMode }),
    [mode, scheme, theme, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
