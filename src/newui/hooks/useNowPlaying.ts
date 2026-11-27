import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'

/** 当前播放曲目的展示字段 */
export interface NewUiNowPlaying {
  /** 曲目 id；没有歌在放时为空串 */
  id: string
  title: string
  singer: string
  /** 专辑名（可能为空） */
  album: string
  /** 封面地址（可能为空） */
  picUrl: string | null
  /** 有曲目在放（含暂停中） */
  hasSong: boolean
  /** 正在出声（未暂停） */
  playing: boolean
}

/** 当前播放信息：复用 `@/store/player/hook` 的订阅 hook，不碰播放器逻辑 */
export const useNowPlaying = (): NewUiNowPlaying => {
  const musicInfo = usePlayerMusicInfo()
  const playing = useIsPlay()
  return {
    id: musicInfo.id ?? '',
    title: musicInfo.name,
    singer: musicInfo.singer,
    album: musicInfo.album,
    picUrl: musicInfo.pic ?? null,
    hasSong: !!musicInfo.id,
    playing,
  }
}
