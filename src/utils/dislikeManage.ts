import { SPLIT_CHAR } from '@/config/constant'
import { getDislikeListRules } from './data'

const dislikeInfo: LX.Dislike.DislikeInfo = {
  names: new Set(),
  musicNames: new Set(),
  singerNames: new Set(),
  rules: '',
}

export const getDislikeInfo = async() => {
  updateDislikeInfo(await getDislikeListRules())
  return dislikeInfo
}

const updateDislikeInfo = (rules: string) => {
  dislikeInfo.names.clear()
  dislikeInfo.musicNames.clear()
  dislikeInfo.singerNames.clear()
  const list: string[] = []
  for (const item of rules.split('\n')) {
    if (!item) continue
    let [name, singer] = item.split(SPLIT_CHAR.DISLIKE_NAME)
    if (name) {
      name = name.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      if (singer) {
        singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
        const rule = `${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`
        dislikeInfo.names.add(rule)
        list.push(rule)
      } else {
        dislikeInfo.musicNames.add(name)
        list.push(name)
      }
    } else if (singer) {
      singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      dislikeInfo.singerNames.add(singer)
      list.push(`${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
    }
  }
  dislikeInfo.rules = Array.from(new Set(list)).join('\n')
}

export const addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
  updateDislikeInfo(dislikeInfo.rules + '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n'))
  return dislikeInfo
}

export const overwirteDislikeInfo = async(rules: string) => {
  updateDislikeInfo(rules)
  return dislikeInfo
}

export const clearDislikeInfo = async() => {
  updateDislikeInfo('')
  return dislikeInfo
}
