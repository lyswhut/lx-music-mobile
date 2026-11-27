import { useEffect, useState } from 'react'
import { Navigation } from 'react-native-navigation'

/** 转场事件丢失时的兜底放行时长（正常 push 在 300ms 转场结束时就会到） */
const FALLBACK_MS = 1200

/**
 * 推入层是否已完成入场：层内首帧挂重内容会与 push 转场抢 UI 线程，故放到入场之后。
 * 兜底：转场事件丢失时 FALLBACK_MS 后照常放行。
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
