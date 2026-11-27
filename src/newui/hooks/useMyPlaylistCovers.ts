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
 * 「我的歌单」里平台收藏单的真封面：本地歌单条目没有封面字段，只能按 source + sourceListId
 * 现查 core/songlist.getListDetail 的 info.img。
 * 只缓存成功，失败按 retryMs 退避可重问；最多 3 份并发，同 key 只发一次；成功后通知所有实例重读。
 * 「存整榜」进来的坐标（board__ 前缀）榜单侧本就没有封面，继续走程序化封面。
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
  // 与卡面分叉共用 hasPlatformHome，不两处各写一遍
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
    // 拿到图就入缓存并通知（即使慢于超时或来自旧挂载）
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
        // 失败只清在途标记，退避窗口过后允许再问
        inFlight.delete(task.key)
      },
    )
    // 超时只放行并发位，不取消请求本身
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

/** 「我的歌单」卡片的平台真封面：返回 `本地歌单 id → 封面地址`，取不到则无该项，由 Art 退回内置版式 */
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
