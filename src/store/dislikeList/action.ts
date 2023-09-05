import { state } from './state'
import { SPLIT_CHAR } from '@/config/constant'


export const hasDislike = (info: LX.Music.MusicInfo | LX.Download.ListItem) => {
  if ('progress' in info) info = info.metadata.musicInfo
  const name = info.name?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''
  const singer = info.singer?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''

  return state.dislikeInfo.musicNames.has(name) || state.dislikeInfo.singerNames.has(singer) ||
    state.dislikeInfo.names.has(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
}

export const initDislikeInfo = (rules: string) => {
  // state.dislikeInfo.names = names
  // state.dislikeInfo.singerNames = singerNames
  // state.dislikeInfo.musicNames = musicNames
  state.dislikeInfo.rules = rules
  initNameSet()
}

const initNameSet = () => {
  state.dislikeInfo.names.clear()
  state.dislikeInfo.musicNames.clear()
  state.dislikeInfo.singerNames.clear()
  const list: string[] = []
  for (const item of state.dislikeInfo.rules.split('\n')) {
    if (!item) continue
    let [name, singer] = item.split(SPLIT_CHAR.DISLIKE_NAME)
    if (name) {
      name = name.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      if (singer) {
        singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
        const rule = `${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`
        state.dislikeInfo.names.add(rule)
        list.push(rule)
      } else {
        state.dislikeInfo.musicNames.add(name)
        list.push(name)
      }
    } else if (singer) {
      singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      state.dislikeInfo.singerNames.add(singer)
      list.push(`${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
    }
  }
  state.dislikeInfo.rules = Array.from(new Set(list)).join('\n') + '\n'
}

// export const addDislikeInfo = (infos: LX.Dislike.DislikeMusicInfo[]) => {
//   state.dislikeInfo.rules += '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n')
//   initNameSet()
//   return state.dislikeInfo.rules
// }

export const overwirteDislikeInfo = (rules: string) => {
  state.dislikeInfo.rules = rules
  initNameSet()
  return state.dislikeInfo.rules
}
