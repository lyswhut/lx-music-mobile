/**
 * 「已缓存」（离线收听）屏的文案与扫描参数（U86，件 `parts/mine/offline.{html,css}`）。
 * 固定文案逐字取原型 app.js：OFF_EMPTY / OFF_LEDE（L1355-1356）、`共 N 首 · 占用 X MB`
 * 与「播放全部 N 首」（renderOffline L1426-1445）、卡片右半的「N 首 · X MB」（renderMinePage L1300）。
 * 扫描中那句是 RN 侧的过程态（原型清单是同步 mock，真机要枚举本机存储键，得先给一个如实的过程句）。
 * 体积单位（2026-10-22 用户口径）：满 1024 MB 换 G，换算与单位只在 utils/format 一处管，本文件不各自拼单位。
 */
import { formatCacheSize } from '@/newui/utils/format'

export const NEW_UI_OFFLINE = {
  /** 面包屑（原型 index.html L400 那颗 .player-crumb 的静态文字） */
  crumb: '已缓存',
  /** 返回钮无障碍文案（同 PLD_LABELS.back） */
  back: '返回',
  /** 口径句（.off-lede，App L1356 逐字） */
  lede: '你听过的歌里，已经存在这台机器上的这些 · 不联网也能播',
  /** 空态（.empty-tip，App L1355 逐字；卡片右半的空态也用这一句，p 单行省略） */
  empty: '还没有存下的歌 · 连网络听一遍，之后不联网也能播',
  /** 扫描过程句（真机在数本机存储键时如实报一句，不写运行状态） */
  scanning: '正在数这台机器上的歌…',
  /** 屏上计数（.off-n，App L1430：`共 ${n} 首 · 占用 ${mb} MB`，占用是本机缓存总量）
   *  体积单位不写死在这一句里：满 1024 MB 换成 G，换算与单位都由 utils/format 的 formatCacheSize 一处管 */
  count: (n: number, mb: number): string => `共 ${n} 首 · 占用 ${formatCacheSize(mb)}`,
  /** 卡片右半副行（App L1300：`${n} 首 · ${mb} MB`；单位同上） */
  cardCount: (n: number, mb: number): string => `${n} 首 · ${formatCacheSize(mb)}`,
  /** 「播放全部」（App L1436：`播放全部 ${n} 首`） */
  playAll: (n: number): string => `播放全部 ${n} 首`,
} as const

/**
 * 本机缓存扫描的调度参数（RN 侧实现参数，原型没有对应物）：
 * - concurrency：逐首验字节（isCached）的并发上限，别一次把几百次原生缓存查询压进队列；
 * - ttlMs：「我的」页与「已缓存」屏前后脚挂载时复用同一份扫描结果的时间窗。
 */
export const NEW_UI_OFFLINE_SCAN = {
  concurrency: 6,
  ttlMs: 15_000,
} as const
