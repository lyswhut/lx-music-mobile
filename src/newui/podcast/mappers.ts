/**
 * 电台（播客）接口返回 → 界面视图模型的映射。
 *
 * **只做数值与日期的格式化**，不产任何屏上文案（「节目 / 单集 / 最新单集 / 还剩 X」那一族
 * 是界面层的文案，归 `const/radio.ts` 的后续工单）。
 *
 * 两个格式化函数的口径**逐字对齐原型**：
 * - `podDurationText` ← `podMin`（`new_design/app.js` L1780，入参是**秒**）
 * - `podDateText` ← `podDate`（`new_design/app.js` L1782，切的是日期字符串的**固定位**）
 */
import type {
  AppleTopChartItem,
  ItunesLookupRaw,
  ItunesRawItem,
  ItunesResponse,
  PodDetail,
  PodEpisodeRow,
  PodShowRow,
} from './types'

/* ================= 一、格式化（原型口径，逐字） ================= */

/** 两位补零（原型 `String(...).padStart(2, '0')`） */
const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * 秒 → 人话时长（原型 `podMin`，app.js L1780 逐字）：
 * 不到一小时是「18 分钟」（`Math.round(sec / 60)`），到一小时是「1 小时 06 分」
 * （小时数向下取整，剩余分钟四舍五入后补零到两位）。
 * 入参是**秒**不是毫秒——`trackTimeMillis` 先在这里之外换算好。
 */
export const podDurationText = (sec: number): string =>
  sec < 3600
    ? `${Math.round(sec / 60)} 分钟`
    : `${Math.floor(sec / 3600)} 小时 ${pad2(Math.round((sec % 3600) / 60))} 分`

/**
 * 日期原文 → 「10 月 15 日」（原型 `podDate`，app.js L1782 逐字：切 `slice(5,7)` 当月份、
 * `slice(8,10)` 当日，各自 `Number()` 去掉前导零）。
 *
 * 实测三条接口的日期一律是 UTC ISO（`2026-10-15T23:00:00Z`），
 * 前 10 位正好是 `YYYY-MM-DD`，**原型的字符串位切片对它直接成立**，因此这里照抄、
 * 不改成 `new Date()` 解析——一改成宿主时区解析，夜里 23:00Z 那批（北京时间次日早上更新）
 * 就会整体往后跳一天，和原型显示的不是同一个日期。
 * 传空（`updated` / `releaseDate` 缺席）返回空串，界面层据此不渲染那一栏，
 * 对应原型「接口里没写进那四个节目的，这两项就不出现」（契约 7.6 U82 hero）。
 */
export const podDateText = (iso: string | undefined): string => {
  if (typeof iso !== 'string' || iso.length < 10) return ''
  const month = Number(iso.slice(5, 7))
  const day = Number(iso.slice(8, 10))
  if (!Number.isFinite(month) || !Number.isFinite(day)) return ''
  return `${month} 月 ${day} 日`
}

/* ================= 二、字段收口（三条接口的形状差异在这里抹平） ================= */

/** id：① 是字符串、②③ 是数字 → 一律收成字符串（本机状态键 / passProps 都要可序列化） */
const toShowId = (item: AppleTopChartItem | ItunesRawItem): string => {
  const raw =
    (item as AppleTopChartItem).id ??
    (item as ItunesRawItem).collectionId ??
    (item as ItunesRawItem).trackId
  return raw == null ? '' : String(raw)
}

/** 节目名：①用 `name`；②③用 `collectionName`（实测与 `trackName` 同值，取前者） */
const toShowName = (item: AppleTopChartItem | ItunesRawItem): string =>
  (item as AppleTopChartItem).name ??
  (item as ItunesRawItem).collectionName ??
  (item as ItunesRawItem).trackName ??
  ''

/**
 * 要剔的泛化词（本轮用户拍板：「剔掉 'Podcasts'」）。
 * ②③ 的 `genres` 是英文分类表，几乎每个节目都挂着 `'Podcasts'` 这一枚——它说的就是「这是个播客」，
 * 在电台屏上和频道名重复、不带任何信息，行尾那一格白占着。
 * **只剔这一个词，且必须整词相等**（trim 后大小写不敏感）：`'Comedy Podcasts'`、`'Education Podcasts'`
 * 这类带信息的组合词一律原样留着，不许借这条规则扩大成黑白名单。
 */
const GENERIC_GENRE_NAME = 'podcasts'
const isGenericGenreName = (name: string): boolean => name.trim().toLowerCase() === GENERIC_GENRE_NAME

/**
 * 分类词：三条接口三种形状（①`[{genreId,name,url}]` / ②与③节目侧 `string[]` /
 * ③单集侧 `[{name,id}]`），这里只认「字符串就直接收、对象就取 `name`」，
 * 外加用户拍板的那一条：整词等于 `'Podcasts'` 的那枚剔掉（见 `GENERIC_GENRE_NAME`）。
 * 其余接口给什么就显示什么（不改写、不"顺"字），切片数量由界面层按屏定（行尾一枚、hero 两枚）。
 * 剔完可能整组为空，界面层据此让那一栏整个不画（不留空标签框）。
 */
export const extractGenreNames = (
  genres: ItunesRawItem['genres'] | AppleTopChartItem['genres'],
): string[] => {
  if (!Array.isArray(genres)) return []
  const names: string[] = []
  for (const genre of genres) {
    const name = typeof genre === 'string' ? genre : genre?.name
    if (typeof name !== 'string' || name.length === 0) continue
    if (isGenericGenreName(name)) continue
    names.push(name)
  }
  return names
}

/**
 * 封面：①只有 `artworkUrl100`（榜行 56 / 订阅卡 132 就认这一档，**不许承诺 600**）；
 * ②③优先 `artworkUrl600`，回落 100。
 */
const toArtworkUrl = (item: AppleTopChartItem | ItunesRawItem): string => {
  const raw = item as ItunesRawItem
  return raw.artworkUrl600 ?? raw.artworkUrl100 ?? ''
}

/* ================= 三、映射 ================= */

/**
 * ① 排行条目 → 榜行。`rank` 是**数组序 +1**（app.js L1900），接口没有名次字段。
 * ①给不出集数与发布日期，所以 `count` / `updated` 在这条路径上就是 `undefined`，
 * 界面层不渲染那两栏（不许拿假值填位）。
 */
export const mapChartItem = (item: AppleTopChartItem, index: number): PodShowRow => ({
  id: toShowId(item),
  name: toShowName(item),
  by: typeof item.artistName === 'string' ? item.artistName : '',
  tags: extractGenreNames(item.genres),
  artworkUrl: toArtworkUrl(item),
  rank: index + 1,
})

/** ① 整榜 → 榜行数组（名次随原序，本地分页的切片在 hooks 里做，这里给全量） */
export const mapChartItems = (items: AppleTopChartItem[]): PodShowRow[] =>
  items.map((item, index) => mapChartItem(item, index))

/**
 * ②③ 节目本体 / 单集之外的 show 条目 → 节目行（不带名次：
 * 命中行走 `podRow(s, 0)`，app.js L2132，rank 为 0 时那一栏整个不画）。
 * `count` / `updated` 是②③比①多给出来的那两项。
 */
export const mapShowItem = (item: ItunesRawItem): PodShowRow => {
  const tags = extractGenreNames(item.genres)
  // genres 整个缺席时才落主分类那一枚（②③都有 `primaryGenreName`，不并列追加，免得行尾多出词）。
  // 回落那一枚走**同一条**剔泛化词规则（用户拍板「剔掉 'Podcasts'」）：两个调用口径一致，
  // 不许一处剔一处不剔；剔空了就是空数组，界面层那一栏整个不画。
  const primary = item.primaryGenreName
  const canUsePrimary =
    typeof primary === 'string' && primary.length > 0 && !isGenericGenreName(primary)
  const effectiveTags = tags.length === 0 && canUsePrimary ? [primary as string] : tags
  return {
    id: toShowId(item),
    name: toShowName(item),
    by: typeof item.artistName === 'string' ? item.artistName : '',
    tags: effectiveTags,
    artworkUrl: toArtworkUrl(item),
    count: typeof item.trackCount === 'number' ? item.trackCount : undefined,
    updated: typeof item.releaseDate === 'string' ? item.releaseDate : undefined,
    feedUrl: typeof item.feedUrl === 'string' ? item.feedUrl : undefined,
  }
}

/**
 * ② 搜索结果 → 命中行数组。
 * 原型 `podHitsOf`（app.js L2078-2091）里那圈 `seen` 去重是「把四区 mock 拼起来才需要」；
 * 真实接口一次一发，但仍按 id 去重、并按请求侧的 `limit` 截断（截 20 的口径见 api.ts），
 * 顺序保持接口原序。
 */
export const mapSearchItems = (items: ItunesRawItem[]): PodShowRow[] => {
  const seen = new Set<string>()
  const rows: PodShowRow[] = []
  for (const item of items) {
    const row = mapShowItem(item)
    if (row.id === '' || seen.has(row.id)) continue
    seen.add(row.id)
    rows.push(row)
  }
  return rows
}

/**
 * ③ 单集条目 → 单集行。`sec` 由**毫秒**换算（`trackTimeMillis / 1000` 四舍五入，
 * 实测量级 592000–1159000）；接口没给就是 0，界面层的「播最新单集 · X 分钟」那颗随之显示
 * 「0 分钟」——真数据 50/50 都带 `trackTimeMillis`，这条只是兜底。
 * `intro` 可缺席（契约 7.6），缺时字段整个不写，界面层「空则整段不渲染」。
 */
export const mapEpisodeItem = (item: ItunesRawItem): PodEpisodeRow => {
  const date = typeof item.releaseDate === 'string' ? item.releaseDate : ''
  const sec = typeof item.trackTimeMillis === 'number' ? Math.round(item.trackTimeMillis / 1000) : 0
  const row: PodEpisodeRow = {
    id: item.trackId == null ? '' : String(item.trackId),
    title: typeof item.trackName === 'string' ? item.trackName : '',
    date,
    sec,
    dateText: podDateText(date),
    durationText: podDurationText(sec),
  }
  if (typeof item.shortDescription === 'string' && item.shortDescription.length > 0) {
    row.intro = item.shortDescription
  }
  if (typeof item.episodeUrl === 'string' && item.episodeUrl.length > 0) {
    row.episodeUrl = item.episodeUrl
  }
  return row
}

/** ③ 原文分流：`results[0]` 是节目本体（`kind: 'podcast'`），其余按 `kind` 认单集 */
export const splitLookupResponse = (payload: ItunesResponse): ItunesLookupRaw => {
  const results = Array.isArray(payload.results) ? payload.results : []
  const head = results[0]
  const show = head != null && head.kind === 'podcast' ? head : null
  const episodes = results.filter(item => item?.kind === 'podcast-episode')
  return { show, episodes }
}

/**
 * ③ 响应 → hero + 单集列。
 * `updated`（「最新单集」）取**首集的 `releaseDate`**，接口原序实测就是新集在前；
 * 节目本体的 `releaseDate` 只作回落——实跑发现两者能差一天（`1573189055`：节目本体
 * `2026-10-14T23:00Z`、首集 `2026-10-15T23:00Z`，节目侧那个字段滞后），
 * 而屏上那句写的就是「最新单集 M 月 D 日」，所以以单集为准。
 */
export const mapLookupResponse = (payload: ItunesResponse): PodDetail => {
  const { show, episodes } = splitLookupResponse(payload)
  const mappedEpisodes = episodes.map(mapEpisodeItem)
  let mappedShow: PodShowRow | null = null
  if (show != null) {
    mappedShow = mapShowItem(show)
    const latest = mappedEpisodes[0]?.date
    if (typeof latest === 'string' && latest.length > 0) mappedShow.updated = latest
  }
  return { show: mappedShow, episodes: mappedEpisodes }
}
