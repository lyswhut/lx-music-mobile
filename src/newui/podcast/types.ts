/**
 * 电台（播客）取数层类型。
 *
 * 分两段：**接口原文类型**（`Itunes*` / `AppleTopChart*`，字段名与类型全部来自 2026-10-17
 * 真机 curl 实跑，不是照契约猜的）与**界面视图模型**（`Pod*Row` / `PodDetail`，字段名沿用
 * 原型件里的视图字段 `id / name / by / tags / count / updated / episodes[]`
 * ——契约 `src/newui/PROTOTYPE_INVENTORY.md` 7.6，不自创）。
 *
 * 三条接口的实测出入（写在这里，免得界面层再猜）：
 * 1. **同一份 genres，三条接口三种形状**：
 *    ① 排行 `[{ genreId: '1321', name: '商务', url }]`（对象数组，name **跟随区本地化**，cn 给中文）
 *    ② 搜索 `['Technology', 'Podcasts', 'News']`（**字符串数组**，全英文、不跟随语言）
 *    ③ lookup 节目本体同 ②；③ 的单集又是 `[{ name: 'Entrepreneurship', id: '1493' }]`
 *    所以契约 7.6 里那句 `genres[].name` 只对①成立，映射统一走 `mappers.extractGenreNames`。
 * 2. **id 的类型不统一**：① 的 `id` 是字符串，②③ 的 `collectionId` / `trackId` 是数字。
 *    视图模型里一律收成字符串（本机状态键、路由 passProps 都要可序列化）。
 * 3. **档位**：① 只有 `artworkUrl100`；②③ 有 `artworkUrl600`（节目本体）与
 *    `artworkUrl60/160/600`（单集，**单集没有 artworkUrl100**）。榜行 56 用 100 档，不承诺 600。
 * 4. **单集要按 kind 过滤**：`entity=podcastEpisode` 的 `results` 里，`results[0]` 是
 *    `kind: 'podcast'`（节目本体），其后才是 `kind: 'podcast-episode'`（实测 1 + 50 条）。
 * 5. **日期是 UTC**：`releaseDate` 一律 `YYYY-MM-DDTHH:MM:SSZ`（实测 51 条同形）。
 *    格式化按原型 `podDate`（app.js L1782）**逐字切字符串位**，不做时区换算，见 `mappers`。
 */

/* ================= 一、接口原文类型（实测） ================= */

/** ① 排行榜条目（`rss.marketingtools.apple.com/api/v2/{country}/podcasts/top/50/podcasts.json`） */
export interface AppleTopChartItem {
  /** 节目 id，**字符串**（②③ 的数字 collectionId 与它不同形） */
  id: string
  name: string
  artistName: string
  /** 实测恒为 `'podcasts'` */
  kind?: string
  /** 封面只有这一档（100×100） */
  artworkUrl100: string
  /** 对象数组；name 跟随区本地化 */
  genres?: Array<{ genreId?: string, name?: string, url?: string }>
  /** Apple 官方节目页 */
  url?: string
}

/** ① 外层：`{ feed: { ..., results: [...] } }`，实测固定 50 条 */
export interface AppleTopChartResponse {
  feed?: {
    title?: string
    id?: string
    /** 回显请求里的国家码 */
    country?: string
    /** RFC 1123 格式（`Sat, 17 Oct 2026 08:28:17 +0000`），与 releaseDate 的 ISO 不同形，本轮不上屏 */
    updated?: string
    results?: AppleTopChartItem[]
  }
}

/**
 * ②③ 的条目（`itunes.apple.com/search` 与 `itunes.apple.com/lookup`）。
 * 两种角色共用一张表：`kind === 'podcast'` 是节目本体，`kind === 'podcast-episode'` 是单集，
 * 各自只带自己那半字段，所以全部可选——**读之前按 kind 分流，别直接取**。
 */
export interface ItunesRawItem {
  wrapperType?: string
  /** `'podcast'` | `'podcast-episode'`（③ 的过滤判据） */
  kind?: string

  /* —— 节目本体（②的一条命中 / ③的 results[0]）—— */
  artistId?: number
  /** 节目 id，**数字**（① 给的是字符串） */
  collectionId?: number
  trackId?: number
  artistName?: string
  /** 节目名；实测与 `trackName` 同值，取 `collectionName` 优先 */
  collectionName?: string
  trackName?: string
  collectionCensoredName?: string
  trackCensoredName?: string
  artistViewUrl?: string
  collectionViewUrl?: string
  trackViewUrl?: string
  /** 订阅源（RSS）地址：②③ 都给，本轮不上屏，只透出给界面层自行取舍 */
  feedUrl?: string
  /** 节目本体给的**最新一集**日期（UTC ISO）。实测它比 `episodes[0].releaseDate` 可能早一天（缓存滞后），映射以首集为准 */
  releaseDate?: string
  /** 总集数（①给不出） */
  trackCount?: number
  /** 单枚主分类（英文） */
  primaryGenreName?: string
  /** ②③ 这里是**字符串数组**（英文，含泛化词 `'Podcasts'`）；单集上又变对象数组，见文件头第 1 条 */
  genres?: string[] | Array<{ name?: string, genreId?: string, id?: string, url?: string }>
  genreIds?: string[]
  country?: string
  currency?: string
  contentAdvisoryRating?: string

  /* —— 封面档位 —— */
  artworkUrl30?: string
  artworkUrl60?: string
  artworkUrl100?: string
  artworkUrl160?: string
  artworkUrl600?: string

  /* —— 单集（③ kind=podcast-episode）—— */
  /** 时长，**毫秒**（实测 592000–1159000，即 10–19 分钟量级） */
  trackTimeMillis?: number
  /** 一集简介：**可缺席**（契约 7.6），缺则界面层整段不渲染 */
  shortDescription?: string
  /** 全文简介（实测在，本轮不上屏） */
  description?: string
  /** 音频直链（实测 50/50 都给）。单集屏拿它真出声（见 `podPlayer.ts`），本轮用户拍板「接上，能真听」 */
  episodeUrl?: string
  /** 试听直链（实测与 episodeUrl 同值） */
  previewUrl?: string
  episodeGuid?: string
  episodeFileExtension?: string
  /** 实测 `'audio'` */
  episodeContentType?: string
  closedCaptioning?: string
  artistIds?: number[]
}

/** ②③ 外层 */
export interface ItunesResponse {
  resultCount: number
  results: ItunesRawItem[]
}

/** ③ 分流后的原文（映射函数的入参） */
export interface ItunesLookupRaw {
  show: ItunesRawItem | null
  episodes: ItunesRawItem[]
}

/* ================= 二、界面视图模型（契约 7.6 的字段名） ================= */

/**
 * 节目行（U81 榜行 / U83 命中行 / U82 与 U84 的节目侧，同一形状）。
 * 字段名沿用原型件视图：`name` / `by` / `tags` / `count` / `updated`。
 */
export interface PodShowRow {
  /** 节目 id，**统一字符串**（① 原生字符串，②③ 数字转字符串） */
  id: string
  /** 节目名（.pod-name） */
  name: string
  /** 作者（.pod-by 左半；← `artistName`） */
  by: string
  /**
   * 分类词（← `genres`）。行尾只挂**一枚**（`tags[0]`，podRow L1908-1912），
   * hero 取**前二**（`slice(0, 2)`，app.js L2008-2012）——切片由界面层按屏做，这里不截。
   */
  tags: string[]
  /**
   * 封面 URI。①只给 `artworkUrl100`（榜行 56 / 订阅卡 132 都用这一档，**不许承诺 600**）；
   * ②③优先 `artworkUrl600`，回落 100。
   */
  artworkUrl: string
  /** 名次：**数组序 +1**，不是接口字段（app.js L1900）；只有榜行有，命中行不给 */
  rank?: number
  /** 总集数「共 N 集」；①给不出，只有②③带过来时才有（app.js L2014） */
  count?: number
  /** 最新单集日期原文（UTC ISO）；①给不出。屏上写「最新单集 M 月 D 日」时先过 `podDateText` */
  updated?: string
  /** 订阅源地址：接口给了就透出，本轮不上屏（契约 7.6 ②「feedUrl 本轮不上屏」） */
  feedUrl?: string
}

/** 单集行（U82 `.ep-row` / U84 `.epl-*`） */
export interface PodEpisodeRow {
  /** 单集 id（← `trackId`，转字符串） */
  id: string
  /** 集名（← `trackName`，.ep-title） */
  title: string
  /** 发布日期原文（UTC ISO，← `releaseDate`）；缺席则空串 */
  date: string
  /** 时长秒数（← `trackTimeMillis / 1000`，四舍五入）；接口没给就是 0 */
  sec: number
  /** 一集简介（← `shortDescription`）：**可缺席**，缺则界面层整段不渲染（epRow L2062） */
  intro?: string
  /** 音频直链（← `episodeUrl`）：单集屏起播就喂给它（`podcast/podPlayer.ts`）；缺则这集放不出声 */
  episodeUrl?: string
  /** 日期文本「10 月 15 日」（`podDateText(date)`），界面直接用 */
  dateText: string
  /** 时长文本「18 分钟」/「1 小时 06 分」（`podDurationText(sec)`），界面直接用 */
  durationText: string
}

/** ③ 的整屏数据（U82 hero + 单集列；一次给多少就是多少，不分页） */
export interface PodDetail {
  /** 节目本体（`results[0]` 映射）；接口没回节目本体则为 null */
  show: PodShowRow | null
  /** 已按接口原序（实测**新集在前**）映射好的单集 */
  episodes: PodEpisodeRow[]
}

/* ================= 三、本机状态形状（详见 localState.ts） ================= */

/**
 * 订阅名单的一项：id + 订阅卡要显示的最小快照。
 *
 * 原型那边 `LS.podSub` 存的是**纯 id 数组**（`POD_SUB_SEED = ['1573189055', ...]`，data.js L566），
 * 因为原型手边就有一整张 mock 榜可以查表补出名字与封面（`podShowById`，app.js L1817）。
 * 真实侧没有这张表：只存 id 的话，订阅卡要显示名字与封面就得为每颗卡各发一次请求。
 * 而原型这一版**只有取消收听、没有加订阅的入口**（detail.html 件头：#podSubBtn 已撤），
 * 所以那份暧昧从没被暴露过。本轮工单要求 hook 提供「订阅增删」，加订阅就得落快照，
 * 于是名单项带这四栏；`idx` 之外的一切仍以本机为准（接口读不到也写不回）。
 */
export interface PodSubEntry {
  id: string
  name: string
  by: string
  artworkUrl: string
}

/**
 * 单集收听进度的一项（← 原型 `podSaveProgress`，app.js L1790-1794）。
 * `left` 单位是**秒**（原型 `left = Math.round(epSec() - epState.t)`，L2237），
 * 界面要写的「还剩 X」＝ `podDurationText(left)`。
 */
export interface PodProgressEntry {
  id: string
  /** 听到的是这个节目的第几集（单集数组下标，从 0 起） */
  idx: number
  left: number
}
