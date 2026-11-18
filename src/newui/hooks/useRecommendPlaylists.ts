import { useCallback, useEffect, useRef, useState } from 'react'

import { getList } from '@/core/songlist'
import type { ListInfoItem } from '@/store/songlist/state'

import { useContentPlatform } from './useContentPlatform'

export interface RecommendPlaylistsState {
  /** 推荐歌单（跟随当前内容平台 / 排序 / 分类，首页只展示前 limit 条） */
  items: ListInfoItem[]
  loading: boolean
  /** 失败文案；null 表示正常 */
  error: string | null
  reload: () => void
}

/**
 * 首页「推荐歌单」数据。
 * 只调既有 `@/core/songlist` 的 getList（带缓存），不碰它的 store 与签名。
 * 平台来自 useContentPlatform（音源浮层「音乐平台」组的唯一写入口），
 * 切平台后经脉冲自动重取；取不到目录时走 error 口径如实降级。
 * @param limit 取几条，默认 6（.pl-grid 两列三行）
 */
export const useRecommendPlaylists = (limit = 6): RecommendPlaylistsState => {
  const platform = useContentPlatform()
  const [items, setItems] = useState<ListInfoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const aliveRef = useRef(true)

  const load = useCallback(() => {
    // 持久化设置还没读回时不发请求，避免默认平台与真实平台各取一次
    if (!platform.ready) return
    setLoading(true)
    setError(null)
    void getList(platform.source, platform.tagId, platform.sortId, 1)
      .then(info => {
        if (!aliveRef.current) return
        setItems(info.list.slice(0, limit))
        setLoading(false)
      })
      .catch(() => {
        if (!aliveRef.current) return
        setError('推荐歌单没取到 · 网络或平台暂时不稳')
        setLoading(false)
      })
  }, [limit, platform])

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [load])

  return { items, loading, error, reload: load }
}
