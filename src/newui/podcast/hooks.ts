/**
 * 电台（播客）界面层要用的 hook。
 *
 * **这里不写任何样式与文案**：只做取数、本地分页推进、本机状态读写，
 * 返回的都是视图模型与状态标志。屏上的词（「正在载入这一区…」「这一区没有取到名单 · 点击重试」
 * 「N 个节目」「还剩 X」）由界面层从 `const/radio.ts` 的文案表取（本轮不产，见工单边界）。
 *
 * 五个 hook 各自对应原型的一处行为：
 * `usePodcastChart` ← `loadPodRegion` / `loadPodChartPage` / `podChartScroll`（app.js L1953-L1993）
 * `usePodcastDetail` ← `openPodcast`（L1998，接口给多少集就多少集，不分页）
 * `usePodcastSearch` ← `submitPodSearch` / `podHitsOf` / `rememberPodQuery`（L2078-L2152）
 * `usePodSubs` ← `podSubIds` / `unsubPod`（L1786 / L1844）
 * `usePodProgress` ← `podProgressOf` / `podSaveProgress`（L1789-L1794，落盘点 L2238）
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { POD_CHART_PAGING } from '@/newui/theme'

import {
  type PodcastApiErrorKind,
  fetchPodcastDetail,
  fetchPodcastTopChart,
  isPodcastApiError,
  searchPodcasts,
} from './api'
import {
  addPodSub,
  clearPodSearchHistory,
  getPodProgressEntries,
  getPodProgressOf,
  getPodSearchHistory,
  getPodSubs,
  isPodSubscribed,
  loadPodLocalState,
  rememberPodSearch,
  removePodSub,
  savePodProgress,
  subscribePodLocalState,
  togglePodSub,
} from './localState'
import { mapChartItems } from './mappers'
import type {
  PodEpisodeRow,
  PodProgressEntry,
  PodShowRow,
  PodSubEntry,
} from './types'

/* ================= 内部：本机状态订阅（三个本机 hook 共用） ================= */

/**
 * 本机三项状态任一处变化 → 版本号递增，逼本组件重渲染。
 * 值直接从 `localState` 的 getter 现取（模块级缓存），不另存一份 state：
 * 电台首页 / 详情屏 / 单集屏分属不同屏幕树，多一份 state 就多一处不同步（判例 recentPlay）。
 */
const usePodLocalVersion = (): number => {
  const [version, setVersion] = useState(0)
  useEffect(
    () => subscribePodLocalState(() => { setVersion(v => v + 1) }),
    [],
  )
  useEffect(() => {
    void loadPodLocalState()
  }, [])
  return version
}

/** 取数失败时把 kind 收成界面能直接用的标志；非本项目错误（不该发生）也算失败，只是没 kind */
const toErrorKind = (error: unknown): PodcastApiErrorKind | null =>
  isPodcastApiError(error) ? error.kind : null

/* ================= 一、排行榜（含一次 10 条的本地分页） ================= */

export interface PodChartState {
  /** 当前批次已铺开的榜行（`items.slice(0, shown)`；首批 10 条） */
  rows: PodShowRow[]
  /** 这一区接口给回的总条数（实测固定 50），组头 / 「没有更多了」判定用 */
  total: number
  /** 整区取数在途 → 界面摆「正在载入这一区…」（原型 podFetching / regionLoading） */
  loading: boolean
  /** 这一区没取到 → 界面摆「这一区没有取到名单 · 点击重试」（原型 regionFail）。
   *  契约要的就是这两态分得开：**取不到不假装榜是空的**，所以失败时 rows 保持空、由 `failed` 说话 */
  failed: boolean
  /** 手里还有没铺完的批次（原型 `podShown < list.length`） */
  hasMore: boolean
  /** 还剩几行没铺（界面写状态行时用得上；`hasMore` 为 false 时是 0） */
  remaining: number
  /** 失败的那一类原因（timeout / network / http / decode / empty / unsupported_region），界面一般只用 `failed` */
  errorKind: PodcastApiErrorKind | null
  /**
   * **本地切片推进**，不发请求：接口一次就给满 50 条（`fetchPodcastTopChart` 已在上面那次
   * 区域取数里跑完），这里的「续取」只是把 `shown` 再往前推 `POD_CHART_PAGING.pageSize`（10）条，
   * 到 50 为止。所以这条路径没有 loading / 没有失败——原型「第 3 批故意先失败一次」是演示用的
   * 假失败（同 `useRankBoards` 那条注），不搬。距底 160px 的触底判定在界面层
   * （`useViewportScroll` + `POD_CHART_PAGING.endReachedDistance`），这里只认调用。
   */
  loadNextBatch: () => void
  /** 重取当前这一区（换区不走这里：换区由 `country` 变化自动触发） */
  retry: () => void
}

/**
 * 一个区的排行榜。`country` 是地区抽屉挑中的国家码（默认区见 `const/radio.ts`
 * `NEW_UI_POD_REGION_DEFAULT`，固定 `'cn'`，不记上次区）。
 * 每次进层固定在默认区由界面层保证（hook 只跟随 `country` 变化重取）。
 */
export const usePodcastChart = (country: string): PodChartState => {
  const [items, setItems] = useState<PodShowRow[]>([])
  // 显式标 number：POD_CHART_PAGING 是 `as const`，不标就会被推成字面量类型 10，推进时就赋不进去
  const [shown, setShown] = useState<number>(POD_CHART_PAGING.pageSize)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [errorKind, setErrorKind] = useState<PodcastApiErrorKind | null>(null)
  // 请求代次：换区 / 重试时旧请求晚回来也不许盖新数据（原型 submitPodSearch 那句「词中途被换掉」同口径）
  const requestIdRef = useRef(0)

  const load = useCallback(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setFailed(false)
    setErrorKind(null)
    fetchPodcastTopChart(country)
      .then(raw => {
        if (requestIdRef.current !== requestId) return
        setItems(mapChartItems(raw))
        setShown(POD_CHART_PAGING.pageSize)
        setLoading(false)
      })
      .catch(error => {
        if (requestIdRef.current !== requestId) return
        // 失败就把榜清干净：让状态行说话，不拿上一区的行冒充这一区
        setItems([])
        setShown(POD_CHART_PAGING.pageSize)
        setErrorKind(toErrorKind(error))
        setFailed(true)
        setLoading(false)
      })
  }, [country])

  useEffect(() => {
    load()
    return () => {
      // 退层后晚回来的响应不许落 state：把代次抬一格，那一发就作废（换区同样靠它挡旧榜）
      requestIdRef.current += 1
    }
  }, [load])

  const loadNextBatch = useCallback(() => {
    // 纯本地推进：够了直接忽略，界面层的触底回调因此可以放心反复调
    setShown(current =>
      current >= items.length ? current : Math.min(items.length, current + POD_CHART_PAGING.pageSize),
    )
  }, [items.length])

  return {
    rows: items.slice(0, shown),
    total: items.length,
    loading,
    failed,
    hasMore: shown < items.length,
    remaining: Math.max(0, items.length - shown),
    errorKind,
    loadNextBatch,
    retry: load,
  }
}

/* ================= 二、详情与单集 ================= */

export interface PodDetailState {
  /** 节目本体（hero 用）；接口没回节目本体时为 null */
  show: PodShowRow | null
  /** 这一批取回的单集（**不分页**：`entity` 没有 offset，给多少就是多少，尾上不放「加载更多」） */
  episodes: PodEpisodeRow[]
  loading: boolean
  failed: boolean
  errorKind: PodcastApiErrorKind | null
  retry: () => void
}

/**
 * 一个节目的详情 + 单集列。`showId` 来自榜行 / 命中行的 `id`（U81→U82 的 passProps 那五项里的 id）。
 * 界面层拿到 `show` 后可以与 passProps 带过来的那五项并排用（原型 `openPodcast(s)` 用的是列表带过来的那份）。
 */
export const usePodcastDetail = (showId: string): PodDetailState => {
  const [show, setShow] = useState<PodShowRow | null>(null)
  const [episodes, setEpisodes] = useState<PodEpisodeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [errorKind, setErrorKind] = useState<PodcastApiErrorKind | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setFailed(false)
    setErrorKind(null)
    fetchPodcastDetail(showId)
      .then(detail => {
        if (requestIdRef.current !== requestId) return
        setShow(detail.show)
        setEpisodes(detail.episodes)
        setLoading(false)
      })
      .catch(error => {
        if (requestIdRef.current !== requestId) return
        setShow(null)
        setEpisodes([])
        setErrorKind(toErrorKind(error))
        setFailed(true)
        setLoading(false)
      })
  }, [showId])

  useEffect(() => {
    load()
    return () => {
      // 退层后晚回来的响应不许落 state（契约 7.3：pop 与系统返回同一条出口）
      requestIdRef.current += 1
    }
  }, [load])

  return { show, episodes, loading, failed, errorKind, retry: load }
}

/* ================= 三、搜节目 + 搜词历史 ================= */

export interface PodSearchState {
  /** 上一次**提交**的关键词（不是输入框里的实时文本——输入框归界面层自己管） */
  keyword: string
  /** 提交过至少一次真实搜索：区分「还没输入」的空闲态与「输入了但零条」的空态 */
  searched: boolean
  /** 命中行（最多 20 条，接口侧就按 20 请求，同原型截 20 的口径 app.js L2089） */
  results: PodShowRow[]
  loading: boolean
  failed: boolean
  errorKind: PodcastApiErrorKind | null
  /** 提交搜索：空词忽略（原型 `submitPodSearch` L2138），并顺手把词记进本机历史 */
  search: (term: string) => void
  /** 回到空闲态（清空输入那颗；只清结果，不动本机历史） */
  reset: () => void
  retry: () => void
  /** 搜过的词（最多 8 条，新词在前） */
  history: string[]
  clearHistory: () => void
}

export const usePodcastSearch = (): PodSearchState => {
  const version = usePodLocalVersion()
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<PodShowRow[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [errorKind, setErrorKind] = useState<PodcastApiErrorKind | null>(null)
  const requestIdRef = useRef(0)
  // 重试要认得出是哪一次请求，成功覆盖后就不再重放旧词
  const lastTermRef = useRef('')

  const run = useCallback((term: string) => {
    const word = term.trim()
    if (!word) return
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    lastTermRef.current = word
    setKeyword(word)
    setSearched(true)
    setLoading(true)
    setFailed(false)
    setErrorKind(null)
    // 提交即记词（原型 submitPodSearch 里先 rememberPodQuery 再发请求，L2139-2140）
    rememberPodSearch(word)
    searchPodcasts(word)
      .then(rows => {
        if (requestIdRef.current !== requestId) return
        setResults(rows)
        setLoading(false)
      })
      .catch(error => {
        if (requestIdRef.current !== requestId) return
        setResults([])
        setErrorKind(toErrorKind(error))
        setFailed(true)
        setLoading(false)
      })
  }, [])

  const reset = useCallback(() => {
    requestIdRef.current += 1 // 让在途的那一发作废
    lastTermRef.current = ''
    setKeyword('')
    setSearched(false)
    setResults([])
    setLoading(false)
    setFailed(false)
    setErrorKind(null)
  }, [])

  const retry = useCallback(() => {
    if (lastTermRef.current) run(lastTermRef.current)
  }, [run])

  useEffect(() => () => {
    // 退层后晚回来的命中不许落 state（同「词中途被换掉」那条口径，app.js L2148）
    requestIdRef.current += 1
  }, [])

  // version 只为在历史变化时重新现取（结果 / 输入态与本机历史无关）
  void version
  return {
    keyword,
    searched,
    results,
    loading,
    failed,
    errorKind,
    search: run,
    reset,
    retry,
    history: getPodSearchHistory(),
    clearHistory: clearPodSearchHistory,
  }
}

/* ================= 四、订阅名单 ================= */

export interface PodSubsState {
  /** 名单快照（新收的在前；每项链带卡片要显示的四栏，理由见 localState 文件头） */
  subs: PodSubEntry[]
  /** 「N 个节目」的 N（原型 `POD_TXT.subsSub(shows.length)`） */
  count: number
  /** 某个节目收没收 */
  isSubbed: (id: string) => boolean
  add: (entry: PodSubEntry) => void
  /** 取消收听（原型 unsubPod）：只移除本机的这条，不写回任何平台 */
  remove: (id: string) => void
  toggle: (entry: PodSubEntry) => boolean
}

export const usePodSubs = (): PodSubsState => {
  const version = usePodLocalVersion()
  void version
  return {
    subs: getPodSubs(),
    count: getPodSubs().length,
    isSubbed: isPodSubscribed,
    add: addPodSub,
    remove: removePodSub,
    toggle: togglePodSub,
  }
}

/* ================= 五、单集收听进度 ================= */

export interface PodProgressState {
  /** 整表（最多 8 条，新记录在前） */
  entries: PodProgressEntry[]
  /** 某个节目的进度；没听过返回 null——原型那句「没听过就不写这一行，不编『未听』这种话」（app.js L1832） */
  progressOf: (id: string) => PodProgressEntry | null
  /**
   * 落盘「还剩多少秒」。门都在这条函数里（`left <= 20` 不写、同节目只留最近一条、整表 8 条），
   * 界面层在关层处（含 Android 系统返回）直接调就行。
   * `left` 传**秒**（`Math.round(总时长 - 当前秒)`，原型 closeEpisodeLayer L2237）。
   */
  save: (id: string, idx: number, left: number) => void
}

export const usePodProgress = (): PodProgressState => {
  const version = usePodLocalVersion()
  void version
  return {
    entries: getPodProgressEntries(),
    progressOf: getPodProgressOf,
    save: savePodProgress,
  }
}
