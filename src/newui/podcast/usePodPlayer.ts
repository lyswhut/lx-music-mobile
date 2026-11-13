/**
 * 单集屏要看的播放态（真音频驱动）。
 *
 * 与 `podPlayer.ts` 分文件是刻意的：那边是非 React 的播放器胶水（屏外、离场路径都要读它），
 * 这边只负责「订阅 + 重渲染」。返回值是**快照对象本身**，引用只在数值真变化时更换，
 * 所以可以直接进 `useState` 依赖数组，不会被每秒的空白重渲染牵着跑。
 */
import { useEffect, useState } from 'react'

import { type PodPlayerSnapshot, getPodPlayerSnapshot, subscribePodPlayer } from './podPlayer'

export const usePodPlayer = (): PodPlayerSnapshot => {
  const [snapshot, setSnapshot] = useState<PodPlayerSnapshot>(getPodPlayerSnapshot)
  useEffect(() => {
    const unsubscribe = subscribePodPlayer(() => {
      setSnapshot(getPodPlayerSnapshot())
    })
    // 挂载时可能对上的已经是最新一次 notify 之后的值，这里再取一次兜住时序
    setSnapshot(getPodPlayerSnapshot())
    return () => { unsubscribe() }
  }, [])
  return snapshot
}
