import { useSyncExternalStore } from 'react'

import {
  getContentPlatformSnapshot,
  subscribeContentPlatform,
} from '@/newui/utils/contentPlatform'

import { NEW_UI_PLAYLIST_REC_LABEL, NEW_UI_PLAYLIST_REC_TAG } from './usePlaylistCategories'

/** 当前选中的歌单分类（key = tagId，'' 即首位「推荐」= 不掺口味看整池；label 供 chip 行/浮层/池子标题回显） */
export interface PlaylistTagSelection {
  key: string
  label: string
}

/** 首位选中态（原型 app.js L658-L659：plCat 初值就是 PL_TAG_REC「推荐」） */
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
  current = next
  listeners.forEach(listener => listener())
}

/**
 * 切内容平台 = 分类目录整体换血（各平台分类互不相通）：选中态复位回首位「推荐」这一整池
 * （原型 app.js L2317-2318 同口径：「上一家选中的分类在目录里可能根本不存在，切平台就退回『推荐』」），
 * 否则池子会拿上一个平台的分类号去问新平台要歌单（2026-10-12 真机走查现象 3 连带项）。
 * 复位收在本模块而不是页面里：歌单页切 Tab 会整页重挂载，页面级 effect 拦不住
 * 「人在别的页切平台、再进歌单页」的路径；同平台重挂载则不动用户的选择（9h 保持口径）。
 * 订阅在模块加载时挂一次（subscribeContentPlatform 自带幂等读盘）。
 */
let lastSource = getContentPlatformSnapshot().source
subscribeContentPlatform(() => {
  const source = getContentPlatformSnapshot().source
  if (source === lastSource) return
  lastSource = source
  selectPlaylistTag(REC_SELECTION)
})

/**
 * 歌单页分类选中态（模块级共享 store）：
 * PlaylistPage（chip 行 + 推荐池）与挂在主屏根层的 PlTagsSheet 浮层都要读写同一状态，
 * 按「跨页面共享状态封装为独立模块」准则收敛到此处，不经页面 props 层层下钻。
 * 切 Tab 后选择仍保留（浮层与页面分属不同挂载树，页面重挂载时从这里取回当前选择）。
 */
export const usePlaylistTagSelection = (): PlaylistTagSelection =>
  useSyncExternalStore(subscribe, () => current)
