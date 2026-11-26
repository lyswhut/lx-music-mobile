/**
 * 手写补充图标：`icons.ts` 由脚本生成、禁止手改，脚本未收录的字形放这里。
 * 新增时 ExtraIconName 与 EXTRA_ICON_DATA 要同时加同键项；同名键会覆盖生成值。
 */
import type { IconDef } from './types'

/** 补充图标名（电台撤下后手写区恢复为空；与生成名合并为 Icon 的可用集） */
export type ExtraIconName = never

export const EXTRA_ICON_DATA: Record<ExtraIconName, IconDef> = {}
