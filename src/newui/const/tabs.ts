import type { IconName } from '@/newui/components/Icon'

/** 四个页面 Tab 的 key：中央播放圆圈不占页 */
export const NEW_UI_TAB_KEYS = ['playlist', 'rank', 'mine', 'setting'] as const

export type NewUiTabKey = (typeof NEW_UI_TAB_KEYS)[number]

export interface TabDefinition {
  key: NewUiTabKey
  /** 底部文案 */
  label: string
  /** 图标 */
  icon: IconName
}

/**
 * 底部导航顺序与文案；TabBar 在第二项之后插入常驻播放圆圈。
 * `playlist` 内部 key 保留，文案为「首页」，返回落点也按它走。
 */
export const NEW_UI_TABS: readonly TabDefinition[] = [
  { key: 'playlist', label: '首页', icon: 'home' },
  { key: 'rank', label: '排行榜', icon: 'chart' },
  { key: 'mine', label: '我的', icon: 'user' },
  { key: 'setting', label: '设定', icon: 'gear' },
]
