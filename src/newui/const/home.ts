import type { QuickEntry } from '@/newui/components'

/**
 * 首页文案与静态条目（对应原型 #page-home 与 data.js 的 QUICK）。
 * 原型里的 BANNERS / DAILY / PLAYLISTS / RANK_TABS 都是 mock，一律不搬；
 * 这里只放「不依赖数据」的标题、动作文案。
 * （原 data.js RADIO 卡表与「随手听」区块随原型 U33 退役一并撤掉——首页电台入口只剩快捷那一格，
 * 落点是 RadioHomeScreen，见 navigation/entry.ts `pushNewUiRadioHome`。）
 */

/** 各区块标题（.section-title / .section-sub） */
export const NEW_UI_HOME_TITLES = {
  recent: '继续收听',
  daily: '每日推荐',
  playlists: '推荐歌单',
  songs: '热门单曲',
  artists: '热门歌手',
} as const

/** 各区块右侧动作（.section-more） */
export const NEW_UI_HOME_MORES = {
  recent: '清空记录',
  playlists: '全部歌单',
  songs: '完整榜单',
} as const

/**
 * 热门歌手区块的一句话说明（2026-10-12 走查现象 3）：
 * 措辞对齐原型原句（index.html L148 .section-note）。
 * 2026-10-15 方案 B 落地后**渲染条件收窄**：tx（QQ）榜单曲目能带出歌手 id，头像位开始能铺
 * 平台官方真人照，所以这句「平台未提供歌手照片」只在**整排都还是占位插画**时才说
 * （判定见 HomePage 的 artistsAllPlaceholder）；有一句真图就不再挂着骂平台。
 * 原「更多」入口没有落地页、点了没反应，一并撤下。
 */
export const NEW_UI_HOME_ARTISTS_NOTE = '头像是示意插画 · 平台未提供歌手照片'

/** 每日推荐卡的眉标（.dc-kicker，原型为大写英文点缀） */
export const NEW_UI_HOME_DAILY_KICKER = 'FOR YOU'

/**
 * 每日推荐卡的说明行文案（原型 app.js L308-309）：
 * 首数按这次真正挑到的算，池子空就明说——不写死「10 首」。
 */
export const NEW_UI_HOME_DAILY_SUB = {
  picked: (count: number) => `${count} 首 · 按你的收听推算`,
  empty: '先听几首，这里会自动排好',
} as const

/**
 * 首页各处上屏上限——原型注释里明说的设计值，集中收口（改一处全对齐）：
 * - recent 12：app.js L255-258「最多上屏 12 张（RECENT_LIMIT）」；
 * - artists 8：app.js L1533-1534「原型一排 8 个，与 RN ARTIST_LIMIT 同量」；
 * - rankTabs 4 / rankSongs 10：app.js L349-357 HOME_RANK_TAB_LIMIT / HOME_SONG_LIMIT，
 *   注释「这两条上限与 RN 同名参数对齐」；
 * - daily 10：app.js L292-297「池子取前 10」。
 */
export const NEW_UI_HOME_LIMITS = {
  recent: 12,
  artists: 8,
  rankTabs: 4,
  rankSongs: 10,
  daily: 10,
} as const

/** 区块内常见的「还没取到」文案 */
export const NEW_UI_HOME_EMPTY = {
  recent: '还没有播放记录 · 先从排行榜里点一首',
  loading: '正在从平台取歌 · 稍等',
  artists: '这个榜里没认出歌手',
} as const

/** 还没做完的动作给的一句话提示（说人话，别漏开发术语）；音源轮播已接 SourceSheet（9d）、电台已接 RadioHomeScreen（快捷那一格），两条占位随之清理，只剩歌手主页这一句 */
export const NEW_UI_HOME_TODO_TOAST = {
  artists: '歌手主页建设中 · 先播放这张榜里 TA 的歌曲',
} as const

/**
 * 轮播条目的动作 key（useHomeBanners 产出、HomePage 分派，两处共用）。
 * 原型首页的电台入口只有快捷那一格（data.js L294），轮播里没有电台条。
 */
export const NEW_UI_HOME_BANNER_KEYS = {
  apiSource: 'api-source',
  nowPlaying: 'now-playing',
} as const

/** 播放相关反馈 */
export const NEW_UI_HOME_PLAY_TOAST = {
  daily: '今日推荐已开始播放',
  nothingPlayable: '这几首在当前音源下不可播 · 换个音源或换几首',
} as const

/** 快捷入口四格（原型 QUICK，动作为 key 分派） */
export const NEW_UI_HOME_QUICK_ITEMS: QuickEntry[] = [
  { key: 'daily', label: '每日推荐', icon: 'play', artSeed: 'q-daily' },
  { key: 'chart', label: '排行榜', icon: 'chart', artSeed: 'q-chart' },
  { key: 'radio', label: '电台', icon: 'wave', artSeed: 'q-radio' },
  { key: 'liked', label: '我喜欢', icon: 'heart', artSeed: 'q-liked' },
]

/** 快捷入口的 key（与原型一致） */
export const NEW_UI_HOME_QUICK_KEYS = {
  daily: 'daily',
  chart: 'chart',
  radio: 'radio',
  liked: 'liked',
} as const

/** 封面种子前缀（与 utils/song 里的专辑种子区分开） */
export const NEW_UI_HOME_ART_SEED = {
  daily: 'daily',
  playlist: 'pl',
  artist: 'artist',
} as const
