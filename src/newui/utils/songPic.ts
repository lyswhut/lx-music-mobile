/**
 * 封面取图：有真图就铺真图，没有则回落种子纹理。
 * 只为当前挂载的行按需取图，按曲目 id 缓存；查不到记为「没有」，不重试、不触发全局换源。
 */
import { getPicUrl } from '@/core/music/online'

/** id → 封面地址（null = 查过且确认没有，不再重复查） */
const cache = new Map<string, string | null>()
/** 进行中的请求（同 id 并发只发一次） */
const pending = new Map<string, Promise<string | null>>()

/** 已查过的直接给结果；没查过返回 undefined */
export const getCachedSongPic = (musicInfo: LX.Music.MusicInfo | null | undefined): string | null | undefined => {
  if (musicInfo == null || musicInfo.source === 'local') return undefined
  return cache.get(musicInfo.id)
}

/** 查一首曲目的封面；失败与无图都归 null（缓存后不再重试） */
export const resolveSongPic = (musicInfo: LX.Music.MusicInfo): Promise<string | null> => {
  if (musicInfo.source === 'local') return Promise.resolve(null)
  const hit = cache.get(musicInfo.id)
  if (hit !== undefined) return Promise.resolve(hit)
  const inflight = pending.get(musicInfo.id)
  if (inflight) return inflight
  const task = getPicUrl({
    musicInfo,
    isRefresh: false,
    allowToggleSource: false,
  })
    .then(url => {
      const value = typeof url === 'string' && url.length > 0 ? url : null
      cache.set(musicInfo.id, value)
      return value
    })
    .catch(() => {
      cache.set(musicInfo.id, null)
      return null
    })
    .finally(() => {
      pending.delete(musicInfo.id)
    })
  pending.set(musicInfo.id, task)
  return task
}
