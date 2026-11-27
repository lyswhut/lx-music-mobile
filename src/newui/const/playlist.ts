/**
 * 歌单页固定文案常量；随数据变化的字符串在页面里拼接。
 */

/** 各区块标题 */
export const NEW_UI_PLAYLIST_TITLES = {
  mine: '我的歌单',
  pool: '推荐歌单',
  /** 全部分类浮窗标题 */
  allTags: '全部分类',
  allTagsChip: '全部',
} as const

/**
 * 「全部分类」浮层文案：真实侧全量目录按平台分组展示，首位「推荐」单列在「不挑分类」一行下。
 */
export const NEW_UI_PLAYLIST_TAG_SHEET = {
  sub: '当前平台的全部分类 · 选一个，下面的推荐歌单就换成这一类。',
  /** 首位入口文案「推荐」：不作口语化改写 */
  rec: '推荐',
  /** 首位入口单列一行的组名 */
  recGroup: '不挑分类',
  loading: '正在从平台获取分类…',
  empty: '这个平台暂时取不到分类 · 稍后再试',
} as const

/** 「我的歌单」右侧动作 */
export const NEW_UI_PLAYLIST_MANAGE = '管理'

/** 空态 / 加载态文案 */
export const NEW_UI_PLAYLIST_EMPTY = {
  pool: '这个分类下暂时没有推荐 · 换一个分类试试',
  mine: '还没有自建歌单 · 听到喜欢的先收藏进来',
  loading: '正在从平台取歌单 · 稍等',
  /** 首批没取到时的整页空态；追加批失败走网格末尾重试行 */
  poolFailed: '这一类歌单暂时没取到 · 换个分类或稍后再试',
} as const

/** 网格末尾分页状态行文案（与排行榜页同一组件） */
export const NEW_UI_PLAYLIST_STATUS = {
  loading: '正在载入下一批…',
  retry: '这一批没有载入 · 点击重试',
} as const

/** 池子标题右侧计数：total 为 null 表示平台没给可信总数，只报已列出条数，不摆假 M。 */
export const plPoolCountLabel = (shown: number, total: number | null): string =>
  total == null
    ? `已列出 ${shown} 个`
    : shown < total
      ? `已列出 ${shown} / ${total} 个`
      : `${total} 个`

/**
 * SDK 写死的占位总数（mg 99999、kw 1000）；命中即按「平台没给总数」处理，计数降级只报已列出。
 */
export const NEW_UI_POOL_PLACEHOLDER_TOTALS: ReadonlySet<number> = new Set([99999, 1000])

/**
 * 「我的歌单」平台真封面的取数节流：真图只能从明细接口取（整页歌曲量级），需限速与退避重试。
 */
export const NEW_UI_PLAYLIST_COVER = {
  concurrency: 3,
  retryMs: 60_000,
} as const

/** 封面种子前缀 */
export const NEW_UI_PLAYLIST_ART_SEED = {
  mine: 'mypl',
  pool: 'playlist',
} as const
