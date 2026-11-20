import { useEffect, useState } from 'react'
import { Navigation } from 'react-native-navigation'

/** 转场事件丢失时的兜底放行时长（正常 push 在 300ms 转场结束时就会到） */
const FALLBACK_MS = 1200

/**
 * 推入层是否已经完成入场。
 *
 * RNN 在 push 转场结束时才发 componentDidAppear。层内首帧如果就把重内容（歌曲行、
 * 毛玻璃迷你条、唱盘自转…）挂上原生视图树，会和这段转场抢同一段 UI 线程，表现为
 * 滑到一半顿一下。用这个 hook 把重内容放到入场之后，转场期间只留头部一层轻结构。
 *
 * 兜底：转场被系统关闭 / 事件没送到时，FALLBACK_MS 后照常放行，不能让内容一直不出。
 */
export const useLayerAppeared = (componentId: string): boolean => {
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    let alive = true
    const reveal = () => { if (alive) setAppeared(true) }
    const subscription = Navigation.events().registerComponentListener({
      componentDidAppear: reveal,
    }, componentId)
    const fallback = setTimeout(reveal, FALLBACK_MS)
    return () => {
      alive = false
      clearTimeout(fallback)
      subscription.remove()
    }
  }, [componentId])

  return appeared
}
