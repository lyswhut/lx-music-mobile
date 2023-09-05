// import { toRaw } from '@common/utils/vueTools'
import { SPLIT_CHAR } from '@/config/constant'
import { action, state } from '@/store/dislikeList'
import { getDislikeListRules, saveDislikeListRules } from '@/utils/data'


export const initDislikeInfo = async() => {
  const rules = await getDislikeListRules()
  action.initDislikeInfo(rules)
}

export const addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
  const rules = state.dislikeInfo.rules += '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n')
  await saveDislikeListRules(rules)
  return action.overwirteDislikeInfo(rules)
}

export const overwirteDislikeInfo = async(rules: string) => {
  await saveDislikeListRules(rules)
  return action.overwirteDislikeInfo(rules)
}


export const hasDislike = (info: LX.Music.MusicInfo | LX.Download.ListItem | null) => {
  if (!info) return false
  return action.hasDislike(info)
}

