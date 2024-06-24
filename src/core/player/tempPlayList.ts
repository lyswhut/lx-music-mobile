import playerActions from '@/store/player/action'
import playerState from '@/store/player/state'
import { playNext } from './player'

import { preloadNext } from '@/plugins/player/playList'


/**
 * 添加歌曲到稍后播放列表
 * @param list 歌曲列表
 */
export const addTempPlayList = (list: LX.Player.TempPlayListItem[]) => {
  playerActions.addTempPlayList(list)
  if (!playerState.playMusicInfo.musicInfo) void playNext()
  else void preloadNext()
}
/**
 * 从稍后播放列表移除歌曲
 * @param index 歌曲位置
 */
export const removeTempPlayList = (index: number) => {
  playerActions.removeTempPlayList(index)
}
/**
 * 清空稍后播放列表
 */
export const clearTempPlayeList = () => {
  playerActions.clearTempPlayeList()
}
