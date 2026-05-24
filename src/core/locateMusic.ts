import { allMusicList, userLists } from '@/utils/listManage'
import { isMySonglistId } from '@/core/mySonglist'
import playerState from '@/store/player/state'

export interface LocateResult {
  type: 'direct' | 'found' | 'notFound' | 'multiple'
  listId?: string
  listInfos?: LX.List.UserListInfo[]
  reason?: 'noMusic'
}

function findMusicListId(musicId: string): LocateResult {
  const foundLists: LX.List.UserListInfo[] = []

  for (const [listId, musics] of allMusicList) {
    if (!isMySonglistId(listId)) continue
    if (musics.some(m => m.id === musicId)) {
      const listInfo = userLists.find(l => l.id === listId)
      if (listInfo) foundLists.push(listInfo)
    }
  }

  if (foundLists.length === 0) return { type: 'notFound' }
  if (foundLists.length === 1) return { type: 'found', listId: foundLists[0].id, listInfos: foundLists }
  return { type: 'multiple', listInfos: foundLists }
}

export function locatePlayingSong(): LocateResult {
  const { musicInfo, listId } = playerState.playMusicInfo

  if (!musicInfo) return { type: 'notFound', reason: 'noMusic' }
  if (listId && isMySonglistId(listId)) return { type: 'direct', listId }
  return findMusicListId(musicInfo.id)
}
