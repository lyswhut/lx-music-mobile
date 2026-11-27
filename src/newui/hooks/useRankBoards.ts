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
  /** 榜名 */
  name: string
  /** 按榜名算出的封面 key；null 时 UI 铺兜底封面。在数据层算一次，UI 只读结果 */
  coverKey: string | null
}

/** 排行榜页的一个平台分段 */
export interface RankBoardGroup {
  source: LX.OnlineSource
  /** 该平台全部榜数（不是已显示的数量） */
  total: number
  /** 落在当前显示窗口里的卡；组被截断时只有前段 */
  cards: RankBoardCard[]
}

export interface RankBoardsState {
  /** 可见分段（整序取前 shown 张后重新分组） */
  groups: RankBoardGroup[]
  /** 目录首载（整页空态用） */
  loading: boolean
  error: string | null
  /** 还有未显示的榜 */
  hasMore: boolean
  /** 重试请求在途（本地推进不置它） */
  batchLoading: boolean
  /** 有平台目录没取回来 */
  batchFailed: boolean
  /** 续取下一批：本地推进 shown，不发网络请求 */
  loadNextBatch: () => void
  /** 状态行点击：有失败平台则重取那几家，否则推进 shown */
  loadMore: () => void
}

/** 平台全目录的榜都做成卡：主打三类（热/新/飙）在前，其余按原序，不截断 */
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
 * 只排序：把当前内容平台的榜整体挪到最前，其余平台保持原相对顺序；不折叠、不隐藏。
 * preferred 为空或该平台无卡时原样返回同一引用。
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

/** 按显示窗口切平台分段：扫前 shown 张，source 一变就开新组；total 取全量目录里该平台总数 */
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
 * 排行榜页数据：当前音源覆盖的每个平台全目录上卡，按平台分段 + 分批续取。
 * 复用 `@/core/leaderboard.getBoardsList`（内部已按平台缓存），不改其行为。
 * 卡的顺序：当前内容平台的榜排最前，其余平台按注册顺序顺延；切平台只重排不重取目录。
 * 音源变更后重新过滤并加载。
 */
export const useRankBoards = (): RankBoardsState => {
  const platform = useContentPlatform()
  const preferred = platform.ready ? platform.source : null
  const [rawCards, setRawCards] = useState<RankBoardCard[]>([])
  const [failedSources, setFailedSources] = useState<LX.OnlineSource[]>([])
  const [loading, setLoading] = useState(true)
  const [batchLoading, setBatchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 泛型显式 number：RANK_PAGING 是 as const，否则 pageSize 字面量会锁死窗口
  const [shown, setShown] = useState<number>(RANK_PAGING.pageSize)
  const aliveRef = useRef(true)

  // 换平台时显示窗口回到第一屏：只复位窗口，不重新拉目录
  const lastPreferredRef = useRef(preferred)
  useEffect(() => {
    if (lastPreferredRef.current === preferred) return
    lastPreferredRef.current = preferred
    setShown(RANK_PAGING.pageSize)
  }, [preferred])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    // 音源覆盖 = global.lx.qualityList；还没选音源时为空，此时不过滤平台，
    // 只有音源明确不覆盖某平台才剔除。
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
      // 目录整份一次在手，页面靠 shown 窗口分批露出
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

  // 设置还没读回时不排序，避免先按默认平台闪一次
  const orderedCards = useMemo(
    () => rankCardsWithPlatformFirst(rawCards, preferred),
    [preferred, rawCards],
  )

  const groups = useMemo(() => groupVisibleCards(orderedCards, shown), [orderedCards, shown])
  const hasMore = shown < orderedCards.length

  // 本地推进显示窗口，同步多露一批。Math.max 保底不回退：目录首载期间
  // 尺寸变化信号可能先到，此时空表会把窗口清零、网格假空。
  const loadNextBatch = useCallback(() => {
    setShown(prev => Math.max(prev, Math.min(orderedCards.length, prev + RANK_PAGING.pageSize)))
  }, [orderedCards.length])

  // 部分平台目录首载失败 → 状态行给重试入口；重取只打失败那几家，避免整页白屏。
  const retryFailedSources = useCallback(() => {
    setBatchLoading(true)
    void Promise.allSettled(
      failedSources.map(async source => pickBoards(source, await getBoardsList(source))),
    ).then(results => {
      if (!aliveRef.current) return
      const gained: RankBoardCard[] = []
      const stillFailed: LX.OnlineSource[] = []
      results.forEach((item, index) => {
        // 平台名按 index 回查入参（allSettled 保序）
        if (item.status === 'fulfilled') gained.push(...item.value)
        else stillFailed.push(failedSources[index])
      })
      if (gained.length) setRawCards(prev => [...prev, ...gained])
      setFailedSources(stillFailed)
      setBatchLoading(false)
    })
  }, [failedSources])

  // 状态行点击：有没取回的平台则真实重取，否则推进窗口
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
