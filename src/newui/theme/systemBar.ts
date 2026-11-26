import type { ThemeScheme } from './types'

/**
 * 深浅底对应的系统栏图标色（深色底配浅色图标）。
 * 独立实现以与旧主题零耦合（系统栏配色属主题职责）。
 */
export const newUiStatusBarStyle = (scheme: ThemeScheme): 'light' | 'dark' =>
  scheme === 'dark' ? 'light' : 'dark'
