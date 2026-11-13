/**
 * 「播放位里此刻是不是一集播客」——原型 `epLive()`（`new_design/app.js` L2387）。
 *
 * 单集跨屏续播之后，「谁在播」不再等价于「哪一屏挂着」，所以这条判据有两个消费点：
 * 1. 迷你条画谁（`components/Minibar/MinibarHost.tsx`：画那一集还是画那首歌）；
 * 2. 首页那张「暂停中 · <歌名>」横幅让不让位（`screens/Main/pages/HomePage.tsx`）。
 * 按共通化口径收在这一处，别让两处各写一遍。
 *
 * 为什么不放进 `podPlayer.ts`：那条是播放胶水（队列归属、生命周期、远控分派），
 * 一行都不该为了界面判据而改动；本文件只做「判据 + 订阅」这一件事，且**不持有任何状态**。
 *
 * 判据与单集屏的 `ownsQueue` 同口径（`screens/Radio/EpisodeScreen.tsx`）：
 * - `episodeId` 非空 = 有一集被起播过；
 * - `idle` = 已经交还播放器（让位给歌曲 / 明确停止），队列不归这一集；
 * - `failed` = 压根没挂上或放不出来（直链 404、没给直链），队列同样不归它。
 * 后两档都不算「占着播放位」，迷你条这时画那首歌、首页横幅照旧出现——不为一档失败态另造视觉。
 */
import { useEffect, useRef, useState } from 'react'

import { type PodPlayerSnapshot, getPodPlayerSnapshot, subscribePodPlayer } from './podPlayer'

/** 纯判据（不订阅，可在事件回调 / 条件分支里直接读当前快照） */
export const isPodEpisodeLive = (snapshot: PodPlayerSnapshot): boolean =>
  snapshot.episodeId.length > 0 && snapshot.phase !== 'idle' && snapshot.phase !== 'failed'

/**
 * 订阅版：**只在真假真的翻转时**重渲染。
 *
 * 为什么不直接把 `usePodPlayer()` 塞进这些调用点：那个快照每秒都会因为进度变化换一次引用，
 * 首页（列表头 + 两条轮播 + 五处区块）跟着每秒重铺一遍是灾难；这里用 `ref` 记住上次的结论，
 * 值没变就一个 `setState` 都不发。
 */
export const usePodEpisodeLive = (): boolean => {
  const [live, setLive] = useState(() => isPodEpisodeLive(getPodPlayerSnapshot()))
  const liveRef = useRef(live)
  useEffect(() => {
    const sync = (): void => {
      const next = isPodEpisodeLive(getPodPlayerSnapshot())
      if (next === liveRef.current) return
      liveRef.current = next
      setLive(next)
    }
    // 挂载时可能对上的已经是最新一次 notify 之后的值，这里补一次兜住时序
    sync()
    return subscribePodPlayer(sync)
  }, [])
  return live
}
