/**
 * 「有真图就铺真图、没有则如实回落种子纹理」的共通取图模块（2026-10-12 真机走查现象 1）。
 *
 * 背景：SongRow 一直支持 artUri，链路（toSongDisplay → meta.picUrl）也通，
 * 但部分平台的**歌单/榜单明细接口不返回逐曲封面**——实证：酷我
 * `utils/musicSdk/kw/songList.js` filterListDetail 对每首硬编码 `img: null`，
 * 归一化后 meta.picUrl 为空，详情页整列表只能永远显示程序化纹理。
 * SDK 文件属旧代码不动；封面另有现成通道：`@/core/music/online` 的 getPicUrl
 * （内置 SDK 的按曲取图，五平台都有 getPic），本项目播放页/通知栏同款来源。
 *
 * 口径：
 * - **只为「当前挂载的行」按需取图**（列表虚拟化后天然限流），模块级缓存
 *   按曲目 id 去重，同一首再进任何列表不再重发；查不到（平台无图/网络失败）
 *   记为「没有」，组件保持种子纹理，不转圈不重试。
 * - `allowToggleSource: false`：绝不因一张封面触发播放核心的全局换源（那是副作用）；
 *   不传 listId：不回写任何旧 store。
 */
import { getPicUrl } from '@/core/music/online'

/** id → 封面地址（null = 查过且确认没有，不再重复查） */
const cache = new Map<string, string | null>()
/** 进行中的请求（同 id 并发只发一次） */
const pending = new Map<string, Promise<string | null>>()

/** 已查过的直接给结果；没查过返回 undefined（调用方据此决定是否发起） */
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
