/**
 * 播放页子浮层（定时 / 评论）的界面文案与控件定义。
 */

/* ---- 定时停止 ---- */

/** 定时档位（分钟，0 = 不开启） */
export const SLEEP_OPTIONS = [0, 10, 20, 30, 45, 60, 90] as const

export const NEW_UI_SHEET_TIMER = {
  title: '定时停止播放',
  /** 未开启时的副标题：到点只暂停、进度保留 */
  sub: '到点只暂停播放 · 进度保留，可随时继续',
  /** 开启态副标题：逐秒回写剩余时间 */
  subOn: (mmss: string): string => `还剩 ${mmss}。到点只会停下播放，不清空进度。`,
  playedLabel: '等当前这首放完再停',
  note: '若想听完当前这首再停，可将循环模式切到「单曲循环」。',
  optionLabel: (minute: number): string => (minute === 0 ? '不开启' : `${minute} 分钟`),
  toastOn: (minute: number): string => `将在 ${minute} 分钟后停止播放`,
  toastOff: '已取消定时停止',
} as const

/* ---- 评论 ---- */

export const NEW_UI_SHEET_COMMENT = {
  title: '评论',
  sub: '评论与热度来自各平台 · 与歌曲能否播放无关',
  sortTag: '热度排序',
  loading: '正在载入评论…',
  error: '评论载入失败 · 稍后再试',
  empty: '这首歌暂时没有热门评论',
  /** 分页状态行 */
  moreLoading: '正在载入更多评论…',
  moreEnd: '热门评论到此为止',
  moreError: '后续评论载入失败 · 点击重试',
  noSong: '当前没有播放中的歌曲',
  localSong: '本地歌曲没有平台评论可看',
  /** 第 2 级及更深回复的「回复 @某人」前缀，作层级线索 */
  replyToText: (parentName: string): string => `回复 @${parentName} `,
} as const
