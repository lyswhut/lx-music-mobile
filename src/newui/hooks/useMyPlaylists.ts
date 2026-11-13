import { useEffect, useState } from 'react'

import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import { assertApiSupport } from '@/utils/tools'
import { toSongDisplay } from '@/newui/utils'

export interface MyPlaylistItem {
  id: string
  name: string
  /** 曲目数；null = 还没数出来（首次读取时） */
  count: number | null
  /** 当前音源下可播的曲目数（QA D17：原型 plCardMine 的 `${n} 首 · ${can} 首可播` 口径）；
   *  null = 还没数出来，与 count 同步落值 */
  playable: number | null
  /**
   * 整份曲目（既有 getListMusics 的只读结果，未作任何改写）。
   * 2026-10-27 起交给 useOfflineCache 汇总「这台机器上存过什么」，也供封面取第一首的图；
   * 未数出来时为空数组，与 count/playable 的 null 同步落值。
   */
  songs: LX.Music.MusicInfo[]
  /** 第一首曲目的封面种子（原型 listCover 的「非平台歌单用第一首的封面」，app.js L909-913）；
   *  空歌单为 undefined，由调用方回落到内置版式种子 */
  firstArtSeed?: string
  /** 第一首曲目的封面图地址；没图或空歌单为 undefined */
  firstArtUri?: string
  /** 从平台导入的来源（纯自建为 undefined） */
  source?: LX.OnlineSource
  /** 该平台里这份歌单的 ID */
  sourceListId?: string
}

type AllLists = typeof listState.allList

/** QA 2026-10-14 D-03：原型 MY_PLAYLISTS 只含用户自建（app.js L738-746），
 * 而 store/list 的 allList 恒含「试听列表」与「我的收藏」两张系统列表（store/list/state.ts L45）——
 * 不过滤就会上卡、进「歌单」统计、并让空态永不出现。在源头剔掉，
 * 四处消费方（歌单页横排 / 我的页网格与统计 / MoreSheet / 详情层收藏匹配）一并收敛。
 * 详情层按 source + sourceListId 匹配，系统列表本就命不中，不误伤。 */
const isMine = (list: AllLists[number]): boolean =>
  list.id !== LIST_IDS.DEFAULT && list.id !== LIST_IDS.LOVE

/** 一份歌单的计数与曲目（QA D17：原型 plCardMine 副行同时报「几首 / 几首可播」；
 *  曲目本身留给「已缓存」页汇总与封面取图，均只读） */
interface ListTally {
  count: number
  playable: number
  songs: LX.Music.MusicInfo[]
}

const tallyOf = (musics: LX.Music.MusicInfo[]): ListTally => ({
  count: musics.length,
  // 可播判定复用既有 utils/tools 的 assertApiSupport（读 global.lx.qualityList），不另造口径
  playable: musics.filter(music => assertApiSupport(music.source)).length,
  songs: musics,
})

const toItems = (lists: AllLists, tallies: Record<string, ListTally>): MyPlaylistItem[] =>
  lists.filter(isMine).map(list => {
    const songs = tallies[list.id]?.songs ?? []
    // 原型 listCover（app.js L909-913）：平台歌单用平台那张真图，纯自建用第一首的封面；
    // 这里只算第一首的展示字段，空歌单保持 undefined 交给调用方回落内置版式
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

/**
 * 这份单子有没有平台坐标（原型口径：`listCover` 判 `p.home`，app.js L909-913；
 * 件 parts/mine/my-pl-mine.html U46 头注）。有坐标 = 从平台收藏/存榜来的那份，
 * 封面用平台那张真图；没有 = 纯自建，封面位走内置版式，不画一张随机图冒充平台封面。
 * 只做渲染分叉的判断，不碰数据源与存储。
 */
export const hasPlatformHome = (list: MyPlaylistItem): boolean =>
  list.source != null && list.sourceListId != null

/**
 * 歌单页「我的歌单」横排（原型 #myPlRow / MY_PLAYLISTS）= 仅用户自建（含平台导入），
 * 系统列表已在 toItems 源头剔除（D-03）。
 * 读既有 `@/store/list` 的 allList（启动时已填充），
 * 数量走 `@/core/list` 的 getListMusics（内部自带缓存）；
 * 订阅 state_event.mylistUpdated（歌单增删改名）与 app_event.myListMusicUpdate（曲目变化），零逻辑改动。
 * QA D17 追加：同一份曲目顺带算「当前音源下可播几首」，并订阅 apiSourceUpdated 脉冲——
 * 换音源后可播数跟着重算（计数仍是既有 getListMusics 的只读结果，不落任何新状态）。
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
    // 换音源（含启动加载完成）→ 可播数重算：只重跑既有只读取数，不新增任何写操作
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
