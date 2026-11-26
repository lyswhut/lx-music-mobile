import { useEffect, useRef, useState } from 'react'

import { getTags } from '@/core/songlist'

import { NEW_UI_PLAYLIST_TAG_SHEET } from '@/newui/const'
import type { ChipRowItem } from '@/newui/components'

import { useContentPlatform } from './useContentPlatform'

/** 首位分类 chip 的 tagId：'' 即「不掺口味、看整池」 */
export const NEW_UI_PLAYLIST_REC_TAG = ''
/** 首位分类 chip 的文案；唯一来源在 const/playlist.ts，三处共用 */
export const NEW_UI_PLAYLIST_REC_LABEL = NEW_UI_PLAYLIST_TAG_SHEET.rec
/** 全部分类浮层的一组（TagInfo.tags 的一个分组） */
export interface PlaylistTagGroup {
  /** 组名（真实数据自带，直接做 GroupLabel 文案） */
  label: string
  items: ChipRowItem[]
}

export interface PlaylistCategoriesState {
  /** 当前歌单目录所在平台（沿用用户上次看歌单时的平台） */
  source: LX.OnlineSource | null
  /** 该平台的默认排序 id（取池子时用，与旧设置一致） */
  sortId: string
  /** chip 行默认只有首位「推荐」；选中的分类来自 playlistTagRecents 的本地缓存 */
  items: ChipRowItem[]
  /** 该平台全量分类目录（分组），供「全部分类」浮层逐组渲染 */
  groups: PlaylistTagGroup[]
  loading: boolean
  /** 失败文案；null 表示正常 */
  error: string | null
}

/**
 * 歌单页分类条 + 全量分类目录：数据复用 `core/songlist.getTags`（自带缓存）。
 * 平台跟随 useContentPlatform，切平台自动重取；取不到目录时如实走 error 降级。
 */
export const usePlaylistCategories = (): PlaylistCategoriesState => {
  const platform = useContentPlatform()
  const [items, setItems] = useState<ChipRowItem[]>([])
  const [groups, setGroups] = useState<PlaylistTagGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    if (!platform.ready) return
    setLoading(true)
    setError(null)
    void getTags(platform.source)
      .then(tagInfo => {
        if (!aliveRef.current) return
        if (!tagInfo) {
          setError('这个平台暂时取不到歌单分类')
          setLoading(false)
          return
        }
        // 全量目录：按组映射，空组丢弃；组内保留原始顺序。
        // group.list 做存在性防御：网易云无子标签的大类在 SDK 转换后为 undefined，
        // 不兜住会把整次取目录打成失败
        const nextGroups: PlaylistTagGroup[] = tagInfo.tags
          .filter(group => (group.list?.length ?? 0) > 0)
          .map(group => ({
            label: group.name,
            items: (group.list ?? []).map(tag => ({ key: tag.id, label: tag.name })),
          }))
        // 全量标签总数（跨组求和）
        const totalTags = nextGroups.reduce((sum, group) => sum + group.items.length, 0)
        // __DEV__ 日志：平台有几组、共几个标签，release 不编入
        if (__DEV__) {
          console.log(`[newui] playlist tags · ${platform.source}: ${nextGroups.length} 组 / ${totalTags} 个标签`)
        }
        setItems([{ key: NEW_UI_PLAYLIST_REC_TAG, label: NEW_UI_PLAYLIST_REC_LABEL }])
        setGroups(nextGroups)
        setLoading(false)
      })
      .catch(() => {
        if (!aliveRef.current) return
        // 目录取数与音源无关，如实说「平台暂时不稳」
        setError('歌单分类没取到 · 网络或平台暂时不稳')
        setLoading(false)
      })
    return () => {
      aliveRef.current = false
    }
  }, [platform])

  // 平台读回前给 null：歌单池见 null 不发请求，读回 / 切平台后自动重取
  return {
    source: platform.ready ? platform.source : null,
    sortId: platform.sortId,
    items,
    groups,
    loading,
    error,
  }
}
