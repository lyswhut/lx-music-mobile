import { LIST_IDS } from '@/config/constant'

/** 系统列表 id（试听 / 我喜欢 · 收藏 / 临时 / 下载）：不是用户建出来的，不可删 */
const SYSTEM_LIST_IDS: readonly string[] = [
  LIST_IDS.DEFAULT,
  LIST_IDS.LOVE,
  LIST_IDS.TEMP,
  LIST_IDS.DOWNLOAD,
]

/**
 * 这份本地歌单能不能被用户删掉：只有 userList 里的歌单可删，系统列表一律不可删。
 */
export const isDeletableUserListId = (listId: string): boolean =>
  listId !== '' && !SYSTEM_LIST_IDS.includes(listId)

/**
 * 播放列表那一列是「本机的一张单子」还是「这一次播放临时凑出来的一池」。
 * 只有「我喜欢」与用户自建歌单算本机单子；暂存池动它只影响这一次播放。
 */
export const isOwnedMusicListId = (listId: string | null): boolean =>
  listId === LIST_IDS.LOVE || isDeletableUserListId(listId ?? '')
