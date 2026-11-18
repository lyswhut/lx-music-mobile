/**
 * 排行榜页常量（对应原型 #page-rank）。
 * 屏内文案优先照抄原型原句；分页数值（每批 8 张、距底 160px）第 7b 轮起走 theme 的 RANK_PAGING。
 * 2026-10-22 起负责「榜名→真实封面」的 rankCoverKey（判据表本体是生成物 rankCoverWords.ts）。
 * 同日起原型那套「榜名→型 / 榜名→色 + 六枚单色符号」的通用底板随 default 兜底封面一起退役。
 */
import { RANK_COVER_WORDS } from './rankCoverWords'

/** 各区块文案（.page-title / .foot-note / .empty-tip） */
export const NEW_UI_RANK_TITLES = {
  page: '排行榜',
} as const

/** 页尾说明（原型 .foot-note 原句） */
export const NEW_UI_RANK_FOOT_NOTE = '榜单由各平台整理 · 点进去看完整排名'

/** 空态 / 加载态文案（原型 .empty-tip 口径：说人话，不带开发术语） */
export const NEW_UI_RANK_EMPTY = {
  loading: '正在把各平台的榜单目录取回来 · 稍等',
  /** 原型原句（app.js renderRankPage L552）：与搜索/音源一族同口径「到设定页…换音源」 */
  noBoards: '当前音源下没有可列榜单的平台 · 到设定页换一个音源',
  failed: '榜单目录没取到 · 网络或音源不稳',
} as const

/**
 * 分段组头的数量文案模板（原型 rankGroupHead L494-499：`{total} 个榜 · 热歌 / 新歌 / 飙升在前`）。
 * N 必须是该平台目录里的**全部榜数**（整平台全列后 = 该平台上卡总数），不是已显示的那几排；
 * 原型已撤「首数 / 更新频率」两个假字段，这里也不造。
 */
export const rankGroupCountLabel = (total: number): string =>
  `${total} 个榜 · 热歌 / 新歌 / 飙升在前`

/**
 * 网格末尾分页状态行文案（原型 PLD_STATUS，app.js L834，与歌单页共用同一语义）。
 * RN 侧目录一次性取回、续批是本地推进，「正在载入下一批…」只在**真实的重取请求**
 * （上一批目录失败后点重试）期间出现；无请求在途且还有未显示的榜时这一行不出现，
 * 原型「第 3 屏故意失败一次」的演示路径不搬。
 */
export const NEW_UI_RANK_STATUS = {
  loading: '正在载入下一批…',
  retry: '这一批没有载入 · 点击重试',
} as const

/**
 * 判据命不中时那张兜底封面（原型 app.js 的 RANK_COVER_DEFAULT，同一张图）。
 * 兜底也是套图里的一张真插画：以前这里是一枚按榜型挑的单色符号 + 强调色压暗的深底，
 * 自创的无彩底混在 48 张彩色封面里一眼就掉队，2026-10-22 起整条支路退役。
 */
export const RANK_COVER_DEFAULT = 'default'

/**
 * 榜名 → 真实封面（原型 data.js rankCoverKey L303-307 逐字同式）：
 * 整串转大写后，按 RANK_COVER_WORDS 的**先后**找第一条「词根被榜名包含」的行，命中即取那行的 key。
 * 顺序就是优先级（词根最长优先，同长度按 外部授权榜 > 语种 > 地区 > 曲风 > 场景 > 权益 > 排名机制 > 主打），
 * 所以「欧美热歌榜」落 west 不落 hot、「国风热歌榜」落 chinese_style 不落 hot、「日本公信榜」落 oricon 不落 japan。
 * 表本身是生成物（const/rankCoverWords.ts，脚本从原型 data.js 原样搬运），**这里只读不排**：
 * RN 侧另编一套排序，同一个榜名就会在原型和 App 落到两张不同的封面。
 * 命不中返回 null，由 ChartArt 铺 RANK_COVER_DEFAULT 那张兜底封面（同原型 chartFace 那条 ?? 兜底）。
 */
export const rankCoverKey = (name: string): string | null => {
  const n = String(name).toUpperCase()
  const hit = RANK_COVER_WORDS.find(([, words]) => words.some(word => n.includes(word.toUpperCase())))
  return hit ? hit[0] : null
}

/**
 * 该榜名是否命中原型给出的三类主打榜（热歌 / 新歌 / 飙升），用于组内排序排前（第 7b 轮起截断已退役）。
 * QA 2026-10-14 D-15 收窄：原型 data.js L117 自身就是 `/热|新|飙|升/` 的宽正则——它的 mock 榜名
 * 全是干净名字没暴露问题，真实目录里「热评榜」「MV新势力」这类名字含单字就插队，
 * 而组头写的明明是「热歌 / 新歌 / 飙升在前」（rankGroupHead L498），名实不符。
 * 收窄口径：热/新按「热歌/新歌」开头认（各平台热歌榜/新歌榜都是这前缀），飙/升保留关键词
 * （飙升榜/上升榜同一语义家族，与原型 data.js 的 isRankBoardFeatured 同式）。
 */
export const isRankBoardFeatured = (name: string): boolean =>
  name.startsWith('热歌') || name.startsWith('新歌') || /飙|升/.test(name)
