/**
 * 正在播放页 · 播放列表面板（原型件 U80 parts/sheets/queue-sheet.{html,css}；
 * 文案表 QUEUE_TXT，app.js L2247-2264 逐字；渲染 renderQueueSheet L2266；
 * 行内「⋯」定稿 openQueueMore L1581，共享行「下一曲播放」nextRow L1566）的界面文案。
 * 这一屏只有「看这次要播什么 / 指定下一首 / 切过去听」三件事，所以文案也只有这三件事的份：
 * 不分段、不给循环模式各写一句说明（只有随机档多一句），入口钮把条数写在无障碍名上而不是屏内。
 */

export const NEW_UI_SHEET_QUEUE = {
  /** .sheet-title（#psTitle）= QUEUE_TXT.title，app.js L2248 逐字 */
  title: '播放列表',
  /** .sheet-sub（#psSub）唯一一句顶部说明 = QUEUE_TXT.sub，app.js L2250 逐字 */
  sub: (n: number): string => `这次要播的一共 ${n} 首 · 点一行就切过去听`,
  /** 空态（QUEUE_TXT.noSong，app.js L2251 逐字；原型挂在 .empty-tip 位） */
  noSong: '当前没有播放中的歌曲',
  /**
   * 随机档独有的一句（QUEUE_TXT.random，app.js L2253 逐字；挂在列表头顶的 .q-note）。
   * 下一首是切歌那一刻才抽的，这一列的顺序在那一档不作数——其余四档不铺任何说明。
   */
  random: '随机是切歌那一刻才抽的 · 这一列只是可能被抽到的',
  /* ---- 行内「⋯」：非当前行三项，正在出声那行只有「这首从头再放」（openQueueMore L1581） ---- */
  /** 第一项：切过去听这一行（QUEUE_TXT.play，app.js L2255） */
  play: '听这一首',
  /** 第二项：把它排到当前这首之后（QUEUE_TXT.next，app.js L2259；全站只有这一条写法，与歌单详情层同款） */
  next: '下一曲播放',
  /**
   * 第三项·暂存池档（QUEUE_TXT.skip，app.js L2261 逐字）：
   * 这一次播放临时凑出来的一列（试听池 / 新 UI 的播放暂存池），动它只影响这一次播放。
   * 「本机的一张单子」档不复用这一句，走既有的「从「X」移出」（NEW_UI_SHEET_MORE.removeFromList）。
   */
  skip: '这次不播这一首',
  /** 正在出声的那一行独有的一项（QUEUE_TXT.again，app.js L2256 逐字） */
  again: '这首从头再放',
  /* ---- toast（原型点完就关层 + 报一句，逐字照抄） ---- */
  /** 切过去听了（QUEUE_TXT.played，app.js L2256） */
  played: (title: string): string => `已切到「${title}」`,
  /** 从头再放（QUEUE_TXT.againTip，app.js L2257） */
  againTip: (title: string): string => `「${title}」从头再放`,
  /** 排到下一曲了（QUEUE_TXT.nextSet，app.js L2258；与 MORE 那句同句，两处各自留档不互相引用） */
  nextSet: (title: string): string => `已把「${title}」排在当前这首之后`,
  /** 这一首这次不播了（QUEUE_TXT.skipped，app.js L2262 逐字：明说歌单与收藏都不动） */
  skipped: (title: string): string => `「${title}」这次不播了 · 歌单与收藏都不动`,
  /** 取不到地址那一档（真实侧播放核心会 reject，原型 mock 恒可播，补一句如实兜底） */
  playFailed: '这一首没播起来 · 换个音源或换几首',
} as const

/**
 * 工具行第 5 颗「播放列表」的无障碍名（paintQueueBtn，app.js L2289 逐字）：
 * 屏内不加文字、不给选中底色（U60 与另外四颗同一口径），条数只写在 aria-label 上。
 * 没有歌在放时如实说「当前没有播放中的歌曲」，不报一个 0 首的假数。
 */
export const newUiPlayerQueueAria = (count: number | null): string =>
  count == null ? '播放列表 · 当前没有播放中的歌曲' : `播放列表 · 共 ${count} 首`
