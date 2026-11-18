import type { ThemeScheme } from './types'

/**
 * 深浅底对应的系统栏图标色（深色底配浅色图标）。
 * 逻辑与旧 @/navigation/utils 的 getStatusBarStyle 相同，但那里会连带引入旧主题 state，
 * 新 UI 要求与旧主题零耦合，故在此独立实现，归入主题模块（系统栏配色属于主题职责）。
 */
export const newUiStatusBarStyle = (scheme: ThemeScheme): 'light' | 'dark' =>
  scheme === 'dark' ? 'light' : 'dark'
