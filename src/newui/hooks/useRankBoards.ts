import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getBoardsList } from '@/core/leaderboard'
import leaderboardState from '@/store/leaderboard/state'
import type { BoardItem } from '@/store/leaderboard/state'
import { assertApiSupport } from '@/utils/tools'

import {
  NEW_UI_RANK_EMPTY,
  isRankBoardFeatured,
  rankCoverKey,
} from '@/newui/const'
import { RANK_PAGING } from '@/newui/theme'

import { useContentPlatform } from './useContentPlatform'

/** 排行榜页的一张榜单卡数据 */
export interface RankBoardCard {
  /** 榜单 id，形如 {source}__{bangId}（与 core/leaderboard 的取数坐标一致） */
  id: string
  source: LX.OnlineSource
  /** 榜名（.rk-name） */
  name: string
  /**
   * 真实封面 key（.rk-card 主脸）：由 `rankCoverKey(name)` 按原型 `RANK_COVER_WORDS` 判据表算出，
   * 命不中为 null —— null 时 ChartArt 铺 default 那张兜底封面（原型 chartFace 的 `?? RANK_COVER_DEFAULT` 同款）。
   * 在数据层算一次（目录整份在手，179 张卡每帧重查名字没必要），UI 只读结果。
   */
  coverKey: string | null
}

/** 排行榜页的一个平台分段（原型 .rank-group + 其后连续的同平台 .rk-card） */
export interface RankBoardGroup {
  source: LX.OnlineSource
  /** 组头「N 个榜」的 N = 该平台目录里的全部榜数（不是已显示的那几排） */
  total: number
  /** 落在当前显示窗口（shown）里的卡；组被窗口从中间截断时只有前段 */
  cards: RankBoardCard[]
}

export interface RankBoardsState {
  /** 可见分段（按平台前置 + 组内主打在前的整序取前 shown 张后重新分组） */
  groups: RankBoardGroup[]
  /** 目录首载（整页空态用它，语义与旧版一致） */
  loading: boolean
  error: string | null
  /** 手里还有未显示的榜（原型 shown < charts.length） */
  hasMore: boolean
  /** 重试请求在途（原型 rnkLoading；本地推进不置它，只有真实目录重取会） */
  batchLoading: boolean
  /** 有平台目录没取回来（原型 rnkFailed 的真实对应物；演示用假失败不搬） */
  batchFailed: boolean
  /** 滚到底续取下一批：本地推进 shown（目录一次性在手，不再发网络请求） */
  loadNextBatch: () => void
  /** 状态行点击：有失败平台 → 重取那几家目录（真实异步，走 batchLoading）；否则推进 shown */
  loadMore: () => void
}

/**
 * 平台上全目录的榜都做成卡片（第 7b 轮撤掉了每平台截 6 张的 `NEW_UI_RANK_PER_PLATFORM`——
 * 原型注释：截断等于把剩下的榜藏起来，用户问「其他榜呢」就是这条）。
 * 组内只排序不截断：主打三类（热/新/飙）在前，其余按平台目录原序（rankView L479-482）。
 */
const pickBoards = (source: LX.OnlineSource, list: BoardItem[]): RankBoardCard[] => {
  const featured: BoardItem[] = []
  const rest: BoardItem[] = []
  for (const board of list) {
    if (isRankBoardFeatured(board.name)) featured.push(board)
    else rest.push(board)
  }
  return [...featured, ...rest].map(board => ({
    id: board.id,
    source,
    name: board.name,
    coverKey: rankCoverKey(board.name),
  }))
}

/**
 * 纯函数（本轮唯一判定）：**只排序** —— 把当前内容平台的榜整体挪到最前，
 * 其余平台保持原有相对顺序顺延；不折叠、不隐藏、不删任何平台的榜。
 * 稳定性靠「两组各自 push 顺序不变」；同一平台的卡在输入里本就连续，
 * 所以挪完仍然是「一个平台一整段」，不会被打散交错。
 * preferred 为空（持久化设置还没读回）或该平台压根没上卡 → 原样返回同一个引用。
 */
export const rankCardsWithPlatformFirst = (
  cards: RankBoardCard[],
  preferred: LX.OnlineSource | null,
): RankBoardCard[] => {
  if (!preferred) return cards
  const first: RankBoardCard[] = []
  const later: RankBoardCard[] = []
  for (const card of cards) (card.source === preferred ? first : later).push(card)
  return first.length ? [...first, ...later] : cards
}

/** 把「有序全量卡」按显示窗口切成平台分段（原型 paintRankGrid L556-562 的同款扫描）：
 * 顺序扫描前 shown 张，source 一变就开一个新组；组的 total 取全量目录里该平台的总数 */
const groupVisibleCards = (
  ordered: RankBoardCard[],
  shown: number,
): RankBoardGroup[] => {
  const totals = new Map<LX.OnlineSource, number>()
  for (const card of ordered) totals.set(card.source, (totals.get(card.source) ?? 0) + 1)
  const groups: RankBoardGroup[] = []
  let lastSource: LX.OnlineSource | null = null
  for (const card of ordered.slice(0, shown)) {
    if (card.source !== lastSource) {
      lastSource = card.source
      groups.push({ source: card.source, total: totals.get(card.source) ?? 0, cards: [] })
    }
    groups[groups.length - 1].cards.push(card)
  }
  return groups
}

/**
 * 排行榜页数据（原型 #rankGrid）：当前音源覆盖的每个平台**全目录**上卡，按平台分段 + 分批续取。
 * 复用既有 `@/core/leaderboard.getBoardsList`（内部已按平台缓存），不改其行为；
 * 原型 activeSource 缺省 'all' + chartsForView 按 supports() 过滤 —— 这里对应
 * leaderboardState.sources（注册了榜单入口的平台）∩ assertApiSupport（当前音源能覆盖的平台）。
 * 音源变更（apiSourceUpdated）后重新过滤并加载。
 *
 * 卡的顺序（2026-10-12 用户清单第 5 条 + 第 7b 轮）：**当前内容平台的榜单排最前**，其余平台按注册顺序顺延。
 * 这里读 `useContentPlatform` 只用来**排序**（五平台照旧全列，不折叠不隐藏）：
 * 切平台只是快照换新 → useMemo 重排，**不重新取目录**（重取会把 loading 拉起、
 * 网格瞬间换成空态文案造成白屏闪烁；`getBoardsList` 虽有缓存，重取的代价在 UI 不在网络）。
 * 本轮唯一的联动：内容平台变了，显示窗口回到第一屏（原型 renderRankPage L537-541 →
 * resetRankPage：只复位 shown，不动数据快照）。
 * 卡片 key 是稳定的榜单 id，重排只挪位置不重建视图。
 */
export const useRankBoards = (): RankBoardsState => {
  const platform = useContentPlatform()
  const preferred = platform.ready ? platform.source : null
  const [rawCards, setRawCards] = useState<RankBoardCard[]>([])
  const [failedSources, setFailedSources] = useState<LX.OnlineSource[]>([])
  const [loading, setLoading] = useState(true)
  const [batchLoading, setBatchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 泛型显式 number：RANK_PAGING 是 as const，pageSize 推断成字面量 8 会把窗口锁死
  const [shown, setShown] = useState<number>(RANK_PAGING.pageSize)
  const aliveRef = useRef(true)

  // 原型 resetRankPage：换平台 / 重进本页回到第一屏。重进 = 组件重挂载（shown 初值即第一屏），
  // 换平台 = 这里监听 preferred 变化；**只复位窗口，不重新拉目录**（理由见上方注释）。
  const lastPreferredRef = useRef(preferred)
  useEffect(() => {
    if (lastPreferredRef.current === preferred) return
    lastPreferredRef.current = preferred
    setShown(RANK_PAGING.pageSize)
  }, [preferred])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    // 原型 chartsForView 按 supports() 过滤平台。真实侧「音源覆盖」= global.lx.qualityList；
    // 但用户还没选音源时 qualityList 为空 —— 榜单目录本身来自内置 SDK、与音源无关，
    // 这时不该把五个平台全隐藏；只有音源「明确不覆盖」某平台才过滤掉。
    const qualityList = global.lx.qualityList ?? {}
    const hasApiSource = Object.keys(qualityList).length > 0
    const targets = leaderboardState.sources.filter(
      source => !hasApiSource || assertApiSupport(source),
    )
    if (!targets.length) {
      setRawCards([])
      setFailedSources([])
      setError(NEW_UI_RANK_EMPTY.noBoards)
      setLoading(false)
      return
    }
    void Promise.allSettled(
      targets.map(async source => pickBoards(source, await getBoardsList(source))),
    ).then(results => {
      if (!aliveRef.current) return
      const next: RankBoardCard[] = []
      const failed: LX.OnlineSource[] = []
      results.forEach((item, index) => {
        if (item.status === 'fulfilled') next.push(...item.value)
        else failed.push(targets[index])
      })
      // 目录整份一次在手（真实平台一个可达三四十个榜），页面靠 shown 窗口分批露出
      setRawCards(next)
      setFailedSources(failed)
      if (!next.length) setError(NEW_UI_RANK_EMPTY.failed)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    aliveRef.current = true
    load()
    const handleApiSource = () => load()
    global.state_event.on('apiSourceUpdated', handleApiSource)
    return () => {
      aliveRef.current = false
      global.state_event.off('apiSourceUpdated', handleApiSource)
    }
  }, [load])

  // 设置还没读回时不排序（避免先按默认平台闪一次再跳回真实平台）
  const orderedCards = useMemo(
    () => rankCardsWithPlatformFirst(rawCards, preferred),
    [preferred, rawCards],
  )

  const groups = useMemo(() => groupVisibleCards(orderedCards, shown), [orderedCards, shown])
  const hasMore = shown < orderedCards.length

  // 本地推进显示窗口：发无谓网络请求的事不做，原型的假延时也不搬——同步多露 8 张。
  // Math.max 保底不回退（2026-10-15 触底补强配套）：目录首载期间 PageViewport 的尺寸变化补判
  // 也可能发来信号，此时 orderedCards 还是空表，min(0, prev+8) 会把窗口清零、网格假空一档。
  const loadNextBatch = useCallback(() => {
    setShown(prev => Math.max(prev, Math.min(orderedCards.length, prev + RANK_PAGING.pageSize)))
  }, [orderedCards.length])

  // 真实失败路径：某平台目录首载失败（全 Settle 不阻断别人）→ 尾巴状态行给重试入口。
  // 重取只打失败那几家（成功的平台不动，避免整页 loading 白屏闪烁）。
  const retryFailedSources = useCallback(() => {
    setBatchLoading(true)
    void Promise.allSettled(
      failedSources.map(async source => pickBoards(source, await getBoardsList(source))),
    ).then(results => {
      if (!aliveRef.current) return
      const gained: RankBoardCard[] = []
      const stillFailed: LX.OnlineSource[] = []
      results.forEach((item, index) => {
        // rejected 的 value 是异常对象，平台名按 index 回查入参（allSettled 保序）
        if (item.status === 'fulfilled') gained.push(...item.value)
        else stillFailed.push(failedSources[index])
      })
      if (gained.length) setRawCards(prev => [...prev, ...gained])
      setFailedSources(stillFailed)
      setBatchLoading(false)
    })
  }, [failedSources])

  // 状态行点击（原型 rnkStatusRow 的 onclick = loadRankPage）：
  // 有没取回的平台 → 真实重取（期间 batchLoading 给「正在载入下一批…」）；否则推进窗口
  const loadMore = useCallback(() => {
    if (batchLoading) return
    if (failedSources.length) retryFailedSources()
    else loadNextBatch()
  }, [batchLoading, failedSources.length, loadNextBatch, retryFailedSources])

  return {
    groups,
    loading,
    error,
    hasMore,
    batchLoading,
    batchFailed: failedSources.length > 0,
    loadNextBatch,
    loadMore,
  }
}
