import { useMemo } from 'react'

import type { ChipRowItem } from '@/newui/components'

import { usePlaylistTagRecents } from './playlistTagRecents'
import { NEW_UI_PLAYLIST_REC_TAG } from './usePlaylistCategories'
import type { PlaylistTagSelection } from './playlistTagSelection'

/**
 * 歌单页分类 chip 行装配：首位「推荐」+ 本地 FIFO 缓存（最多 3 枚，按平台分桶），
 * 去重保证 key 唯一；选中项在缓存读盘完成前也兜底显示。
 */
export const usePlaylistChipItems = (
  items: ChipRowItem[],
  selection: PlaylistTagSelection,
): ChipRowItem[] => {
  const recents = usePlaylistTagRecents()
  return useMemo(() => {
    if (items.length === 0) return items
    const candidates: ChipRowItem[] = [items[0], ...recents]
    if (
      selection.key !== NEW_UI_PLAYLIST_REC_TAG &&
      !candidates.some(item => String(item.key) === String(selection.key))
    ) {
      candidates.push({ key: String(selection.key), label: selection.label })
    }
    const seen = new Set<string>()
    const out: ChipRowItem[] = []
    for (const item of [...candidates, ...items.slice(1)]) {
      if (seen.has(item.key)) continue
      seen.add(item.key)
      out.push(item)
    }
    return out
  }, [items, recents, selection])
}
