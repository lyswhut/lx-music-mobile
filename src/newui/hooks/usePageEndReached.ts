import { useEffect, useRef } from 'react'

/**
 * 「滚动容器触底」跨层信号：滚动容器挂在主屏上，页面拿不到滚动事件，
 * 主屏把 onEndReached 广播到此，需要的页面就地注册处理函数。
 * 广播用快照遍历，防处理函数里同步退订时迭代坏 Set。
 */
type EndReachedHandler = () => void

const handlers = new Set<EndReachedHandler>()

/** 由 PageViewport 的触底回调调用：广播给当前挂载页面里注册了处理的（若有） */
export const emitPageEndReached = (): void => {
  for (const handler of [...handlers]) handler()
}

/** 页面侧订阅触底；handler 经 ref 透传，注册/退订只跟随挂载生命周期 */
export const usePageEndReached = (handler: EndReachedHandler): void => {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  useEffect(() => {
    const stable: EndReachedHandler = () => handlerRef.current()
    handlers.add(stable)
    return () => {
      handlers.delete(stable)
    }
  }, [])
}
