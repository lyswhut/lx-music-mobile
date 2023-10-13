import { action } from '@/store/dislikeList'


export const addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
  await global.dislike_event.dislike_music_add(infos)
}

export const overwirteDislikeInfo = async(rules: string) => {
  await global.dislike_event.dislike_data_overwrite(rules)
}

export const clearDislikeInfo = async() => {
  await global.dislike_event.dislike_music_clear()
}


export const hasDislike = (info: LX.Music.MusicInfo | LX.Download.ListItem | null) => {
  if (!info) return false
  return action.hasDislike(info)
}


export const setDislikeInfo = (info: LX.Dislike.DislikeInfo) => {
  action.setDislikeInfo(info)
}

export { getDislikeInfo } from '@/utils/dislikeManage'
