import { useEffect, useState } from 'react'

import playerState from '@/store/player/state'

/**
 * 「已播放列表」（播放器内部记的那批听过的歌）。
 * 只订阅既有 `global.state_event` 的 playPlayedListChanged，不改播放核心的任何行为。
 * 注意：它是随机模式的去重池，非随机模式恒空——新 UI 首页「继续收听 / 每日推荐」
 * 与「我的」页最近播放都改用 `useRecentPlays`（新 UI 自记的收听历史），不要再拿它当展示数据源。
 */
export const usePlayedList = (): LX.Player.PlayMusicInfo[] => {
  const [value, setValue] = useState(playerState.playedList)

  useEffect(() => {
    // 订阅前可能已经变过，先补一次当前值
    setValue(playerState.playedList)
    const handleUpdate = (playedList: LX.Player.PlayMusicInfo[]) => {
      setValue(playedList)
    }
    global.state_event.on('playPlayedListChanged', handleUpdate)
    return () => {
      global.state_event.off('playPlayedListChanged', handleUpdate)
    }
  }, [])

  return value
}
