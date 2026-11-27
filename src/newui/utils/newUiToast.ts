/**
 * 新 UI 自绘提示胶囊的投递总线（内存级单例，只服务 src/newui）。
 * 发起方 showNewUiToast()，显示由存活屏幕根层的 NewUiToastHost 承接。
 */
export type NewUiToastDuration = 'short' | 'long'

type ToastListener = (message: string, duration: NewUiToastDuration) => void

const listeners = new Set<ToastListener>()

/** 投一条提示（空串不发） */
export const showNewUiToast = (message: string, duration: NewUiToastDuration = 'short'): void => {
  if (message.length === 0) return
  for (const listener of [...listeners]) listener(message, duration)
}

/** Host 侧订阅；返回退订函数 */
export const subscribeNewUiToast = (listener: ToastListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
