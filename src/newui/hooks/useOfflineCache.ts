import { useEffect, useMemo, useRef, useState } from 'react'

import { storageDataPrefix } from '@/config/constant'
import { getAllKeys, getDataMultiple } from '@/plugins/storage'
import { getCacheSize, isCached } from '@/plugins/player/utils'
import { getAppCacheSize } from '@/utils/nativeModules/cache'
import { NEW_UI_OFFLINE_SCAN, PLAY_QUALITY_CHOICES } from '@/newui/const'
import { isOnlineMusic } from '@/newui/utils'

import { useLoveSongs } from './useLoveSongs'
import { useRecentPlays } from './useRecentPlays'
import type { MyPlaylistItem } from './useMyPlaylists'

/** 屏上的一行：哪首歌、存在哪一档（.q-tag 读「存在哪一档」，件 parts/mine/offline.html U86） */
export interface OfflineRow {
  song: LX.Music.MusicInfoOnline
  quality: LX.Quality
}

export interface OfflineCacheState {
  rows: OfflineRow[]
  /** 本机缓存总占用（MB，取整；原型 LOCAL_CACHE_MB 的口径 = 整包缓存量，不是逐行加和） */
  totalMb: number
  /** 正在数这台机器上的歌 */
  scanning: boolean
}

interface OfflineScan {
  rows: OfflineRow[]
  totalMb: number
}

/**
 * 档位序（PLAY_QUALITY_CHOICES 高 → 低）：同一首存过几档取最高那档（原型 cachedQuality，app.js L1373）。
 * 表外的名义档（192k/ape/wav）核心不写地址，故不参与判定。
 */
const qualityOrder = (quality: string): number =>
  (PLAY_QUALITY_CHOICES as readonly string[]).indexOf(quality)

/** 本机缓存总量（字节）：封面歌词等应用缓存 + 播放器缓存，两者任一失败都只按 0 算 */
const readTotalBytes = async(): Promise<number> => {
  const [appBytes, playerBytes] = await Promise.all([
    getAppCacheSize().catch(() => 0),
    getCacheSize().catch(() => 0),
  ])
  return (Number.isFinite(appBytes) ? appBytes : 0) + (Number.isFinite(playerBytes) ? playerBytes : 0)
}

/** 字节 → MB（原型 LOCAL_CACHE_MB）：非零至少报 1，别把存过的东西显示成 0 MB */
const toMb = (bytes: number): number =>
  bytes > 0 ? Math.max(1, Math.round(bytes / 1024 / 1024)) : 0

/**
 * 数一遍「这台机器上已经存下的歌」。
 * 清单不是接口给的（件头注）：候选池 = 本机已知道的歌（收藏 ∪ 最近播放 ∪ 各份歌单的曲目），
 * 逐首过真实侧两关——`src/utils/data.ts:351` 的 musicUrl 本机映射键（键 = id_音质）
 * 与 `src/plugins/player/utils.ts:184` 的 isCached(url) 验字节；两关都过才上屏。
 * 只读既有存储与缓存查询，不写任何键、不动播放与列表。
 */
const scanOfflineCache = async(known: LX.Music.MusicInfoOnline[]): Promise<OfflineScan> => {
  // 一首本机已知道的歌都没有：不必去翻存储键，如实回空
  if (!known.length) return { rows: [], totalMb: 0 }

  const totalBytesPromise = readTotalBytes()

  const knownById = new Map<string, LX.Music.MusicInfoOnline>()
  for (const song of known) knownById.set(song.id, song)

  const prefix = storageDataPrefix.musicUrl
  const keys = (await getAllKeys()).filter(key => key.startsWith(prefix))

  /** songId → 档位 → 存储键（只留本机已知道的那几首） */
  const keysBySong = new Map<string, Map<LX.Quality, string>>()
  for (const key of keys) {
    const rest = key.slice(prefix.length)
    const sep = rest.lastIndexOf('_')
    if (sep <= 0) continue
    const id = rest.slice(0, sep)
    if (!knownById.has(id)) continue
    const quality = rest.slice(sep + 1)
    if (qualityOrder(quality) < 0) continue
    let byQuality = keysBySong.get(id)
    if (byQuality == null) {
      byQuality = new Map()
      keysBySong.set(id, byQuality)
    }
    byQuality.set(quality as LX.Quality, key)
  }

  // 地址一次批量读回来（getDataMultiple 单次 multiGet，不逐键往返）
  const allKeys: string[] = []
  for (const byQuality of keysBySong.values()) {
    for (const key of byQuality.values()) allKeys.push(key)
  }
  const urlByKey = new Map<string, string>()
  if (allKeys.length > 0) {
    const pairs = await getDataMultiple(allKeys)
    for (const [key, url] of pairs) {
      if (typeof url === 'string' && url.length > 0) urlByKey.set(key, url)
    }
  }

  const rows: OfflineRow[] = []
  /** 逐首验字节：单首出错只当这首先不算，不拖垮整轮 */
  const resolveRow = async(songId: string, byQuality: Map<LX.Quality, string>): Promise<OfflineRow | null> => {
    const song = knownById.get(songId)
    if (song == null) return null
    try {
      for (const quality of PLAY_QUALITY_CHOICES) {
        const key = byQuality.get(quality)
        if (key == null) continue
        const url = urlByKey.get(key)
        if (url == null) continue
        if (await isCached(url)) return { song, quality }
      }
    } catch (err) {
      // 单首验字节失败 = 这首没存下（不打断整轮）
      console.warn('newui offline: isCached failed', err)
    }
    return null
  }

  const entries = [...keysBySong.entries()]
  for (let i = 0; i < entries.length; i += NEW_UI_OFFLINE_SCAN.concurrency) {
    const chunk = entries.slice(i, i + NEW_UI_OFFLINE_SCAN.concurrency)
    const chunkRows = await Promise.all(chunk.map(([id, byQuality]) => resolveRow(id, byQuality)))
    for (const row of chunkRows) {
      if (row != null) rows.push(row)
    }
  }

  // 排序口径照原型 offlineRows（app.js L1374）：先按档位高 → 低，同档按 id 字典序
  rows.sort((a, b) =>
    qualityOrder(a.quality) - qualityOrder(b.quality) || a.song.id.localeCompare(b.song.id))

  return { rows, totalMb: toMb(await totalBytesPromise) }
}

interface ScanCacheEntry {
  signature: string
  at: number
  result: OfflineScan
}

/**
 * 模块级短时缓存：我的页与「已缓存」屏前后脚挂载时共用同一轮扫描（原型清单是一次算完的），
 * 免得进屏又把几百次原生缓存查询重排一遍。签名变了或过了 TTL 才重扫。
 */
let cachedScan: ScanCacheEntry | null = null
let inflightScan: { signature: string; promise: Promise<OfflineScan> } | null = null

const readOfflineCache = (signature: string, known: LX.Music.MusicInfoOnline[]): Promise<OfflineScan> => {
  if (
    cachedScan != null &&
    cachedScan.signature === signature &&
    Date.now() - cachedScan.at < NEW_UI_OFFLINE_SCAN.ttlMs
  ) {
    return Promise.resolve(cachedScan.result)
  }
  if (inflightScan != null && inflightScan.signature === signature) return inflightScan.promise

  const promise = scanOfflineCache(known)
    .then((result) => {
      // 只有这一轮仍是最新那一轮才入缓存：旧一轮晚回来不覆盖新一轮的清单
      if (inflightScan == null || inflightScan.promise === promise) {
        cachedScan = { signature, at: Date.now(), result }
      }
      return result
    })
    .finally(() => {
      if (inflightScan?.promise === promise) inflightScan = null
    })
  inflightScan = { signature, promise }
  return promise
}

/** 本机已知道的歌（原型 offlineKnownSongs，app.js L1357）：收藏 → 最近播放 → 各份歌单，按 id 去重 */
const collectKnown = (
  loveSongs: LX.Music.MusicInfo[],
  recentPlays: LX.Music.MusicInfoOnline[],
  lists: MyPlaylistItem[],
): LX.Music.MusicInfoOnline[] => {
  const seen = new Set<string>()
  const known: LX.Music.MusicInfoOnline[] = []
  const push = (song: LX.Music.MusicInfo) => {
    if (seen.has(song.id)) return
    seen.add(song.id)
    // 只有在线曲目有 musicUrl 映射（本地文件本就在机器上，不归这份清单管）
    if (isOnlineMusic(song)) known.push(song)
  }
  loveSongs.forEach(push)
  recentPlays.forEach(push)
  for (const list of lists) list.songs.forEach(push)
  return known
}

/**
 * 「已缓存」清单（U86，件 `parts/mine/offline.{html,css}`；原型 offlineKnownSongs / cachedQuality /
 * offlineRows，app.js L1351-1451）。
 *
 * 候选池只来自本机已知道的歌，逐首过「映射键存在 + 字节真在」两关；没有任何可枚举的缓存清单接口。
 * 我的页那张卡（数量 + 占用）与「已缓存」屏共用本 hook 的同一份结果：两边同一时刻算出来的是同一件事，
 * `lists` 的计数还没落值时先报 scanning，不先报一个 0。
 * 纯只读：只读既有存储键、播放器缓存查询与本机列表；不写存储、不改列表、不碰播放。
 */
export const useOfflineCache = (lists: MyPlaylistItem[]): OfflineCacheState => {
  const loveSongs = useLoveSongs()
  const recentPlays = useRecentPlays()

  // 各份歌单的计数全部落值才算「本机已知道的歌」齐了（否则会漏掉还没数出来的那份）
  const ready = lists.every(list => list.count !== null)

  const known = useMemo(
    () => (ready ? collectKnown(loveSongs, recentPlays, lists) : []),
    [ready, loveSongs, recentPlays, lists],
  )
  const signature = useMemo(
    () => (ready ? known.map(song => song.id).sort().join(',') : ''),
    [ready, known],
  )

  // 签名变了才重扫；known 的最新引用由 ref 递给扫描器（列表刷新但曲目集合没变时不重算）
  const knownRef = useRef(known)
  knownRef.current = known

  const [state, setState] = useState<OfflineCacheState>({ rows: [], totalMb: 0, scanning: true })

  useEffect(() => {
    let alive = true

    if (!ready) {
      setState(prev => ({ rows: prev.rows, totalMb: prev.totalMb, scanning: true }))
      return
    }
    if (signature === '') {
      // 本机一首都没记下：直接是「空的」，不必翻存储
      setState({ rows: [], totalMb: 0, scanning: false })
      return
    }

    // 换了候选池：先清空上屏的内容，扫描中如实报 scanning（不留上一批的旧行）
    setState({ rows: [], totalMb: 0, scanning: true })
    void readOfflineCache(signature, knownRef.current)
      .then((result) => {
        if (!alive) return
        setState({ rows: result.rows, totalMb: result.totalMb, scanning: false })
      })
      .catch((err: unknown) => {
        // 整轮读存储失败：如实当「一首都没数出来」，不把屏卡在扫描中
        console.warn('newui offline: scan failed', err)
        if (!alive) return
        setState({ rows: [], totalMb: 0, scanning: false })
      })

    return () => {
      alive = false
    }
  }, [ready, signature])

  return state
}
