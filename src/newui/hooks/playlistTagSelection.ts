import { useSyncExternalStore } from 'react'

import {
  getContentPlatformSnapshot,
  subscribeContentPlatform,
} from '@/newui/utils/contentPlatform'

import { rememberPlaylistTag } from './playlistTagRecents'
import { NEW_UI_PLAYLIST_REC_LABEL, NEW_UI_PLAYLIST_REC_TAG } from './usePlaylistCategories'

/** 当前选中的歌单分类（key = tagId，'' 即首位「推荐」；label 供 chip 行 / 浮层回显） */
export interface PlaylistTagSelection {
  key: string
  label: string
}

/** 首位选中态：「推荐」 */
const REC_SELECTION: PlaylistTagSelection = { key: NEW_UI_PLAYLIST_REC_TAG, label: NEW_UI_PLAYLIST_REC_LABEL }

let current: PlaylistTagSelection = REC_SELECTION
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 选中一个分类（chip 行 / 全部分类浮层共用这一个写入口） */
export const selectPlaylistTag = (next: PlaylistTagSelection) => {
  if (next.key === current.key && next.label === current.label) return
  // 选分类的入口都在这里记入本地 FIFO 缓存；「推荐」空 key 由缓存侧跳过
  rememberPlaylistTag(next)
  current = next
  listeners.forEach(listener => listener())
}

/**
 * 切内容平台时选中态复位回「推荐」：各平台分类互不相通，否则会拿旧平台的分类号去问新平台。
 * 复位收在本模块而不是页面里，页面级 effect 拦不住「在别页切平台再进歌单页」的路径；
 * 同平台重挂载不动用户选择。
 */
let lastSource = getContentPlatformSnapshot().source
subscribeContentPlatform(() => {
  const source = getContentPlatformSnapshot().source
  if (source === lastSource) return
  lastSource = source
  selectPlaylistTag(REC_SELECTION)
})

/**
 * 歌单页分类选中态（模块级共享 store）：页面内的 chip 行 / 推荐池与主屏根层的分类浮层
 * 读写同一状态；切 Tab 后选择仍保留。
 */
export const usePlaylistTagSelection = (): PlaylistTagSelection =>
  useSyncExternalStore(subscribe, () => current)
