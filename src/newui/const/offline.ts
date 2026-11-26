/**
 * 「已缓存」（离线收听）屏文案与扫描参数；体积单位统一由 utils/format 的 formatCacheSize 管。
 */
import { formatCacheSize } from '@/newui/utils/format'

export const NEW_UI_OFFLINE = {
  crumb: '已缓存',
  back: '返回',
  lede: '你听过的歌里，已经存在这台机器上的这些 · 不联网也能播',
  empty: '还没有存下的歌 · 连网络听一遍，之后不联网也能播',
  /** 扫描过程句 */
  scanning: '正在数这台机器上的歌…',
  /** 屏上计数（本机缓存总量） */
  count: (n: number, mb: number): string => `共 ${n} 首 · 占用 ${formatCacheSize(mb)}`,
  cardCount: (n: number, mb: number): string => `${n} 首 · ${formatCacheSize(mb)}`,
  playAll: (n: number): string => `播放全部 ${n} 首`,
} as const

/** 本机缓存扫描的调度参数 */
export const NEW_UI_OFFLINE_SCAN = {
  /** 逐首验字节的并发上限 */
  concurrency: 6,
  /** 「我的」页与「已缓存」屏复用扫描结果的时间窗 */
  ttlMs: 15_000,
} as const
