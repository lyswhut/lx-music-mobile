import { useCallback, useEffect, useMemo, useState } from 'react'

import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'

import { isOwnedMusicListId } from '@/newui/utils'

/**
 * 播放列表面板的一行，每行自带回指真实数据的坐标：
 * `listId` + `musicInfo.id` 定位播放落点；`tempIndex` ≥ 0 表示来自「下一曲播放」暂存。
 */
export interface NewUiPlayQueueRow {
  /** FlatList 用键：同一首歌在原列与下一曲候选里也不会撞键 */
  key: string
  /** 展示用曲目（下载项取其内嵌的在线曲目） */
  musicInfo: LX.Music.MusicInfo
  /** 这首歌挂在哪个列表上 */
  listId: string
  /** 是否正在出声的那一行 */
  isCurrent: boolean
  /** 在 tempPlayList 里的序号；-1 = 不是「下一曲」候选 */
  tempIndex: number
}

export interface NewUiPlayQueue {
  /** 有歌在放（没有歌就整屏只留空态） */
  hasSong: boolean
  /** 面板上这一列（已按显示顺序排好） */
  rows: NewUiPlayQueueRow[]
  /** 在播的这一列挂在哪个列表上 */
  listId: string
  /** 某行的归属名：本机单子（我喜欢 / 自建）返回名字，榜单 / 平台歌单 / 搜索等返回 null。
   *  按行自己的 listId 问，只用于决定文案 */
  ownerNameOf: (listId: string) => string | null
  /** 当前出声曲目的 id；没歌在放时 null */
  currentId: string | null
}

/** 播放内核的曲目可能是下载项：展示字段内嵌在 metadata.musicInfo 里，这里只做无损取值 */
const toMusicInfo = (musicInfo: LX.Player.PlayMusic): LX.Music.MusicInfo | null => {
  if ('metadata' in musicInfo) return musicInfo.metadata.musicInfo
  if ('source' in musicInfo && 'meta' in musicInfo) return musicInfo
  return null
}

/**
 * 正在播放页「这一次要播的一列」的数据源，数据全部只读取自既有模块：
 * 清单走 `core/list.getListMusics`，当前位置走 `store/player/hook` 订阅。
 *
 * 显示顺序是纯显示层的：读原序，再把「下一曲播放」那几首挪到当前行之后；
 * 不写回单子，随机档也不重排。
 */
export const usePlayQueue = (): NewUiPlayQueue => {
  const playInfo = usePlayInfo()
  const playMusicInfo = usePlayMusicInfo()
  const listId = playInfo.playerListId ?? ''

  // 整份清单（既有 getListMusics 的语义：异步首读 + 缓存即时返回）
  const [musics, setMusics] = useState<LX.Music.MusicInfo[]>([])
  // 「下一曲播放」那几首；action 广播传的是 `{ ...array }` 不是数组，故直接读 store
  const [tempList, setTempList] = useState<LX.Player.PlayMusicInfo[]>(() => [...playerState.tempPlayList])
  // 重读版本号：清单 / 切歌 / 下一曲候选任一变化都 +1
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => { setRev(v => v + 1) }
    const handleMyListMusicUpdate = (ids: string[]) => {
      if (listId !== '' && ids.includes(listId)) bump()
    }
    const handleTempPlayListChanged = () => { setTempList([...playerState.tempPlayList]) }
    global.app_event.on('myListMusicUpdate', handleMyListMusicUpdate)
    global.app_event.on('musicToggled', bump)
    global.state_event.on('playTempPlayListChanged', handleTempPlayListChanged)
    global.state_event.on('playPlayedListChanged', handleTempPlayListChanged)
    return () => {
      global.app_event.off('myListMusicUpdate', handleMyListMusicUpdate)
      global.app_event.off('musicToggled', bump)
      global.state_event.off('playTempPlayListChanged', handleTempPlayListChanged)
      global.state_event.off('playPlayedListChanged', handleTempPlayListChanged)
    }
  }, [listId])

  useEffect(() => {
    if (listId === '') {
      setMusics([])
      return
    }
    let alive = true
    void getListMusics(listId)
      .then(list => { if (alive) setMusics([...list]) })
      .catch(() => { if (alive) setMusics([]) })
    return () => { alive = false }
  }, [listId, rev])

  const currentMusic = playMusicInfo.musicInfo
  const currentId = currentMusic?.id ?? null

  const rows = useMemo<NewUiPlayQueueRow[]>(() => {
    if (currentMusic == null) return []
    const current = toMusicInfo(currentMusic)
    if (current == null) return []
    const currentListId = playMusicInfo.listId ?? listId

    // 「下一曲播放」候选：按 tempPlayList 顺序，跳过与当前同 id 的一条
    const tempRows: NewUiPlayQueueRow[] = []
    tempList.forEach((entry, index) => {
      const music = toMusicInfo(entry.musicInfo)
      if (music == null || music.id === current.id) return
      tempRows.push({
        key: `${entry.listId ?? ''}:${music.id}#${index}`,
        musicInfo: music,
        listId: entry.listId ?? currentListId,
        isCurrent: false,
        tempIndex: index,
      })
    })
    const tempIds = new Set(tempRows.map(row => row.musicInfo.id))
    const toRow = (music: LX.Music.MusicInfo): NewUiPlayQueueRow => ({
      key: `${listId}:${music.id}`,
      musicInfo: music,
      listId,
      isCurrent: false,
      tempIndex: -1,
    })
    /** 原列里既非当前曲、也非下一曲候选的那批（候选已挪到当前行之后） */
    const others = (list: LX.Music.MusicInfo[]) =>
      list.filter(music => music.id !== current.id && !tempIds.has(music.id)).map(toRow)

    const currentRow: NewUiPlayQueueRow = {
      key: `${currentListId}:${current.id}`,
      musicInfo: current,
      listId: currentListId,
      isCurrent: true,
      tempIndex: -1,
    }

    // 当前行在原列里的位次以 id 现查（单子增删歌后内核记的 index 会漂）
    const at = musics.findIndex(music => music.id === current.id)
    if (at < 0) {
      // 单子换了 / 还没读出来：当前这首排最前，后面接候选与整份清单
      if (musics.length === 0) return [currentRow, ...tempRows]
      return [currentRow, ...tempRows, ...others(musics)]
    }
    return [...others(musics.slice(0, at)), currentRow, ...tempRows, ...others(musics.slice(at + 1))]
  }, [currentMusic, listId, musics, playMusicInfo.listId, tempList])

  // 本机单子才标得出名字（判据见 isOwnedMusicListId）
  const ownerNameOf = useCallback((id: string): string | null => {
    if (!isOwnedMusicListId(id)) return null
    if (id === LIST_IDS.LOVE) return listState.loveList.name
    return listState.allList.find(list => list.id === id)?.name ?? null
  }, [])

  return {
    hasSong: currentId != null,
    rows,
    listId,
    ownerNameOf,
    currentId,
  }
}
