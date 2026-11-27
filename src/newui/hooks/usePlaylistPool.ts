import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getList } from '@/core/songlist'
import type { ListInfoItem } from '@/store/songlist/state'

import { NEW_UI_PLAYLIST_EMPTY, NEW_UI_POOL_PLACEHOLDER_TOTALS } from '@/newui/const'
import { PL_POOL_PAGING } from '@/newui/theme'

export interface PlaylistPoolState {
  /** 当前显示窗口内的歌单 */
  items: ListInfoItem[]
  /** 首批在途（整页空态用）；追加批期间恒 false，旧内容不被空态顶掉 */
  loading: boolean
  /** 首批失败文案；null 正常。追加批失败不写这里，见 batchFailed */
  error: string | null
  /** 计数 M：没取完时只认平台真实 total（取不到为 null），取完后换成实收条数 */
  totalCount: number | null
  /** 屏内已列出的歌单数 */
  shownCount: number
  /** 还有没露完或没取完的 */
  hasMore: boolean
  /** 追加批请求在途 */
  batchLoading: boolean
  /** 上一批请求失败 */
  batchFailed: boolean
  /** 触底：先推进本地窗口，见底且没取完才真实取下一页 */
  loadNextBatch: () => void
  /** 状态行点击：上一批失败则重打那一页，否则续取下一批 */
  loadMore: () => void
  /** 首批重试（整页空态场景） */
  reload: () => void
}

/**
 * 歌单页「推荐歌单池」分批续取：复用 `@/core/songlist.getList` 的分页缓存，不改其行为。
 *
 * - 网络层：pageRef 记最后成功页，逐页取回累加进 items（按 id 去重）；
 * - 显示层：shown 窗口每批推进 PL_POOL_PAGING.pageSize，触底先吃本地已有、见底才发请求；
 * - 防竞态：reqSeqRef 覆盖首屏 / 追加 / 重试全部请求，切分类或换平台后迟到旧页一律丢弃。
 *
 * 「取完」判定：① 某页空数组或整页重复 id；② 真实 total 已达。
 * mg/kw 分类分支的 total 是 SDK 占位值，已剔除不参与 ②。
 */
export const usePlaylistPool = (
  source: LX.OnlineSource | null,
  tagId: string,
  sortId: string,
): PlaylistPoolState => {
  const [items, setItems] = useState<ListInfoItem[]>([])
  const [shown, setShown] = useState<number>(PL_POOL_PAGING.pageSize)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchFailed, setBatchFailed] = useState(false)

  // 防竞态：只认最后一次发起的请求（首屏 / 追加 / 重试共用一条序号）
  const reqSeqRef = useRef(0)
  // 最后成功取回的那一页（0 = 还没有）；失败不推进，重试打同一页
  const pageRef = useRef(0)
  // 已收条目 id 集：跨页去重 + 「真实总数已达」判定的计数源
  const idsRef = useRef<Set<string>>(new Set())
  // state 的同步镜像：触底/点击回调要即时读，不等重渲染
  const itemsRef = useRef<ListInfoItem[]>([])
  // 泛型显式 number：PL_POOL_PAGING 是 as const，否则 pageSize 字面量会锁死窗口
  const shownRef = useRef<number>(PL_POOL_PAGING.pageSize)
  const busyRef = useRef(false) // 任一 fetchPage 在途，防触底连发
  const doneRef = useRef(false)
  const failedRef = useRef(false) // batchFailed 镜像：上一批失败时触底不自动重试

  const markDone = useCallback(() => {
    doneRef.current = true
    setDone(true)
  }, [])

  const markFail = useCallback((append: boolean) => {
    if (append) {
      // 追加批失败：旧内容留屏，状态行提示重试
      failedRef.current = true
      setBatchFailed(true)
    } else {
      setError(NEW_UI_PLAYLIST_EMPTY.poolFailed)
      setLoading(false)
    }
  }, [])

  /** 取一页：append=false 首屏语义（成功即整批替换），append=true 追加语义（去重累加） */
  const fetchPage = useCallback((page: number, append: boolean) => {
    if (!source) return
    const seq = ++reqSeqRef.current
    busyRef.current = true
    if (append) {
      setBatchLoading(true)
      setBatchFailed(false)
      failedRef.current = false
    } else {
      setLoading(true)
      setError(null)
    }
    void getList(source, tagId, sortId, page)
      .then(info => {
        if (seq !== reqSeqRef.current) return // 分类已切走：旧页整份作废
        busyRef.current = false
        setBatchLoading(false)
        // SDK 缺该源时 getList 可能以 undefined 兑现（不 reject），按失败处理
        if (!info || !Array.isArray(info.list)) {
          markFail(append)
          return
        }
        pageRef.current = page
        const list = info.list
        if (append) {
          const fresh = list.filter(item => !idsRef.current.has(item.id))
          for (const item of fresh) idsRef.current.add(item.id)
          if (fresh.length) {
            itemsRef.current = [...itemsRef.current, ...fresh]
            setItems(itemsRef.current)
          }
          // 判定①：空页 / 整页重复 = 平台给完
          if (!list.length || !fresh.length) markDone()
        } else {
          idsRef.current = new Set(list.map(item => item.id))
          itemsRef.current = list
          setItems(list)
          if (!list.length) markDone() // 整类为空：不再翻第二页
        }
        // 占位值与非正数一律按「平台没给总数」剔除
        const reported = Number(info.total)
        const trusted =
          Number.isFinite(reported) && reported > 0 && !NEW_UI_POOL_PLACEHOLDER_TOTALS.has(reported)
            ? reported
            : null
        setTotal(trusted)
        // 判定②：真实 total 已达 → 提前收口，省一次必空的下一页请求
        if (trusted != null && idsRef.current.size >= trusted) markDone()
        setLoading(false)
      })
      .catch(() => {
        if (seq !== reqSeqRef.current) return
        busyRef.current = false
        setBatchLoading(false)
        markFail(append)
      })
  }, [markDone, markFail, sortId, source, tagId])

  // 换分类 / 换平台 / 重进本页都回到第一批：先作废在途请求，清空两层状态，再重打第一页。
  const resetAndLoad = useCallback(() => {
    reqSeqRef.current += 1
    busyRef.current = false
    pageRef.current = 0
    idsRef.current = new Set()
    itemsRef.current = []
    shownRef.current = PL_POOL_PAGING.pageSize
    doneRef.current = false
    failedRef.current = false
    setItems([])
    setShown(PL_POOL_PAGING.pageSize)
    setTotal(null)
    setDone(false)
    setBatchLoading(false)
    setBatchFailed(false)
    void fetchPage(1, false)
  }, [fetchPage])

  useEffect(() => {
    resetAndLoad()
  }, [resetAndLoad])

  // 触底续取：还有没露完的同步推进窗口；见底且没取完 → 真实取下一页；上一批失败不自动重试。
  const loadNextBatch = useCallback(() => {
    if (busyRef.current) return
    // 首批还没成功落页（pageRef=0）：追加没有锚点，也不能越过第 1 页，直接挡掉
    if (pageRef.current === 0) return
    if (shownRef.current < itemsRef.current.length) {
      const next = Math.min(itemsRef.current.length, shownRef.current + PL_POOL_PAGING.pageSize)
      shownRef.current = next
      setShown(next)
      return
    }
    if (doneRef.current || failedRef.current) return
    void fetchPage(pageRef.current + 1, true)
  }, [fetchPage])

  // 状态行点击：失败则重打同一页（pageRef 只在成功时推进），否则续取
  const loadMore = useCallback(() => {
    if (busyRef.current) return
    if (failedRef.current) {
      void fetchPage(pageRef.current + 1, true)
      return
    }
    loadNextBatch()
  }, [fetchPage, loadNextBatch])

  const reload = useCallback(() => {
    void fetchPage(1, false)
  }, [fetchPage])

  const visible = useMemo(() => items.slice(0, shown), [items, shown])
  const shownCount = visible.length
  // 窗口没露完本地已有，或平台还没给完
  const hasMore = shownCount < items.length || !done
  // 取完前只用真实 total（null 时文案降级），取完后换成实收条数
  const totalCount = done ? items.length : total

  return {
    items: visible,
    loading,
    error,
    totalCount,
    shownCount,
    hasMore,
    batchLoading,
    batchFailed,
    loadNextBatch,
    loadMore,
    reload,
  }
}
