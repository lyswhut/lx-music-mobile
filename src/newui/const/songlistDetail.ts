/**
 * 歌单详情层文案常量；标题 / 页脚 / 空态按「归属 owner」取，kind 只管取数链路与按钮能力。
 */
import { getPlatformMeta } from './sources'

/** 详情层形态：歌单 / 排行榜 / 自建歌单 / 本地歌单 / 内置「我喜欢」 */
export type NewUiSonglistDetailKind = 'pl' | 'rank' | 'mine' | 'local' | 'fav'

/** 固定按钮 / 无障碍文案 */
export const NEW_UI_PLD_LABELS = {
  playAll: '播放全部',
  shuffle: '随机播放',
  /** 心钮四态文案：歌单与榜单语义不同，榜单收的是整榜 */
  fav: '将这份歌单存进我的歌单',
  unfav: '已存进我的歌单 · 再点移出',
  favBoard: '将整张榜的歌曲存进我的歌单',
  unfavBoard: '整张榜已存好 · 再点移出',
  back: '返回',
  /** 本地歌单形态右上角的「删除本歌单」钮（不可删的系统列表不出现） */
  deleteList: '删除本歌单',
} as const

/**
 * 删除本地歌单的二次确认文案：如实说清连带删掉歌目记录，曲库与文件本身不受影响。
 */
export const NEW_UI_PLD_DELETE_CONFIRM = {
  title: (name: string): string => `要删掉「${name}」吗`,
  body: '删除后，这份歌单与它列出的歌目记录会一并从这台设备移除 · 歌曲文件本身不受影响，其它端的收藏也不受影响。',
  confirmText: '删除歌单',
} as const

/**
 * 榜单「存整榜」落库时 sourceListId 的前缀（`board__` + 榜单 id）；再进详情层要剥掉前缀并按 rank 形态打开。
 */
export const NEW_UI_BOARD_LIST_ID_PREFIX = 'board__'

/**
 * 平台取歌超时上限：音源脚本 / 网络异常时 Promise 可能永不 settle，到限推到 error 分支给重试入口。
 */
export const NEW_UI_PLD_LOAD_TIMEOUT_MS = 30_000

/** 详情头图胶囊：只报总曲目数「m 首」 */
export const newUiPlayableTag = (total: number): string => `${total} 首`

/** 首批曲目还没取回时的 hero 胶囊文案：不虚报计数，只说明正在数 */
export const NEW_UI_PLD_TAG_PENDING = '正在数有几首 · 稍等'

/** 内置「我喜欢」空收藏时的 hero 胶囊 */
export const NEW_UI_PLD_TAG_EMPTY_FAV = '还没有收藏'

/**
 * 空态文案：「歌单是空的」按对象分开说 —— 本地空单子给出加歌路径、平台单如实请换一份、
 * 内置「我喜欢」说清去哪收；localError 是读取失败，与空态分开。
 */
export const NEW_UI_PLD_EMPTY = {
  error: '这份歌单暂时取不到内容 · 网络或音源不稳定，稍后再试',
  localError: '这份歌单暂时打不开 · 稍后再试',
  localEmpty: '这份歌单还是空的 · 在歌曲右侧的「⋯」里加入',
  end: '这份歌单还是空的 · 换一份听听',
  fav: '还没有收藏 · 点歌曲右侧的爱心，收进来的都会留在这里',
} as const

/** 列表底部状态行（分页加载 / 到底 / 下一页失败） */
export const NEW_UI_PLD_STATUS = {
  loading: '正在载入下一批…',
  loadMoreError: '这一批没有载入 · 点击重试',
} as const

/** 动作反馈 toast */
export const NEW_UI_PLD_TOAST = {
  playAllEmpty: '这里暂时没有可播的歌曲 · 换个音源或稍后再试',
  /** 点不可播行（label 为平台全名） */
  unplayable: (label: string): string => `当前音源不支持${label} · 换一首或换个音源`,
  /** 收藏真 toggle：四步都要点下有感 */
  favSaving: '正在存进我的歌单…',
  boardSaving: '正在收录整张榜的歌曲 · 榜单较长，请稍候',
  favRemoved: '已移出我的歌单',
  favFailed: '没弄成 · 网络或音源不稳，稍后再试',
  listDeleted: (name: string): string => `已删除「${name}」· 我的歌单已更新`,
  listDeleteFailed: '没删掉 · 存储写入不顺，稍后再试',
} as const

/* ================= 归属（owner）：详情层顶上那一行到底该叫什么 =================
 * 同一张单子从哪进来都只认单子本身：own 可加可移可删；collected 平台收藏只读；
 * platform 平台单未收；rank 排行榜；fav 内置「我喜欢」不可改名不可删。
 */

/** 归属的五个取值 */
export type NewUiPlaylistOwner = 'own' | 'collected' | 'platform' | 'rank' | 'fav'

/** 归属标题 */
export const NEW_UI_PLD_OWNER_LABEL: Record<NewUiPlaylistOwner, string> = {
  own: '自建歌单',
  collected: '收藏歌单',
  platform: '歌单',
  rank: '排行榜',
  fav: '我喜欢',
}

/** 面包屑 = 归属标题；收藏单补平台全名，其余不补 */
export const newUiPlCrumb = (owner: NewUiPlaylistOwner, source?: LX.Source): string =>
  owner === 'collected' && source != null
    ? `${NEW_UI_PLD_OWNER_LABEL.collected} · ${getPlatformMeta(source).label}`
    : NEW_UI_PLD_OWNER_LABEL[owner]

/** 空态按归属取 */
export const NEW_UI_PLD_EMPTY_BY_OWNER: Record<NewUiPlaylistOwner, string> = {
  own: NEW_UI_PLD_EMPTY.localEmpty,
  collected: NEW_UI_PLD_EMPTY.end,
  platform: NEW_UI_PLD_EMPTY.end,
  rank: NEW_UI_PLD_EMPTY.end,
  fav: NEW_UI_PLD_EMPTY.fav,
}
