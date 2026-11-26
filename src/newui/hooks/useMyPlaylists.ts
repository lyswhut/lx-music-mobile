import { useEffect, useState } from 'react'

import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import { assertApiSupport } from '@/utils/tools'
import { toSongDisplay } from '@/newui/utils'

export interface MyPlaylistItem {
  id: string
  name: string
  /** 曲目数；null = 还没数出来 */
  count: number | null
  /** 当前音源下可播的曲目数；null = 还没数出来，与 count 同步落值 */
  playable: number | null
  /** 整份曲目（getListMusics 的只读结果）；供 useOfflineCache 汇总与封面取图 */
  songs: LX.Music.MusicInfo[]
  /** 第一首曲目的封面种子；空歌单为 undefined，由调用方回落内置版式 */
  firstArtSeed?: string
  /** 第一首曲目的封面图地址；没图或空歌单为 undefined */
  firstArtUri?: string
  /** 从平台导入的来源（纯自建为 undefined） */
  source?: LX.OnlineSource
  /** 该平台里这份歌单的 ID */
  sourceListId?: string
}

type AllLists = typeof listState.allList

/** 只保留用户自建（含平台导入）：allList 恒含「试听列表」「我的收藏」两张系统列表，需在源头剔除 */
const isMine = (list: AllLists[number]): boolean =>
  list.id !== LIST_IDS.DEFAULT && list.id !== LIST_IDS.LOVE

/** 一份歌单的计数与曲目（只读） */
interface ListTally {
  count: number
  playable: number
  songs: LX.Music.MusicInfo[]
}

const tallyOf = (musics: LX.Music.MusicInfo[]): ListTally => ({
  count: musics.length,
  // 可播判定复用 assertApiSupport（读 global.lx.qualityList）
  playable: musics.filter(music => assertApiSupport(music.source)).length,
  songs: musics,
})

const toItems = (lists: AllLists, tallies: Record<string, ListTally>): MyPlaylistItem[] =>
  lists.filter(isMine).map(list => {
    const songs = tallies[list.id]?.songs ?? []
    // 平台歌单用平台真图，纯自建用第一首封面；这里只算第一首的展示字段
    const first = songs.length > 0 ? toSongDisplay(songs[0], true) : null
    return {
      id: list.id,
      name: list.name,
      count: tallies[list.id]?.count ?? null,
      playable: tallies[list.id]?.playable ?? null,
      songs,
      firstArtSeed: first?.artSeed,
      firstArtUri: first?.artUri,
      source: 'source' in list ? list.source : undefined,
      sourceListId: 'source' in list ? list.sourceListId : undefined,
    }
  })

/** 是否有平台坐标（source + sourceListId）：有则封面用平台真图，无则走内置版式。只做渲染分叉 */
export const hasPlatformHome = (list: MyPlaylistItem): boolean =>
  list.source != null && list.sourceListId != null

/**
 * 用户自建的歌单列表（系统列表已在源头剔除）：读 store/list 的 allList，
 * 数量走 core/list.getListMusics（自带缓存）；订阅歌单增删、曲目变化与换音源脉冲，
 * 顺带算「当前音源下可播几首」。
 */
export const useMyPlaylists = (): MyPlaylistItem[] => {
  const [items, setItems] = useState(() => toItems(listState.allList, {}))

  useEffect(() => {
    let alive = true
    const tallies: Record<string, ListTally> = {}

    const refresh = () => {
      if (alive) setItems(toItems(listState.allList, tallies))
    }
    const fillCounts = (lists: AllLists) => {
      for (const list of lists) {
        void getListMusics(list.id).then(musics => {
          if (!alive) return
          tallies[list.id] = tallyOf(musics)
          refresh()
        })
      }
    }
    const handleListUpdated = (lists: AllLists) => {
      fillCounts(lists)
      refresh()
    }
    const handleMusicUpdated = (ids: string[]) => {
      fillCounts(listState.allList.filter(list => ids.includes(list.id)))
    }
    // 换音源（含启动加载完成）→ 可播数重算
    const handleApiSourceUpdated = () => {
      fillCounts(listState.allList)
    }

    fillCounts(listState.allList)
    global.state_event.on('mylistUpdated', handleListUpdated)
    global.state_event.on('apiSourceUpdated', handleApiSourceUpdated)
    global.app_event.on('myListMusicUpdate', handleMusicUpdated)
    return () => {
      alive = false
      global.state_event.off('mylistUpdated', handleListUpdated)
      global.state_event.off('apiSourceUpdated', handleApiSourceUpdated)
      global.app_event.off('myListMusicUpdate', handleMusicUpdated)
    }
  }, [])

  return items
}
