import { useEffect, useRef, useState } from 'react'

import { getTags } from '@/core/songlist'

import { NEW_UI_PLAYLIST_TAG_SHEET } from '@/newui/const'
import type { ChipRowItem } from '@/newui/components'

import { useContentPlatform } from './useContentPlatform'

/**
 * 首位分类 chip 的 tagId：'' 即「不掺口味、看整池」（对齐旧 UI：歌单目录默认页不传分类）。
 * 原型 app.js 里这颗是 `PL_TAG_REC`（原名 `PL_TAG_ALL`，2026-10 随原型一起改名），RN 侧沿用其语义：
 * tagId 是实现细节、文案是「推荐」。
 */
export const NEW_UI_PLAYLIST_REC_TAG = ''
/**
 * 首位分类 chip 的文案（原型 app.js L658 常量 `PL_TAG_REC = '推荐'` 原名 `PL_TAG_ALL`／「全部」）。
 * 唯一来源收在 const/playlist.ts 的浮层文案表里，chip 行、选中态复位、「全部分类」浮层三处共用同一个字符串，
 * 避免两处各写一份「推荐」而漏改其中一处。
 */
export const NEW_UI_PLAYLIST_REC_LABEL = NEW_UI_PLAYLIST_TAG_SHEET.rec
/** hotTag 为空时，从全量目录扁平化兜底取前若干条进 chip 行 */
const HOT_FALLBACK_LIMIT = 12

/** 全部分类浮层的一组（对应 TagInfo.tags 的一个分组，如酷我「主题」） */
export interface PlaylistTagGroup {
  /** 组名（原型无对应物，真实数据带 parent_name / 组名，直接做 GroupLabel 文案） */
  label: string
  items: ChipRowItem[]
}

export interface PlaylistCategoriesState {
  /** 当前歌单目录所在平台（沿用用户上次看歌单时的平台） */
  source: LX.OnlineSource | null
  /** 该平台的默认排序 id（取池子时用，与旧设置一致） */
  sortId: string
  /** chip 行分类：首位「推荐」+ 平台热门（hotTag 空时从全量目录兜底） */
  items: ChipRowItem[]
  /** 该平台全量分类目录（分组），供「全部分类」浮层逐组渲染 */
  groups: PlaylistTagGroup[]
  loading: boolean
  /** 失败文案；null 表示正常 */
  error: string | null
}

/**
 * 歌单页分类条（原型 #catRow / .cat-row）+ 全量分类目录（供 #plTagsSheet 新浮层）。
 * 数据复用既有 `@/core/songlist` 的 getTags（内部自带 store 缓存），不另造目录层：
 * - 平台跟随 useContentPlatform（音源浮层「音乐平台」组是唯一写入口），切平台经脉冲自动重取；
 * - chip 行 = 「推荐」+ tagInfo.hotTag（平台热门）；hotTag 为空时取 tags 扁平前 12 条兜底，
 *   避免只剩一枚「推荐」；
 * - groups = tagInfo.tags 逐组映射（各平台组名与条目天然不同，平台差异由 getTags(source) 保证）。
 * 取不到分类目录的平台走 error 口径如实降级（歌单页表现为「只剩不出分类条」，池子照常按平台整池取）。
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
        // `group.list` 做存在性防御：网易云目录里没子标签的大类在 SDK 转换后是
        // undefined（wy/songList.js filterTagInfo 的 subList[key]），不兜住会把整次
        // 取目录打成「失败」，歌单页分类条误报（2026-10-12 走查现象 3 的连带核对）
        const nextGroups: PlaylistTagGroup[] = tagInfo.tags
          .filter(group => (group.list?.length ?? 0) > 0)
          .map(group => ({
            label: group.name,
            items: (group.list ?? []).map(tag => ({ key: tag.id, label: tag.name })),
          }))
        // chip 行：热门优先；热门缺失时从全量扁平去重取前若干条兜底
        const seen = new Set<string>()
        const hot = tagInfo.hotTag.filter(tag => !seen.has(tag.id) && seen.add(tag.id))
        const hotItems: ChipRowItem[] = hot.map(tag => ({ key: tag.id, label: tag.name }))
        // 全量标签总数（跨组求和，验收口径）
        const totalTags = nextGroups.reduce((sum, group) => sum + group.items.length, 0)
        if (hotItems.length === 0) {
          const flat: ChipRowItem[] = []
          for (const group of nextGroups) {
            for (const item of group.items) {
              if (seen.has(item.key)) continue
              seen.add(item.key)
              flat.push(item)
            }
          }
          hotItems.push(...flat.slice(0, HOT_FALLBACK_LIMIT))
        }
        // __DEV__ 日志：验收「平台有几组、共几个标签」用（logcat -s ReactNativeJS 可见），release 不编入
        if (__DEV__) {
          console.log(`[newui] playlist tags · ${platform.source}: ${nextGroups.length} 组 / ${totalTags} 个标签`)
        }
        setItems([{ key: NEW_UI_PLAYLIST_REC_TAG, label: NEW_UI_PLAYLIST_REC_LABEL }, ...hotItems])
        setGroups(nextGroups)
        setLoading(false)
      })
      .catch(() => {
        if (!aliveRef.current) return
        // 目录取数与音源无关（内置 SDK 直连平台），如实说「平台暂时不稳」
        setError('歌单分类没取到 · 网络或平台暂时不稳')
        setLoading(false)
      })
    return () => {
      aliveRef.current = false
    }
  }, [platform])

  // 平台读回前给 null：歌单池（usePlaylistPool）见 null 不发请求，读回/切平台后随快照变化自动重取
  return {
    source: platform.ready ? platform.source : null,
    sortId: platform.sortId,
    items,
    groups,
    loading,
    error,
  }
}
