import { useEffect, useState } from 'react'

import {
  getNewUiRecentPlays,
  startNewUiRecentPlayRecorder,
  subscribeNewUiRecentPlays,
} from '@/newui/utils/recentPlay'

/**
 * 读「最近播放」历史（新 UI 自记的那份，见 utils/recentPlay）。
 * 首页「继续收听」（截前 12）与「每日推荐」推算池的「听过」，以及「我的」页
 * 最近播放列表与统计都用本 hook——对齐原型 app.js L292-297「池子 = 听过 ∪ 我喜欢」。
 * 注意勿与 `usePlayedList` 混用：后者是播放核心的随机模式去重池，非随机模式恒空。
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

/**
 * 挂载「开始播放即记历史」的订阅（幂等，重复挂载只生效一次）。
 * 用法：主屏容器挂载时调一次——冷启动后任何入口（首页/榜单/搜索/播放页）的播放都会被记下，
 * 不依赖「我的」页是否被打开过。
 */
export const useRecentPlayRecorder = () => {
  useEffect(() => {
    startNewUiRecentPlayRecorder()
  }, [])
}
