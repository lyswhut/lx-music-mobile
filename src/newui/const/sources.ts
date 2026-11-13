/**
 * 平台展示元信息（文案部分）。
 * label / short 提取自 new_design/data.js 的 SOURCES，键名与项目 LX.OnlineSource 完全一致，
 * 因此可直接用 musicInfo.source 索引；颜色在 theme 的 PLATFORM_TINTS（色值属 token）。
 */
import type { PlatformTintKey } from '@/newui/theme'

export interface PlatformMeta {
  /** 全称，用于「当前音源没有 QQ音乐」这类整句文案 */
  label: string
  /** 简称，用于歌曲行的来源角标 */
  short: string
}

export const PLATFORM_META: Readonly<Record<PlatformTintKey, PlatformMeta>> = {
  tx: { label: 'QQ音乐', short: 'QQ' },
  wy: { label: '网易云', short: '网易' },
  kw: { label: '酷我音乐', short: '酷我' },
  kg: { label: '酷狗音乐', short: '酷狗' },
  mg: { label: '咪咕音乐', short: '咪咕' },
}

/** 本地曲目（LX.Source 里的 'local'）；原型没有这一项，按同样的「说人话」口径补上 */
export const LOCAL_PLATFORM_META: PlatformMeta = { label: '本地音乐', short: '本地' }

/** 五个在线平台的键序（原型 app.js 平台列表顺序按 data.js SOURCES，这里保持对象声明序）；
 * 顶栏状态点「有没有接上任何一个平台」与音源浮层平台组都遍历它 */
export const PLATFORM_SOURCE_KEYS = Object.keys(PLATFORM_META) as LX.OnlineSource[]

/** 取平台文案；遇到未知来源时原样显示，不崩 */
export const getPlatformMeta = (source: LX.Source): PlatformMeta => {
  if (source === 'local') return LOCAL_PLATFORM_META
  return PLATFORM_META[source as PlatformTintKey] ?? { label: source, short: source }
}
