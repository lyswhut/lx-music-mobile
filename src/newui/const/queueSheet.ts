/**
 * 正在播放页 · 播放列表面板文案：只覆盖「看这次要播什么 / 指定下一首 / 切过去听」三件事。
 */

export const NEW_UI_SHEET_QUEUE = {
  title: '播放列表',
  sub: (n: number): string => `这次要播的一共 ${n} 首 · 点一行就切过去听`,
  noSong: '当前没有播放中的歌曲',
  /** 随机档独有的一句：下一首切歌时才抽，这一列顺序不作数 */
  random: '随机是切歌那一刻才抽的 · 这一列只是可能被抽到的',
  /* ---- 行内「⋯」：非当前行三项，正在出声那行只有「这首从头再放」 ---- */
  play: '听这一首',
  next: '下一曲播放',
  /** 暂存池档第三项：只影响这一次播放 */
  skip: '这次不播这一首',
  again: '这首从头再放',
  /* ---- toast ---- */
  played: (title: string): string => `已切到「${title}」`,
  againTip: (title: string): string => `「${title}」从头再放`,
  nextSet: (title: string): string => `已把「${title}」排在当前这首之后`,
  skipped: (title: string): string => `「${title}」这次不播了 · 歌单与收藏都不动`,
  /** 取不到地址时的兜底提示 */
  playFailed: '这一首没播起来 · 换个音源或换几首',
} as const

/** 工具行「播放列表」钮的无障碍名：条数只写在 aria 上，不报 0 首假数 */
export const newUiPlayerQueueAria = (count: number | null): string =>
  count == null ? '播放列表 · 当前没有播放中的歌曲' : `播放列表 · 共 ${count} 首`
