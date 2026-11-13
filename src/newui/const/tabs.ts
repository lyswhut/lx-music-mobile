import type { IconName } from '@/newui/components/Icon'

/** 五个 Tab 的 key，对齐原型 app.js 的 PAGES / data-tab */
export const NEW_UI_TAB_KEYS = ['home', 'playlist', 'rank', 'mine', 'setting'] as const

export type NewUiTabKey = (typeof NEW_UI_TAB_KEYS)[number]

export interface TabDefinition {
  key: NewUiTabKey
  /** 底部文案（原型 .tab span） */
  label: string
  /** 图标（原型 .tab .ic：i-home / i-list / i-chart / i-user / i-gear） */
  icon: IconName
}

/** 提取自 new_design/index.html L281-285 的底部导航顺序与文案 */
export const NEW_UI_TABS: readonly TabDefinition[] = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'playlist', label: '歌单', icon: 'list' },
  { key: 'rank', label: '排行榜', icon: 'chart' },
  { key: 'mine', label: '我的', icon: 'user' },
  { key: 'setting', label: '设定', icon: 'gear' },
]
