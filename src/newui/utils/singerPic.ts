/**
 * 歌手头像取图模块（2026-10-15「歌手头像都是假的」方案 B 落地，口径照抄 utils/songPic.ts）。
 *
 * 数据从哪来：tx（QQ）SDK 归一化时新增的 `meta.singerMid`（**只增字段**，见
 * `src/utils/musicSdk/tx/{musicSearch,leaderboard,songList}.js` 与 `src/utils/index.ts`
 * 的 toNewMusicInfo 透传），拼官方头像 URL（`const/app.ts` 的 NEW_UI_TX_SINGER_PIC_URL）。
 * 其余平台（kw/wy/mg/kg）SDK 里根本没有歌手级 id，拿不到 → 返回 null，界面保持示意插画占位，
 * 绝不拿名字去反查、也绝不拿专辑封面冒充真人（那是另一种假）。
 *
 * 口径：
 * - **拼得出 URL ≠ 有真人照片**：mid 无对应图时 CDN 直接 404（已实测）。所以先用一次 HEAD
 *   探存在性（只取状态位、不下图），探到 200 才把地址交给 `Art`；`Art` 自身还有
 *   onError→种子纹理的兜底，双层保险。
 * - 只为**当前挂载的歌手卡**按需探测（首页上限 8 位，天然限流）；模块级缓存按 mid 去重，
 *   同一位歌手再进任何列表不再重发。
 * - 探不到 / 超时 / 网络失败一律记 null（=「没有」），不转圈、不重试轰炸，冷启动后重探。
 */
import { NEW_UI_IMG_HTTP_HEADERS, NEW_UI_SINGER_PIC_PROBE_TIMEOUT, NEW_UI_TX_SINGER_PIC_URL } from '@/newui/const'

import { withTimeout } from './promise'

/** mid → 头像地址（null = 探过且确认没有，不再重复探） */
const cache = new Map<string, string | null>()
/** 进行中的探测（同 mid 并发只发一次） */
const pending = new Map<string, Promise<string | null>>()

/** 从曲目里取「署名第一位歌手」的平台侧 id；非 tx 源 / 本地曲目没有这个键 */
export const getSingerMidOfSong = (musicInfo: LX.Music.MusicInfo | null | undefined): string | null => {
  if (musicInfo == null || musicInfo.source === 'local') return null
  const mid = musicInfo.meta.singerMid
  return typeof mid === 'string' && mid.length > 0 ? mid : null
}

/** 拼歌手头像地址；无 mid 直接给 null（不拼半截 URL 去撞运气） */
export const buildSingerPicUrl = (mid: string | null | undefined): string | null =>
  mid != null && mid.length > 0 ? NEW_UI_TX_SINGER_PIC_URL(mid) : null

/** 已探过的直接给结果；没探过返回 undefined（调用方据此决定是否发起） */
export const getCachedSingerPic = (mid: string | null | undefined): string | null | undefined => {
  if (mid == null || mid.length === 0) return undefined
  return cache.get(mid)
}

/** 探一位歌手的真人头像；探不到 / 失败都归 null（缓存后不再重试） */
export const resolveSingerPic = (mid: string): Promise<string | null> => {
  const hit = cache.get(mid)
  if (hit !== undefined) return Promise.resolve(hit)
  const inflight = pending.get(mid)
  if (inflight) return inflight
  const url = buildSingerPicUrl(mid)
  if (url == null) return Promise.resolve(null)
  const task = withTimeout(
    fetch(url, { method: 'HEAD', headers: { ...NEW_UI_IMG_HTTP_HEADERS } }),
    NEW_UI_SINGER_PIC_PROBE_TIMEOUT,
  )
    .then(res => {
      const value = res.ok ? url : null
      cache.set(mid, value)
      return value
    })
    .catch(() => {
      cache.set(mid, null)
      return null
    })
    .finally(() => {
      pending.delete(mid)
    })
  pending.set(mid, task)
  return task
}
