/**
 * 原型 sprite 之外的补充图标（手写区）。
 *
 * `icons.ts` 是 `scripts/gen-newui-icons.mjs` 从 new_design/index.html 的 SVG sprite
 * 自动生成的文件、禁止手改；原型里没画过的字形一律落这里，由 Icon.tsx 合并两张表对外暴露。
 * 新增一步：ExtraIconName 加一个名字 + EXTRA_ICON_DATA 加同键的一项（Record 注解会盯着别漏）。
 *
 * 2026-10 图标体系同步：trash / sun / moon / phone 四颗曾被手写于此，原型 sprite 已正式
 * 收录（index.html L33/L41/L51/L52），手写重复项全部删除，以 sprite 生成值为准——
 * 旧 Icon.tsx 合并顺序是「extras 覆盖生成值」，不删会把 sprite 的新画法盖回去。
 * 当前为空表；机制保留，将来 sprite 仍没有的字形再按上述步骤补进来。
 */
import type { IconDef } from './types'

/** 补充图标名（与 icons.ts 的生成名合并成 Icon 组件的可用集） */
export type ExtraIconName = never

export const EXTRA_ICON_DATA: Record<ExtraIconName, IconDef> = {}
