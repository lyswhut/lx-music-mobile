/**
 * 电台（播客）取数层——三条 Apple 公共接口的唯一出口。
 *
 * **界面层只许调这三个函数**（实际经由 `./hooks`），URL 模板一律不许外溢到组件里。
 * 用 RN 自带 `fetch`，不加依赖、不走 JSONP、不注 UA（2026-10-17 curl 实跑：无 UA 直接 200）。
 *
 * 实跑口径（结论写在这三条注释里，字段与类型见 `./types`）：
 * - 排行：`cn` / `us` / `gb` / `jp` 均 HTTP 200、各 50 条真实榜单；`cn` **有内容**
 *   （feed.title「热门节目」，首条「声动早咖啡」），`tw` / `hk` / `kr` / `br` / `sa` / `eg` 抽查也全 200，
 *   42 区清单因此整体保留；乱码区（`zz`）回 **502 + HTML**，所以错误按 kind 分得出。
 * - 搜索：`term` + `media=podcast` 一发 200，`resultCount` 到 50。
 * - 详情：`id` + `entity=podcastEpisode` 一发 200，`resultCount=51`（1 条节目本体 + 50 条单集）。
 *   `entity` **没有 offset**，一次给多少就是多少——**不做分页**，`limit` 只是这一批的封顶值。
 *
 * 失败必须能被界面层分成两件事：「正在取」（`loading`）与「这一区没取到」（`failed` + 重试），
 * 因此三函数只 resolve / throw，不返回「空数组当失败」那种暧昧值；
 * 但**取到 200 且真的零条命中**对搜索来说是正常结果（空态），不抛错。
 */
import { isPodRegionCode } from '@/newui/const/radio'

import { mapLookupResponse, mapSearchItems } from './mappers'
import type {
  AppleTopChartItem,
  AppleTopChartResponse,
  ItunesResponse,
  PodDetail,
  PodShowRow,
} from './types'

/* ================= 地址与参数（只在这里拼） ================= */

/** ① 排行：一次 50 条，`{country}` 就是地区抽屉挑中的那一格 */
const chartTopUrl = (country: string): string =>
  `https://rss.marketingtools.apple.com/api/v2/${encodeURIComponent(country)}/podcasts/top/50/podcasts.json`

/** ② 搜索 */
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'

/** ③ 详情与单集 */
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup'

/**
 * 单次请求上限（ms）。curl 实测正常在 0.3–3s；到 12s 还没回来就是网络/上游卡住，
 * 判死推进「这一区没取到 · 点击重试」，不能让界面停在「正在载入」不动。
 */
const POD_FETCH_TIMEOUT_MS = 12_000

/**
 * ② 一次要回多少条：iTunes 默认 50，但屏上命中固定截 20（`podHitsOf` 的 `.slice(0, 20)`，
 * app.js L2089）。直接按 20 请求，省掉「取 50 丢 30」的白搭流量；
 * 计数文案「N 个节目」用的就是这里的条数，与原型同源同值。
 */
const POD_SEARCH_LIMIT = 20

/**
 * ③ 一批取回多少集：**不是分页**（`entity` 不支持 offset）。
 * 50 就是接口一批的上限（原型 index.html L763「取 min(接口一批的上限 50, 这个节目的 trackCount)」），
 * 给回多少集界面就列多少集，尾上不放「加载更多」。
 */
const POD_EPISODE_LIMIT = 50

/* ================= 错误：界面层要分得清是哪种失败 ================= */

export type PodcastApiErrorKind =
  /** 12s 内没回来（已 abort） */
  | 'timeout'
  /** fetch 本身抛错：断网、DNS、连接被重置 */
  | 'network'
  /** 非 2xx，例如乱码区回 502 */
  | 'http'
  /** 200 但正文不是 JSON（502 的 HTML 被 CDN 改写、或中间页劫持） */
  | 'decode'
  /** 200 且 JSON 正常，但清单里没有这一区（界面层不该走到，抽屉兜不住时给同一句重试） */
  | 'unsupported_region'
  /** 200 但榜单是空的：契约要求「不假装榜是空的」，因此与失败同一条状态行 */
  | 'empty'

/** 取数失败。`kind` 供界面层分流文案，`status` 只在 http 那一类有值。 */
export class PodcastApiError extends Error {
  readonly kind: PodcastApiErrorKind
  readonly status?: number

  constructor(kind: PodcastApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'PodcastApiError'
    this.kind = kind
    if (status != null) this.status = status
    // Hermes 上继承内建对象的兜底
    Object.setPrototypeOf(this, PodcastApiError.prototype)
  }
}

/** 不靠 instanceof（跨打包边界时不可靠），认 brand 字段 */
export const isPodcastApiError = (error: unknown): error is PodcastApiError =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: unknown }).name === 'PodcastApiError' &&
  typeof (error as { kind?: unknown }).kind === 'string'

/* ================= fetch 底座 ================= */

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, POD_FETCH_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    // abort 之后 fetch 也走这里：按 aborted 分流，别把超时算成断网
    if (controller.signal.aborted) {
      throw new PodcastApiError('timeout', `电台取数超时（${POD_FETCH_TIMEOUT_MS}ms）：${url}`)
    }
    throw new PodcastApiError('network', `电台取数连不上：${url}`)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new PodcastApiError(
      'http',
      `电台取数被拒（HTTP ${String(response.status)}）：${url}`,
      response.status,
    )
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new PodcastApiError('decode', `电台取数拿回的不是 JSON：${url}`)
  }
}

/* ================= 三个取数函数 ================= */

/**
 * ① 排行榜：拿回一个区的原始榜条目（实测 50 条，接口给多少就是多少）。
 * `country` **显式传**（地区是调用方的状态，默认区见 `const/radio.ts` 的
 * `NEW_UI_POD_REGION_DEFAULT = 'cn'`）；不在 42 区清单里的码直接判死，不发请求。
 * 名次不在这里给（数组序 +1 由 `mappers.mapChartItems` 落）。
 */
export const fetchPodcastTopChart = async(country: string): Promise<AppleTopChartItem[]> => {
  if (!isPodRegionCode(country)) {
    throw new PodcastApiError('unsupported_region', `这一区不在电台地区清单里：${country}`)
  }
  const payload = await fetchJson<AppleTopChartResponse>(chartTopUrl(country))
  const results = payload.feed?.results
  if (!Array.isArray(results) || results.length === 0) {
    // 取不到这一区就让它失败，别让界面拿一个空数组去摆空榜（契约 7.6 U81 状态行）
    throw new PodcastApiError('empty', `这一区没有取到名单：${country}`)
  }
  return results
}

/**
 * ② 搜节目：关键词 → 命中行（已映射、已按 id 去重，最多 `POD_SEARCH_LIMIT` 条）。
 * 空命中是正常结果（界面摆「没找到和「X」对得上的节目」），只有取数失败才 throw。
 * `trim` 后为空不发请求（原型 `submitPodSearch` L2138：空词直接 return）。
 */
export const searchPodcasts = async(term: string): Promise<PodShowRow[]> => {
  const keyword = term.trim()
  if (!keyword) return []
  const url =
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(keyword)}` +
    `&media=podcast&limit=${String(POD_SEARCH_LIMIT)}`
  const payload = await fetchJson<ItunesResponse>(url)
  return mapSearchItems(Array.isArray(payload.results) ? payload.results : [])
}

/**
 * ③ 详情与单集：`showId` 就是①的 `id` 或②的 `collectionId`（映射层已统一收成字符串）。
 * 一次给回「节目本体 + 这一批单集」，**不分页**：`entity` 没有 offset，
 * 这一批就是这一屏的全部（原型：详情屏不分页、不放「加载更多」、列表尾不写解释行）。
 * 单集按 `kind === 'podcast-episode'` 过滤，接口原序（实测新集在前）保留。
 */
export const fetchPodcastDetail = async(showId: string): Promise<PodDetail> => {
  const id = showId.trim()
  if (!id) throw new PodcastApiError('unsupported_region', '没有节目 id，详情不发请求')
  const url =
    `${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(id)}` +
    `&entity=podcastEpisode&limit=${String(POD_EPISODE_LIMIT)}`
  const payload = await fetchJson<ItunesResponse>(url)
  const detail = mapLookupResponse(payload)
  if (detail.show == null && detail.episodes.length === 0) {
    throw new PodcastApiError('empty', `这个节目什么都没取回：${id}`)
  }
  return detail
}
