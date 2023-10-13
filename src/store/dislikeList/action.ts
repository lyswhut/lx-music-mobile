import { state } from './state'
import { SPLIT_CHAR } from '@/config/constant'
import { event } from './event'


export const hasDislike = (info: LX.Music.MusicInfo | LX.Download.ListItem) => {
  if ('progress' in info) info = info.metadata.musicInfo
  const name = info.name?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''
  const singer = info.singer?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''

  return state.dislikeInfo.musicNames.has(name) || state.dislikeInfo.singerNames.has(singer) ||
    state.dislikeInfo.names.has(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
}

export const setDislikeInfo = (dislikeInfo: LX.Dislike.DislikeInfo) => {
  state.dislikeInfo.rules = dislikeInfo.rules
  state.dislikeInfo.names = dislikeInfo.names
  state.dislikeInfo.musicNames = dislikeInfo.musicNames
  state.dislikeInfo.singerNames = dislikeInfo.singerNames
  event.dislike_changed()
}
