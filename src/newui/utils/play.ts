import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'

/** 新 UI 临时队列的列表 ID 前缀 */
const TEMP_KEY_PREFIX = 'newui__'

/**
 * 播放一组在线曲目，从第 index 首开始。
 * 把「一次播放的这批歌」登记成临时列表，播放核心即可自行做上一曲 / 下一曲 / 列表循环。
 * @param key 这批歌的业务标识（榜单 id / 'daily' / 'played' …），用于复用同一份临时列表
 * @param list 曲目队列（在线曲目；本地曲目请走各自所属的歌单列表）
 * @param index 从第几首开始播，默认第 0 首
 * @returns 是否真的发起了播放
 */
export const playQueue = async (
  key: string,
  list: LX.Music.MusicInfoOnline[],
  index = 0,
): Promise<boolean> => {
  if (!list.length || index < 0 || index >= list.length) return false
  await setTempList(`${TEMP_KEY_PREFIX}${key}`, [...list])
  await playList(LIST_IDS.TEMP, index)
  return true
}
