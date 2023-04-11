import playerActions from '@/store/player/action'


/**
 * 将歌曲添加到已播放列表
 * @param playMusicInfo playMusicInfo对象
 */
export const addPlayedList = (playMusicInfo: LX.Player.PlayMusicInfo) => {
  playerActions.addPlayedList(playMusicInfo)
}
/**
 * 将歌曲从已播放列表移除
 * @param index 歌曲位置
 */
export const removePlayedList = (index: number) => {
  playerActions.removePlayedList(index)
}
/**
 * 清空已播放列表
 */
export const clearPlayedList = () => {
  playerActions.clearPlayedList()
}
