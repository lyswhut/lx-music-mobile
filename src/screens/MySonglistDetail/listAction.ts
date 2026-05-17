import { getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'

/**
 * 播放歌单
 * @param listId 歌单ID
 * @param index  起始索引，0 = 播放全部，其他 = 单曲播放
 */
export const handlePlay = async (listId: string, index = 0) => {
  const list = await getListMusics(listId)
  if (!list.length) return
  await playList(listId, index)
}

/**
 * 移除歌曲
 */
export const handleRemove = async (listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  await global.list_event.list_music_remove(listId, musicInfos.map(m => m.id))
}

/**
 * 歌曲排序（移动位置）
 */
export const handleReorder = async (listId: string, position: number, ids: string[]) => {
  await global.list_event.list_music_update_position(listId, position, ids)
}
