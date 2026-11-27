import { useEffect, useState } from 'react'

import playerState from '@/store/player/state'

/**
 * 播放器内部记的「已播放列表」，只订阅 playPlayedListChanged，不改播放核心。
 * 注意：它是随机模式的去重池，非随机模式恒空；展示数据请用 useRecentPlays。
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
