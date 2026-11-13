/**
 * 新 UI 自绘提示胶囊的投递总线（QA 2026-10-14 D-09 观感，总览 L65）。
 * 背景：原型 .toast 是深色贴片胶囊（styles.css L795-803 + app.js L101-107），
 * newui 此前直用系统 ToastAndroid 白框，观感与原型整族贴片（glassPatch）脱节。
 * 口径（硬约束）：`@/utils/tools` 的全局 toast 本体一字不动，旧 UI 调用位继续走系统 toast；
 * 本模块只服务 src/newui，是 utils/tabJump 同族的「不新造路由、内存级单例投递」共通件——
 * 发起方 showNewUiToast()，显示由当前存活屏幕根层的 NewUiToastHost 承接（多 Host 同订阅时
 * 各自就地展示，被盖住的屏看不见即视为未展示，与系统 toast 只在最前台可见的效果一致）。
 * 时长两档对齐既有调用签名：'short' = 原型 2000ms；'long' = 长句自定 3500ms（见 theme.TOAST）。
 */
export type NewUiToastDuration = 'short' | 'long'

type ToastListener = (message: string, duration: NewUiToastDuration) => void

const listeners = new Set<ToastListener>()

/** 投一条提示（空串不发，对齐系统 toast 不弹空白的底线） */
export const showNewUiToast = (message: string, duration: NewUiToastDuration = 'short'): void => {
  if (message.length === 0) return
  for (const listener of [...listeners]) listener(message, duration)
}

/** Host 侧订阅；返回退订函数（useEffect cleanup 直接用） */
export const subscribeNewUiToast = (listener: ToastListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
