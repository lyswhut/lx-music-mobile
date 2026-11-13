import { useCallback, useEffect, useRef, useState } from 'react'

import { getBoardsList, getListDetail } from '@/core/leaderboard'
import type { BoardItem } from '@/store/leaderboard/state'
import { getLeaderboardSetting } from '@/utils/data'

import { NEW_UI_HOME_LIMITS } from '@/newui/const'

import { useContentPlatform } from './useContentPlatform'

export interface HomeRanksState {
  /** 榜单切换条（取该平台榜单列表的前 tabLimit 个） */
  tabs: BoardItem[]
  /** 当前选中的榜单 id，形如 {source}__{bangId} */
  activeId: string
  /** 当前榜单的曲目（首页只展示前 songLimit 首） */
  songs: LX.Music.MusicInfoOnline[]
  loading: boolean
  error: string | null
  /** 切换榜单 */
  selectTab: (id: string) => void
  reload: () => void
}

/**
 * 首页「热门单曲」数据：当前内容平台的一组榜单 + 选中榜单的前 N 首。
 * 复用既有 `@/core/leaderboard`（自带缓存）；平台跟随 useContentPlatform
 * （音源浮层「音乐平台」组切换后经脉冲自动重取），boardId 连续性仍读
 * `getLeaderboardSetting()`——旧平台的榜 id 不在新平台列表里时退回第一个榜（原逻辑天然处理）。
 * 目录取数走内置 SDK、与音源无关；切到取不到目录的平台时走 error 口径，不白屏不永转。
 * @param tabLimit 切换条放几个榜，默认 NEW_UI_HOME_LIMITS.rankTabs（原型 HOME_RANK_TAB_LIMIT=4，app.js L356）
 * @param songLimit 放几首歌，默认 NEW_UI_HOME_LIMITS.rankSongs（原型 HOME_SONG_LIMIT=10，app.js L357）
 */
export const useHomeRanks = (
  tabLimit = NEW_UI_HOME_LIMITS.rankTabs,
  songLimit = NEW_UI_HOME_LIMITS.rankSongs,
): HomeRanksState => {
  const platform = useContentPlatform()
  const [tabs, setTabs] = useState<BoardItem[]>([])
  const [activeId, setActiveId] = useState('')
  const [songs, setSongs] = useState<LX.Music.MusicInfoOnline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const aliveRef = useRef(true)

  const loadSongs = useCallback((id: string) => {
    setLoading(true)
    setError(null)
    void getListDetail(id, 1)
      .then(detail => {
        if (!aliveRef.current) return
        setSongs(detail.list.slice(0, songLimit))
        setLoading(false)
      })
      .catch(() => {
        if (!aliveRef.current) return
        setError('这张榜暂时打不开 · 换一张试试')
        setLoading(false)
      })
  }, [songLimit])

  const load = useCallback(() => {
    // 持久化设置还没读回时不发请求，避免默认平台与真实平台各取一次目录
    if (!platform.ready) return
    setLoading(true)
    setError(null)
    setSongs([])
    void getLeaderboardSetting()
      .then(({ boardId }) =>
        getBoardsList(platform.source).then(boards => {
          if (!aliveRef.current) return
          const list = boards.slice(0, tabLimit)
          setTabs(list)
          // 上次的榜若在这一批里就继续用它，否则退回第一个
          const next = list.some(b => b.id === boardId) ? boardId : list[0]?.id ?? ''
          setActiveId(next)
          if (next) {
            loadSongs(next)
          } else {
            // 该平台目录里没有榜：原型 renderSongs 的「homeBoards() 为空」分支原句（app.js L404，QA D12）
            setError('这个平台暂时没有可列出的榜单')
            setLoading(false)
          }
        }))
      .catch(() => {
        if (!aliveRef.current) return
        // 目录取数失败（网络或平台侧）：文案按原型 renderSongs 空态句逐字（app.js L410，QA D12）
        setError('这个平台暂时没有可列出的榜单')
        setLoading(false)
      })
  }, [loadSongs, platform, tabLimit])

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [load])

  const selectTab = useCallback((id: string) => {
    setActiveId(id)
    setSongs([])
    loadSongs(id)
  }, [loadSongs])

  return { tabs, activeId, songs, loading, error, selectTab, reload: load }
}
