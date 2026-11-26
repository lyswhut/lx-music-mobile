import { useEffect, useState } from 'react'

import {
  getNewUiRecentPlays,
  startNewUiRecentPlayRecorder,
  subscribeNewUiRecentPlays,
} from '@/newui/utils/recentPlay'

/**
 * 读新 UI 自记的「最近播放」历史（见 utils/recentPlay）。
 * 勿与 usePlayedList 混用：后者是播放核心的随机模式去重池，非随机模式恒空。
 */
export const useRecentPlays = (): LX.Music.MusicInfoOnline[] => {
  const [list, setList] = useState(getNewUiRecentPlays)

  useEffect(() => {
    // 订阅前可能已读盘/记歌，先补一次当前值
    setList(getNewUiRecentPlays())
    return subscribeNewUiRecentPlays(() => {
      setList(getNewUiRecentPlays())
    })
  }, [])

  return list
}

/** 挂载「开始播放即记历史」的订阅（幂等）。主屏容器挂载时调一次即可 */
export const useRecentPlayRecorder = () => {
  useEffect(() => {
    startNewUiRecentPlayRecorder()
  }, [])
}
