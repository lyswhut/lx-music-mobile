/**
 * 搜索结果里的歌单条目 → 歌单详情层期望的 ListInfoItem 形状（纯函数，便于复核）。
 *
 * 背景（2026-10-12 清单第 6 条：搜索浮窗点歌单结果崩溃）：
 * `@/store/search/songlist/state` 的类型是 `Omit<ListInfo, 'source' | 'maxPage'>`，
 * 'all' 合并视图直接把各平台 SDK search() 的原始条目塞进同一列表——这些条目的字段
 * 形状由平台各自的 filter 决定，与歌单目录 getList() 的条目并不严格一致：
 * - `id`：kw / mg 的 search 直接把接口原值放进 id（kw 走 `objStr2JSON` 文本解析、
 *   mg 走 `item.id`），运行时可能是 number；目录侧则一律是带路由前缀或 String() 过的字符串
 *   （kw 目录 `digest-{d}__{id}`、tx `String(item.dissid)`、wy `String(item.id)`）；
 * - `author`：mg 的 search filter（filterSongListResult）**没有 desc 键**、author 取
 *   `item.userName`（字段缺失即 undefined）；目录侧 author 恒被赋字符串；
 * - `desc / play_count / total / img`：各平台 search 条目缺键情况不一（类型上全是可选，
 *   运行时无保证）。
 * 详情页挂载取回第一页后 `setHeaderInfo({ ..., author: merged.info.author || info.author })`
 * ——author 是五个字段里唯一没有末位 `''` 兜底的一个；平台明细接口没报作者、且 passProps
 * 的 author 是 undefined 时（正是搜索条目的形状），undefined 一路传进
 * `PlaylistHero` 的 `sub.length`，渲染期 TypeError 无人捕获 → 红屏/闪退。
 * 目录条目的 author 恒为字符串（哪怕空串），所以只有搜索路径炸。
 *
 * 本函数只做**如实归一**：能确证的坐标（source ∈ 已知平台、id 非空）才放行，
 * 字符串字段缺失就落空串，绝不伪造「看着像真数据」的字段；坐标可疑的条目返回 null，
 * 由调用方（搜索层）给出面向用户的提示，不把死链接进详情页。
 */
import type { ListInfoItem } from '@/store/songlist/state'

import { PLATFORM_SOURCE_KEYS } from '@/newui/const'

const toTrimmedString = (value: unknown): string =>
  value == null ? '' : typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''

/** 未知平台键 / 空 id 一律视为「这份打不开」；返回的对象可直接作 passProps（全可序列化） */
export const normalizeSearchListInfoItem = (
  item: ListInfoItem | null | undefined,
): ListInfoItem | null => {
  if (item == null) return null

  const id = toTrimmedString(item.id)
  if (id === '') return null
  // 'all' 合并视图理论上由平台 filter 逐条填 source；缺了或不在已知平台里就不进详情
  if (!PLATFORM_SOURCE_KEYS.includes(item.source)) return null

  const img = typeof item.img === 'string' && item.img !== '' ? item.img : undefined

  return {
    id,
    source: item.source,
    name: toTrimmedString(item.name),
    author: toTrimmedString(item.author),
    desc: toTrimmedString(item.desc),
    play_count: toTrimmedString(item.play_count),
    total: toTrimmedString(item.total),
    ...(img != null ? { img } : {}),
  }
}
