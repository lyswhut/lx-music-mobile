import { useCallback, useMemo } from 'react'

import { collectMusic, uncollectMusic } from '@/core/player/player'
import { usePlayMusicInfo } from '@/store/player/hook'

import { NEW_UI_PLAYER_FAV_TOAST } from '@/newui/const'
import { showNewUiToast } from '@/newui/utils'

import { useLoveSongs } from './useLoveSongs'

/**
 * 「当前在放曲目」的收藏态与开关动作（播放页与 minibar 共用）。
 * 判定用 store/list 的「我喜欢」列表，动作复用 core/player 的 collectMusic / uncollectMusic。
 * 判定必须拿收藏写入时落库的 id 来比：下载项存的是 metadata.musicInfo.id，
 * 而展示态扁平 MusicInfo 的 id 是下载条目 id，直接用会判不中。
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
