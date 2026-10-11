/**
 * 启动事件(原 RNN registerAppLaunchedListener)。
 * 迁移后:Root 挂载时调用 fireAppLaunched 触发启动处理链;onAppLaunched 注册回调,
 * 若已启动则立即执行(兼容注册时机晚于触发的情况)。
 */
let launched = false
const handlers: Array<() => void | Promise<void>> = []

// 保留导出以兼容 app.ts 调用;react-navigation 下无需额外设置。
export const listenLaunchEvent = () => {}

export const onAppLaunched = (handler: () => void | Promise<void>) => {
  handlers.push(handler)
  if (launched) {
    setImmediate(() => { void handler() })
  }
}

// 由 Root 在挂载时调用:标记已启动并依次执行(等待)所有已注册处理器。
export const fireAppLaunched = async() => {
  if (launched) return
  launched = true
  for (const handler of handlers) {
    try {
      await handler()
    } catch (err) {
      console.error('[app-launched handler error]', err)
    }
  }
}
