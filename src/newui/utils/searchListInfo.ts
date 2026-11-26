/**
 * 搜索结果里的歌单条目 → 歌单详情层期望的 ListInfoItem 形状（纯函数）。
 * 搜索条目的字段形状与歌单目录不一致（id 可能是 number、author 可能缺失），
 * 只放行能确证的坐标，字符串字段缺失落空串，坐标可疑返回 null。
 */
import type { ListInfoItem } from '@/store/songlist/state'

import { PLATFORM_SOURCE_KEYS } from '@/newui/const'

const toTrimmedString = (value: unknown): string =>
  value == null ? '' : typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''

/** 未知平台键 / 空 id 一律视为「这份打不开」；返回的对象可直接作 passProps */
export const normalizeSearchListInfoItem = (
  item: ListInfoItem | null | undefined,
): ListInfoItem | null => {
  if (item == null) return null

  const id = toTrimmedString(item.id)
  if (id === '') return null
  // 缺 source 或不在已知平台里就不进详情
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
