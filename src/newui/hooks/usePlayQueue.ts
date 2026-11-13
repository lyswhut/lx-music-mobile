import { useCallback, useEffect, useMemo, useState } from 'react'

import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'

import { isOwnedMusicListId } from '@/newui/utils'

/**
 * 播放列表面板（原型件 U80）的一行。
 * 顺序**由这一列自己排**（平铺按播放顺序，不分段），所以每行自带回指真实数据的坐标：
 * - `listId` + `musicInfo.id` 是「听这一首」的落点（既有 core/player/player.ts 的 playListById 就吃这两个）
 * - `tempIndex` ≥ 0 = 这一行来自「下一曲播放」那几首（store/player/state.ts 的 tempPlayList），
 *   「这次不播这一首」对它就是把这条暂存摘掉，不动任何单子
 */
export interface NewUiPlayQueueRow {
  /** FlatList 用键：同一首歌既在原列又在下一曲候选里时也不会撞键（撞了会被 dedupe 掉，留作防御） */
  key: string
  /** 展示用曲目（下载项取其内嵌的在线曲目，本层不画下载进度那套字段） */
  musicInfo: LX.Music.MusicInfo
  /** 这首歌挂在哪个列表上 */
  listId: string
  /** 正在出声的那一行（原型 .song-row.playing，靠 id 比出来） */
  isCurrent: boolean
  /** 在 tempPlayList 里的序号；-1 = 不是「下一曲」候选 */
  tempIndex: number
}

export interface NewUiPlayQueue {
  /** 有歌在放（原型 `if (!state.song)` 那一档：没有歌就整屏只留一句空态） */
  hasSong: boolean
  /** 面板上这一列（已按显示顺序排好） */
  rows: NewUiPlayQueueRow[]
  /** 此刻在播的这一列挂在哪个列表上（playInfo.playerListId） */
  listId: string
  /**
   * 某一行的落点是「本机的一张单子」还是「这一次播放临时凑出来的一池」（原型 queueOwner，
   * 判据 plPlayableQueue app.js L1027）：本机的一张单子标得出名字（内置「我喜欢」或自建歌单名），
   * 榜单、平台歌单、搜索结果起播时那池标不出来就是 null。
   * **按行自己的 listId 问**：一列里不同行可能挂在不同单子上（正在播的那首可能来自另一张单），
   * 「移出」的文案必须报名字被移的那张单，不能拿在播这一列的名字顶。只用来决定文案，不做别的。
   */
  ownerNameOf: (listId: string) => string | null
  /** 当前出声曲目的 id；没歌在放时 null */
  currentId: string | null
}

/**
 * 播放内核记的曲目（PlayMusic）可能是下载项：它的展示字段内嵌在 metadata.musicInfo 里。
 * 本层只做无损取值映射，不碰下载任务的状态。
 */
const toMusicInfo = (musicInfo: LX.Player.PlayMusic): LX.Music.MusicInfo | null => {
  if ('metadata' in musicInfo) return musicInfo.metadata.musicInfo
  if ('source' in musicInfo && 'meta' in musicInfo) return musicInfo
  return null
}

/**
 * 正在播放页的「这一次要播的一列」（原型件 U80 的唯一数据源）。
 *
 * 真实侧只有这一份数据，全是从既有模块**只读**取来的（播放内核那份 queue 只当两三首缓冲用，
 * src/plugins/player/playList.ts L143-183，不是 UI 数据源，原型注释里就点过这一条）：
 * - 整份清单 = `getList(playerInfo.playerListId)`（这里走既有 `core/list.getListMusics`，内部自带缓存）
 * - 当前位置 = `playInfo.playerPlayIndex` / 当前曲目 id（`store/player/hook` 的两个既有订阅 hook）
 * - 「下一曲播放」那几首 = `store/player/state.ts` 的 `tempPlayList`
 *
 * **显示顺序是纯显示层的**（原型 nextRow 上方那段注释定的口径）：读原序，再把 tempPlayList
 * 里那几首显示在当前行之后；写回单子等于改用户歌单，绝对不做，所以这里没有任何写操作。
 * 随机档不重排（下一首是切歌那一刻才抽的，这一列只是可能被抽到的），只由面板多挂一句说明。
 */
export const usePlayQueue = (): NewUiPlayQueue => {
  const playInfo = usePlayInfo()
  const playMusicInfo = usePlayMusicInfo()
  const listId = playInfo.playerListId ?? ''

  // 整份清单（异步首读 + 缓存命中即时返回，都是既有 getListMusics 的语义）
  const [musics, setMusics] = useState<LX.Music.MusicInfo[]>([])
  // 「下一曲播放」那几首（直接读 store 里的数组，不接事件载荷：
  // 既有 action 广播时传的是 `{ ...array }`，形状不是数组，读状态本体最稳）
  const [tempList, setTempList] = useState<LX.Player.PlayMusicInfo[]>(() => [...playerState.tempPlayList])
  // 重读版本号：任何可能改变清单内容的脉冲都 +1（单子本身的变化走 myListMusicUpdate，
  // 切歌走 playMusicInfoChanged / musicToggled，下一曲候选变化走 playTempPlayListChanged）
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

    // 「下一曲播放」候选：按 tempPlayList 自己的顺序（isTop 那批排在队首，内核 playNext 就先取它们），
    // 与当前这首同 id 的一条跳过（自己不能是自己的下一曲）
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
    /** 原列里既不是当前这首、也不是下一曲候选的那批（候选已被挪到当前行之后，不重复露面） */
    const others = (list: LX.Music.MusicInfo[]) =>
      list.filter(music => music.id !== current.id && !tempIds.has(music.id)).map(toRow)

    const currentRow: NewUiPlayQueueRow = {
      key: `${currentListId}:${current.id}`,
      musicInfo: current,
      listId: currentListId,
      isCurrent: true,
      tempIndex: -1,
    }

    // 当前行在原列里的位次：以 id 为准（单子被增删歌后内核记的 playerPlayIndex 会漂，
    // 这里按 id 现找，找不到就不编一个不存在的位次）
    const at = musics.findIndex(music => music.id === current.id)
    if (at < 0) {
      // 单子换了 / 还没读出来：当前这首排最前，后面接候选与整份清单
      if (musics.length === 0) return [currentRow, ...tempRows]
      return [currentRow, ...tempRows, ...others(musics)]
    }
    return [...others(musics.slice(0, at)), currentRow, ...tempRows, ...others(musics.slice(at + 1))]
  }, [currentMusic, listId, musics, playMusicInfo.listId, tempList])

  // 某一行的落点是谁家的：本机的一张单子（内置「我喜欢」/ 自建歌单）才标得出名字（判据见 isOwnedMusicListId）
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
