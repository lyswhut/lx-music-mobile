import type { NewUiTabKey } from '@/newui/const/tabs'

/**
 * 「跳去主屏某个 Tab」的跨屏共通件：只做内存级投递，不新造路由。
 */
type TabJumpListener = (key: NewUiTabKey) => void

const listeners = new Set<TabJumpListener>()

/** 投递一次「切到某 Tab」的请求（发起方随后自行 pop 回主屏） */
export const requestNewUiTab = (key: NewUiTabKey): void => {
  for (const listener of [...listeners]) listener(key)
}

/** 主屏侧订阅；返回退订函数 */
export const subscribeNewUiTab = (listener: TabJumpListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
