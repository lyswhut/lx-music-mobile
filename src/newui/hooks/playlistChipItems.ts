import { useMemo } from 'react'

import type { ChipRowItem } from '@/newui/components'

import { NEW_UI_PLAYLIST_REC_TAG } from './usePlaylistCategories'
import type { PlaylistTagSelection } from './playlistTagSelection'

/**
 * 歌单页分类 chip 行的视图模型装配（QA 2026-10-14 D-06 吸顶轮共通化）：
 * 原逻辑长在 PlaylistPage 内，分类条现在有两个渲染位（页面原位 + 主屏吸顶层），
 * 按「重复 ≥2 次必抽公共」收敛到本 hook，两处同一口径：
 * - 选中在热门行里 → 原样；
 * - 选中不在行里（从「全部分类」浮层选的）→ 插在首位「推荐」之后，行内始终看得出当前分类；
 * - 首位「推荐」恒在位（原型 app.js L661 `plHotCats` = PL_TAG_REC + 该平台热门）。
 */
export const usePlaylistChipItems = (
  items: ChipRowItem[],
  selection: PlaylistTagSelection,
): ChipRowItem[] =>
  useMemo(() => {
    if (items.length === 0) return items
    if (selection.key === NEW_UI_PLAYLIST_REC_TAG) return items
    if (items.some(item => item.key === selection.key)) return items
    const [first, ...rest] = items // 首位恒为「推荐」，选中项插在它之后（不是顶替）
    return [first, { key: selection.key, label: selection.label }, ...rest]
  }, [items, selection])
