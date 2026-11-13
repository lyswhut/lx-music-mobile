import type { NewUiTabKey } from '@/newui/const/tabs'

/**
 * 「跳去主屏某个 Tab」的跨屏共通件（10b 轮：搜索空态里那枚「到设定页查看音源」胶囊）。
 * 背景：Tab 态是 MainScreen 内部 useState（对应原型 switchTab），搜索/详情等推入式整屏
 * 拿不到 setter；原型里这颗钮做的是 closeSearch() + switchTab('setting') 两步，RN 等价物
 * 就是「先投递目标 Tab，再 pop 回主屏」——主屏存活期间订阅即收得到。
 * 约定：不新造路由、不动 navigation/entry 的注册表，只做这一条内存级投递
 * （进程内单例，主屏卸载时随订阅退订，无持久状态、不造假能力）。
 */
type TabJumpListener = (key: NewUiTabKey) => void

const listeners = new Set<TabJumpListener>()

/** 投递一次「切到某 Tab」的请求（发起方随后自行 pop 回主屏） */
export const requestNewUiTab = (key: NewUiTabKey): void => {
  for (const listener of [...listeners]) listener(key)
}

/** 主屏侧订阅；返回退订函数（useEffect cleanup 直接用） */
export const subscribeNewUiTab = (listener: TabJumpListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
