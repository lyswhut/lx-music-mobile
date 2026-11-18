import { useMemo } from 'react'

import { NEW_UI_HOME_DAILY_SUB, NEW_UI_HOME_LIMITS } from '@/newui/const'
import { getToday, hashString, isOnlineMusic } from '@/newui/utils'

import { useLoveSongs } from './useLoveSongs'
import { useRecentPlays } from './useRecentPlays'

export interface DailyRecommend {
  /** 今天要推的这批歌（按日期稳定推算，同一天刷新还是那批） */
  songs: LX.Music.MusicInfoOnline[]
  /** 推算池的规模（听过 + 我喜欢，去重） */
  poolSize: number
  /** 卡片说明行文案 */
  sub: string
}

/**
 * 首页「每日推荐」的推算（原型 app.js L292-318）：池子 = 听过 ∪ 我喜欢 去重后取前 count。
 * 「听过」用新 UI 自记的收听历史（useRecentPlays，与首页「继续收听」、「我的」页同一份）——
 * 此前接的 usePlayedList 是播放核心的随机模式去重池，非随机模式恒空，推算会长期只剩收藏。
 * 首数按这次真正挑到的算（不写死），池子空就明说。
 * 排序键混入日期：每天换一批、当天内保持稳定，不需要额外存储。
 * @param count 一批发几首，默认对齐原型 NEW_UI_HOME_LIMITS.daily（10）
 */
export const useDailyRecommend = (count = NEW_UI_HOME_LIMITS.daily): DailyRecommend => {
  const recentPlays = useRecentPlays()
  const loveSongs = useLoveSongs()

  return useMemo(() => {
    const pool = new Map<string, LX.Music.MusicInfoOnline>()
    for (const musicInfo of recentPlays) {
      // recentPlays 已是在线歌的类型，这里只作同类型防御，不放宽口径
      if (isOnlineMusic(musicInfo)) pool.set(musicInfo.id, musicInfo)
    }
    for (const musicInfo of loveSongs) {
      if (isOnlineMusic(musicInfo)) pool.set(musicInfo.id, musicInfo)
    }
    const songs = [...pool.values()]
    if (!songs.length) {
      return { songs: [], poolSize: 0, sub: NEW_UI_HOME_DAILY_SUB.empty }
    }
    const { key } = getToday()
    songs.sort((a, b) => hashString(b.id + key) - hashString(a.id + key))
    const picked = songs.slice(0, count)
    return { songs: picked, poolSize: pool.size, sub: NEW_UI_HOME_DAILY_SUB.picked(picked.length) }
  }, [count, loveSongs, recentPlays])
}
