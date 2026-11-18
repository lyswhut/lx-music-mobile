import { useCallback, useMemo } from 'react'

import { collectMusic, uncollectMusic } from '@/core/player/player'
import { usePlayMusicInfo } from '@/store/player/hook'

import { NEW_UI_PLAYER_FAV_TOAST } from '@/newui/const'
import { showNewUiToast } from '@/newui/utils'

import { useLoveSongs } from './useLoveSongs'

/**
 * 「当前在放曲目」的收藏态与开关动作（播放页 .playerHeart 与 minibar .mini-act 共用）。
 * 判定复用 store/list 的「我喜欢」列表（useLoveSongs），动作复用 core/player
 * 的 collectMusic / uncollectMusic（它们内部再走 core/list 的增删与持久化），此处零改动。
 *
 * 联动口径（清单「联动问题」修复 2026-10-21）：判定必须拿**收藏写入时落库的那个 id**来比。
 * core/player 的 collectMusic L638-645 对下载项（progress 在身的 ListItem）存的是
 * metadata.musicInfo.id，与 utils/music 的 `'progress' in` 降窄口径同源（如
 * core/music/index.ts L35/L55/L73、core/player/playInfo.ts L90）；
 * 此前用 usePlayerMusicInfo（展示态扁平 MusicInfo，下载项的 id 是下载条目 id）比较，
 * 下载曲队列里收藏成功后心形判不中——播放页/minibar 空心不翻实心、取消收藏按钮失灵，
 * 即「喜欢/取消喜欢后相关界面不联动」的实底根因。改用 playMusicInfo 原始联合解包后同 id 对齐。
 */
export const useFavoriteToggle = (): { loved: boolean, toggle: () => void } => {
  const playMusicInfo = usePlayMusicInfo()
  const loveSongs = useLoveSongs()

  const currentId = useMemo(() => {
    const musicInfo = playMusicInfo.musicInfo
    if (musicInfo == null) return null
    return 'progress' in musicInfo ? musicInfo.metadata.musicInfo.id : musicInfo.id
  }, [playMusicInfo.musicInfo])

  const loved = useMemo(
    () => currentId != null && loveSongs.some(song => song.id === currentId),
    [currentId, loveSongs],
  )

  const toggle = useCallback(() => {
    if (currentId == null) return
    if (loved) {
      uncollectMusic()
      showNewUiToast(NEW_UI_PLAYER_FAV_TOAST.removed)
    } else {
      collectMusic()
      showNewUiToast(NEW_UI_PLAYER_FAV_TOAST.added)
    }
  }, [currentId, loved])

  return { loved, toggle }
}
