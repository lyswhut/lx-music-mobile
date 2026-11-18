import { useEffect, useState } from 'react'

import { getListDetail } from '@/core/songlist'
import {
  NEW_UI_BOARD_LIST_ID_PREFIX,
  NEW_UI_PLD_LOAD_TIMEOUT_MS,
  NEW_UI_PLAYLIST_COVER,
} from '@/newui/const'
import { withTimeout } from '@/newui/utils/promise'

import { hasPlatformHome, type MyPlaylistItem } from './useMyPlaylists'

/*
 * 「我的歌单」里平台收藏单的真封面（feature.md【我的】-【我的歌单】第 2 条）。
 *
 * 为什么必须走网络（先把数据契约钉死，别再回回猜）：本地歌单条目 LX.List.UserListInfo
 * （src/types/list.d.ts:3-11）**只有 id / name / source / sourceListId / locationUpdateTime，
 * 没有任何封面字段**；收藏动作落库时也只写这五个字段（src/screens/SonglistDetail/listAction.ts:50-56
 * → core/list.ts createList → utils/listManage.ts:31-55 → utils/data.ts:297 原样持久化）。
 * 旧 UI 能在歌单详情头图显示真封面，靠的是平台明细接口回来的 info.img
 * （旧 screens/SonglistDetail/MusicList.tsx:36），本地库同样没存。
 * 所以这里只能按 source + sourceListId 现查 `core/songlist.getListDetail` 的 info.img，
 * 与【歌单】页推荐卡同源（那张卡的 img 也来自平台接口，不是本机字段）。
 *
 * 本轮（2026-10-27）换掉的三处取图口径——上一版实现正是这三处让收藏单永远吃内置版式：
 * ① **失败不再当终审**：旧版把失败与「平台没给图」写死成 null 进模块缓存，本轮 App 内永不重发，
 *    冷启动一次限流就永久假封面。现在只缓存成功，失败按 retryMs 退避（重进页面/列表变动后可再问）。
 * ② **并发限速**：旧版一进页面就把所有收藏单并发打出去，而每一发都是「整页歌曲」的量级
 *    （网易侧一次带全部曲目 id，几百首），大单互相踩平台限流、整批失败。现在最多 3 份在途，
 *    同 key 只发一次。
 * ③ **结果不再被丢**：旧版每轮 effect 先 `setCovers(fromCache)` 整体清空，又把晚到的成功按
 *    `alive=false` 直接丢弃——请求其实成功了，图却没进卡片，只能等下一次重挂载才从缓存里读回来。
 *    现在成功一律进模块缓存并通知所有在挂的实例各自重读，谁在页面上谁就拿图。
 *
 * 仍然如实回内置版式的一类（与本轮根因不同源，不动判据）：榜单「存整榜」进来的那份坐标是
 * `board__{榜单 id}`（旧 screens/Home/Views/Leaderboard/listAction.ts:44-55），榜单侧本来就没有封面
 * （store/leaderboard/state.ts:5-14 的 BoardItem/Board 只有 id/name/bangid），按歌单坐标去问也问不到图，
 * 继续走榜单体系既定的程序化封面。
 */

/** 一次取图任务（key 用平台坐标，与缓存/去重同一口径） */
interface CoverTask {
  key: string
  /** 卡片侧的记账 id（= 本地歌单 id，消费方按它取图） */
  listId: string
  source: LX.OnlineSource
  sourceListId: string
}

/** 成功拿到的封面（key → 图片地址）；失败不写这里 */
const coverCache = new Map<string, string>()
/** 在途 / 已入队的坐标，同坐标并发只发一次 */
const inFlight = new Set<string>()
/** 每个坐标上一次发起的时间戳，用作失败退避窗口 */
const lastAttemptAt = new Map<string, number>()
/** 在挂的实例：任何一份图落地，通知它们各自重读缓存 */
const listeners = new Set<() => void>()
const queue: CoverTask[] = []
/** 当前占用的并发位（超时放行时释放，慢请求之后仍可补进缓存） */
let running = 0

const notifyListeners = () => {
  for (const listener of [...listeners]) listener()
}

/** 该条目要不要问平台：有平台坐标，且不是「存整榜」的榜单坐标 */
const coverTaskOf = (list: MyPlaylistItem): CoverTask | null => {
  // 判据与卡面分叉共用一颗 hasPlatformHome（source + sourceListId 成对），不两处各写一遍
  if (!hasPlatformHome(list)) return null
  const sourceListId = list.sourceListId as string
  if (sourceListId.startsWith(NEW_UI_BOARD_LIST_ID_PREFIX)) return null
  return {
    key: `${list.source}__${sourceListId}`,
    listId: list.id,
    source: list.source as LX.OnlineSource,
    sourceListId,
  }
}

const readCovers = (lists: MyPlaylistItem[]): Record<string, string> => {
  const next: Record<string, string> = {}
  for (const list of lists) {
    const task = coverTaskOf(list)
    if (task == null) continue
    const img = coverCache.get(task.key)
    if (img != null) next[list.id] = img
  }
  return next
}

const isSameCovers = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every(key => a[key] === b[key])
}

const pump = () => {
  while (running < NEW_UI_PLAYLIST_COVER.concurrency && queue.length > 0) {
    const task = queue.shift() as CoverTask
    running++
    inFlight.add(task.key)
    lastAttemptAt.set(task.key, Date.now())

    const detail = getListDetail(task.sourceListId, task.source, 1)
    // 主路：真拿到就入缓存并通知（哪怕这发是上一个页面挂载时发起的、哪怕它慢于超时）
    void detail.then(
      result => {
        inFlight.delete(task.key)
        const img = result.info.img
        if (img != null && img.length > 0) {
          coverCache.set(task.key, img)
          notifyListeners()
        }
      },
      () => {
        // 失败只出队在途标记，不写「取不到」终审：退避窗口过后允许再问
        inFlight.delete(task.key)
      },
    )
    // 护栏：超时只为了放行并发位，不取消请求本身（平台取数无超时是详情页 D-08 的同款教训）
    void withTimeout(detail, NEW_UI_PLD_LOAD_TIMEOUT_MS).then(
      () => {
        running--
        pump()
      },
      () => {
        running--
        pump()
      },
    )
  }
}

const enqueue = (lists: MyPlaylistItem[]) => {
  const now = Date.now()
  for (const list of lists) {
    const task = coverTaskOf(list)
    if (task == null || coverCache.has(task.key) || inFlight.has(task.key)) continue
    const last = lastAttemptAt.get(task.key)
    if (last != null && now - last < NEW_UI_PLAYLIST_COVER.retryMs) continue
    if (queue.some(item => item.key === task.key)) continue
    queue.push(task)
  }
  pump()
}

/**
 * 「我的歌单」卡片的平台真封面：入参是 useMyPlaylists 的条目（含系统列表以外的全部单子），
 * 返回 `本地歌单 id → 封面地址`，取不到就是没有这一项，由 PlCard 的 Art 如实退回内置版式。
 * 只读复用 core/songlist 的既有取数（内部自带页缓存，详情页刚取过这份单时这里秒回），
 * 不写任何 store、不落任何库。
 */
export const useMyPlaylistCovers = (lists: MyPlaylistItem[]): Record<string, string> => {
  const [covers, setCovers] = useState<Record<string, string>>(() => readCovers(lists))

  useEffect(() => {
    const sync = () => {
      const next = readCovers(lists)
      setCovers(prev => (isSameCovers(prev, next) ? prev : next))
    }
    listeners.add(sync)
    sync()
    enqueue(lists)
    return () => {
      listeners.delete(sync)
    }
  }, [lists])

  return covers
}
