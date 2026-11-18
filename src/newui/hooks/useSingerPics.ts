import { useEffect, useState } from 'react'

import { getCachedSingerPic, resolveSingerPic } from '@/newui/utils'

export interface SingerPicsState {
  /** mid → 真人头像地址（只有探到 200 的才有值；探不到不占键位） */
  pics: Record<string, string>
  /** 还有在飞的探测（首页据此决定「平台未提供歌手照片」这句结论要不要说出口） */
  pending: boolean
}

/**
 * 首页「热门歌手」的真人头像批量接线（2026-10-15 方案 B）。
 * 只负责「按需发起探测 + 把结果摊成 mid → url」，取图与缓存全在 `utils/singerPic`（模块级、
 * 按 mid 去重、失败记 null 不重试），本 hook 不持有任何平台细节，也不碰播放/存储逻辑。
 * @param mids 待探测的歌手 mid（调用方需 memoize，与 useMyPlaylistCovers 同一约定）
 */
export const useSingerPics = (mids: string[]): SingerPicsState => {
  const [pics, setPics] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let alive = true
    const fromCache: Record<string, string> = {}
    const todo: string[] = []
    for (const mid of mids) {
      const cached = getCachedSingerPic(mid)
      if (cached !== undefined) {
        if (cached != null) fromCache[mid] = cached
        continue
      }
      todo.push(mid)
    }
    setPics(fromCache)
    if (todo.length === 0) {
      setPending(false)
      return
    }
    setPending(true)
    let settled = 0
    for (const mid of todo) {
      void resolveSingerPic(mid).then(url => {
        // 探不到（无图 / 超时 / 网络失败）只落缓存，不给界面留半截坑位
        if (!alive) return
        settled += 1
        if (url != null) setPics(prev => ({ ...prev, [mid]: url }))
        if (settled === todo.length) setPending(false)
      })
    }
    return () => {
      alive = false
    }
    // mids 由调用方 memoize（元素相同即视为同一批），故直接以数组引用为依赖
  }, [mids])

  return { pics, pending }
}
