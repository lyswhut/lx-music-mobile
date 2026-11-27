/**
 * 手写补充图标：`icons.ts` 由脚本生成、禁止手改，脚本未收录的字形放这里。
 * 新增时 ExtraIconName 与 EXTRA_ICON_DATA 要同时加同键项；同名键会覆盖生成值。
 */
import type { IconDef } from './types'

/** 补充图标名（与生成名合并为 Icon 的可用集） */
export type ExtraIconName = 'refresh'

export const EXTRA_ICON_DATA: Record<ExtraIconName, IconDef> = {
  refresh: {
    viewBox: '0 0 24 24',
    nodes: [
      { type: 'path', props: { d: 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } },
    ],
  },
}
