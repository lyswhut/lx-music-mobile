import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getList } from '@/core/songlist'
import type { ListInfoItem } from '@/store/songlist/state'

import { NEW_UI_PLAYLIST_EMPTY, NEW_UI_POOL_PLACEHOLDER_TOTALS } from '@/newui/const'
import { PL_POOL_PAGING } from '@/newui/theme'

export interface PlaylistPoolState {
  /** 当前显示窗口内的歌单（原型 pool.slice(0, shown)，#plPoolGrid 直接渲染这一份） */
  items: ListInfoItem[]
  /** 首批（第一页）在途：整页空态用。追加批期间恒 false —— 旧内容留在屏上不被空态顶掉（轮 7b 白屏教训） */
  loading: boolean
  /** 首批失败的整页文案；null 正常。追加批失败不写这里（首批必然已成），见 batchFailed */
  error: string | null
  /** 计数用的 M：没取完时只认平台真实 total（SDK 占位值已剔除，取不到传 null）；取完后换成实收条数 */
  totalCount: number | null
  /** 屏内已列出的歌单数（原型 shown） */
  shownCount: number
  /** 还有没露完/没取完的（原型 shown < pool.length） */
  hasMore: boolean
  /** 追加批请求在途（状态行「正在载入下一批…」+ disabled） */
  batchLoading: boolean
  /** 上一批真实请求失败（网络 reject 驱动；原型「第 3 批故意失败」的演示路径不搬） */
  batchFailed: boolean
  /** 触底信号：先推进本地显示窗口，窗口见底且没取完才真实取下一页 */
  loadNextBatch: () => void
  /** 状态行点击：上一批失败 → 重打那一页（真实异步）；否则续取下一批 */
  loadMore: () => void
  /** 首批重试（整页空态场景；当前页面未接，保留原接口能力） */
  reload: () => void
}

/**
 * 歌单页「推荐歌单池」分批续取（原型 app.js L657-679：「推荐目录和歌单详情一样是分页取的：
 * 真实侧『发现』页一页一页往下翻，翻到平台给完为止。每屏落 10 份，滚到底自动取下一批」）。
 * 只调既有 `@/core/songlist` 的 getList(source, tagId, sortId, page)，不改其行为、不绕它的分页缓存。
 *
 * 状态机（两层，都对齐原型）：
 * - 网络层：pageRef 记最后成功页，一页一页取回**累加**进 items（按 id 去重，防平台末页回显重复批）；
 * - 显示层：shown 窗口每批推进 PL_POOL_PAGING.pageSize=10 份，触底先吃本地已有的、见底才发请求。
 *
 * 防竞态（reqSeqRef）从「只认最后一次首屏请求」升级为**覆盖全部请求路径**（首屏 / 追加 / 重试共用
 * 一条请求序号）：切分类/换平台使 fetchPage 标识变化 → resetAndLoad 先增序号作废旧批在途请求，
 * 迟到的旧页（含追加页）一律丢弃，不会出现旧分类的追加结果拼进新分类的列表。
 *
 * 「取完」判定（两条件取稳，读码核实）：
 * ① 某页返回空数组、或整页全是重复 id（零新增）—— 平台给完了，对所有平台恒真，是兜底稳态；
 * ② 真实 total 已达（ids.size >= total）—— wy/tx/kg 的 total 来自平台响应
 *   （wy/songList.js L227、tx/songList.js L212、kg/songList.js L943），省一次必空的下一页请求；
 *   mg/kw 分类分支的 total 是 SDK 写死的占位值（见 NEW_UI_POOL_PLACEHOLDER_TOTALS 注释），
 *   直接按「没有总数」剔除，不参与 ②。首批返回空列表也记取完（这一类压根没有，不再翻第二页）。
 *
 * 「当前平台的歌单排最前」（原型 plPool L668-670）在真实数据下**天然成立**：
 * getList(source, …) 按平台取数，池子里每一条都来自当前 in-hand 的 source，无跨平台混排可排，
 * 故不做第二轮排序（不为排而排）。
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
  // 泛型显式 number：PL_POOL_PAGING 是 as const，pageSize 推断成字面量 10 会把窗口/镜像锁死（useRankBoards L137 同款坑）
  const shownRef = useRef<number>(PL_POOL_PAGING.pageSize)
  const busyRef = useRef(false) // 任一 fetchPage 在途（防触底连发重复请求）
  const doneRef = useRef(false)
  const failedRef = useRef(false) // batchFailed 镜像：上一批失败时触底不自动重试（重试入口留给状态行点击）

  const markDone = useCallback(() => {
    doneRef.current = true
    setDone(true)
  }, [])

  const markFail = useCallback((append: boolean) => {
    if (append) {
      // 追加批失败：旧内容留在屏上，尾巴状态行换成「这一批没有载入 · 点击重试」
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
        if (seq !== reqSeqRef.current) return // 分类已切走：旧页（含迟到的追加页）整份作废
        busyRef.current = false
        setBatchLoading(false)
        // SDK 缺该源时 core/songlist 的可选链会让 getList 以 undefined 兑现（不 reject）——按失败处理，不硬解引用
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
          // 稳态判定①：空页 / 整页重复 = 平台给完（占位 total 的平台全靠这条收口）
          if (!list.length || !fresh.length) markDone()
        } else {
          idsRef.current = new Set(list.map(item => item.id))
          itemsRef.current = list
          setItems(list)
          if (!list.length) markDone() // 整类为空：不再翻第二页
        }
        // 真实总数：占位值（mg 99999 / kw 分类分支 1000）与非正数一律按「平台没给总数」剔除
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

  // 换分类 / 换平台 / 重新进这一页都回到第一批（原型 resetPlPool L674-679）：
  // 序号先加一作废所有在途请求，再清空两层状态，最后重打第一页。
  // 重进本页 = 组件重挂载，state/refs 初值即第一批形态，本回调随挂载跑一次首屏请求。
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

  // 触底续取（原型滚动监听 → loadPlPoolPage）：手里还有没露完的 → 同步推进窗口（不发请求，
  // 正常续取时状态行不会被看见）；窗口见底且没取完 → 真实取下一页；上一批失败不自动重试。
  const loadNextBatch = useCallback(() => {
    if (busyRef.current) return
    // 首批还没成功落过页（pageRef=0：首屏在途或首屏失败）：追加没有锚点，
    // 更不能越过第 1 页去取第 2 页（整页漏歌）。首屏的入口在 reload/整页空态，不在这里。
    // （2026-10-15 触底重估补强后，尺寸变化也可能在没有滚动事件时发来信号，这道闸必须前置）
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

  // 状态行点击（原型 plPoolStatusRow onclick）：失败 → 重打同一页（pageRef 只在成功时推进）；否则续取
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
  // 原型 paintPlPool L762 的「还有没取完的」：窗口没露完本地已有 ∪ 平台还没给完
  const hasMore = shownCount < items.length || !done
  // 计数 M：取完前只用真实 total（占位值已剔除 → null → 文案降级）；取完后换成实收条数（真实全量）
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
