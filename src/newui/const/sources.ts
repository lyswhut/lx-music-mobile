/**
 * 平台展示元信息（中文全称 / 简称）；键名与 LX.OnlineSource 一致，颜色在 theme 的 PLATFORM_TINTS。
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

/** 本地曲目（source='local'） */
export const LOCAL_PLATFORM_META: PlatformMeta = { label: '本地音乐', short: '本地' }

/** 五个在线平台的键序，用于状态点与音源浮层平台组遍历 */
export const PLATFORM_SOURCE_KEYS = Object.keys(PLATFORM_META) as LX.OnlineSource[]

/** 取平台文案；未知来源原样显示，不崩 */
export const getPlatformMeta = (source: LX.Source): PlatformMeta => {
  if (source === 'local') return LOCAL_PLATFORM_META
  return PLATFORM_META[source as PlatformTintKey] ?? { label: source, short: source }
}
