import { useEffect, useRef } from 'react'

/**
 * 「滚动容器触底」跨层信号（第 7b 轮排行榜分批续取引入）。
 * 背景：页面滚动容器 PageViewport 挂在主屏（MainScreen）上、五个 Tab 页共用一个实例，
 * 页面组件拿不到 ScrollView 的滚动事件。主屏把 onEndReached 广播到这里，
 * 需要触底的页面（当前只有排行榜）就地注册处理函数——页面与主屏互不import彼此的业务。
 * 同一时刻只有一个页面挂载（主屏按 tabKey 重挂载），监听者天然最多一个；
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
