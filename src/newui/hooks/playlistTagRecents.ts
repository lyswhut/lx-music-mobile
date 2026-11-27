import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

import type { ChipRowItem } from '@/newui/components'
import {
  getContentPlatformSnapshot,
  subscribeContentPlatform,
} from '@/newui/utils/contentPlatform'

import { NEW_UI_PLAYLIST_REC_TAG } from './usePlaylistCategories'

/** 分类缓存上限（推荐 / 全部不计入） */
export const PLAYLIST_TAG_RECENTS_LIMIT = 3
const STORAGE_KEY = 'newui.playlistTagRecents'

type RecentTag = ChipRowItem
type RecentStore = Partial<Record<LX.OnlineSource, RecentTag[]>>

const EMPTY: readonly RecentTag[] = Object.freeze([])

let store: RecentStore = {}
let loaded = false
let loadingPromise: Promise<void> | null = null
/** 读盘期间发生过写入：读到的旧值不能覆盖刚更新的内存状态 */
let dirty = false
let lastSource = getContentPlatformSnapshot().source
// useSyncExternalStore 的 getSnapshot 必须返回稳定引用；内容未变时不换引用也不广播
let snapshot: readonly RecentTag[] = EMPTY
const listeners = new Set<() => void>()

const snapshotOf = (): readonly RecentTag[] => store[lastSource] ?? EMPTY

const publish = (): void => {
  const next = snapshotOf()
  if (
    next.length === snapshot.length &&
    next.every((item, index) =>
      item.key === snapshot[index].key && item.label === snapshot[index].label,
    )
  ) return
  snapshot = next
  listeners.forEach(listener => { listener() })
}

const sanitize = (raw: unknown): RecentStore => {
  if (raw == null || typeof raw !== 'object') return {}
  const out: RecentStore = {}
  for (const [source, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue
    const seen = new Set<string>()
    const items: RecentTag[] = []
    for (const entry of value) {
      if (entry == null || typeof entry !== 'object') continue
      const { key, label } = entry as { key?: string | number, label?: string }
      // 平台 tagId 可能是数字（tx），统一收成字符串再比 / 再渲染
      if (typeof key !== 'string' && typeof key !== 'number') continue
      const normalized = String(key)
      if (normalized.length === 0 || normalized === NEW_UI_PLAYLIST_REC_TAG) continue
      if (typeof label !== 'string' || seen.has(normalized)) continue
      seen.add(normalized)
      items.push({ key: normalized, label })
    }
    if (items.length > 0) out[source as LX.OnlineSource] = items.slice(-PLAYLIST_TAG_RECENTS_LIMIT)
  }
  return out
}

const loadOnce = async(): Promise<void> => {
  if (loaded) return
  if (loadingPromise == null) {
    loadingPromise = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!dirty && raw != null) store = sanitize(JSON.parse(raw) as unknown)
        loaded = true
        // 读盘完成后必须广播一次，否则 snapshot 还停在空数组，chip 行看不到缓存
        publish()
      })
      .catch(() => { loaded = true })
      .finally(() => { loadingPromise = null })
  }
  return loadingPromise
}

/**
 * 记一枚选中的分类：同 key 不重复、不重排，满了 FIFO 淘汰最早一枚。
 * 先改内存再落盘，连点不会因 AsyncStorage 竞争丢数据；「推荐」空 key 不记入。
 */
export const rememberPlaylistTag = (tag: RecentTag): void => {
  // tagId 可能是 number（tx），统一归一化
  const key = String(tag.key)
  if (key.length === 0 || key === NEW_UI_PLAYLIST_REC_TAG) return
  const currentList = store[lastSource] ?? []
  if (currentList.some(item => String(item.key) === key)) return
  const next = [...currentList, { key, label: tag.label }].slice(-PLAYLIST_TAG_RECENTS_LIMIT)
  store = { ...store, [lastSource]: next }
  dirty = true
  publish()
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(() => {})
}

/** 按内容平台分桶：别把上一家的分类号拿到新平台去问 */
subscribeContentPlatform(() => {
  const source = getContentPlatformSnapshot().source
  if (source === lastSource) return
  lastSource = source
  publish()
  void loadOnce()
})

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  void loadOnce()
  return () => { listeners.delete(listener) }
}

const getSnapshot = (): readonly RecentTag[] => snapshot

/** 最近选中的分类（最多 3 枚，共用同一份稳定快照） */
export const usePlaylistTagRecents = (): readonly RecentTag[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
