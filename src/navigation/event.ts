/**
 * modal 关闭监听(原 RNN registerModalDismissedListener)。
 * 迁移后:id 为 modal 路由的 route.key,监听导航状态,当该路由从栈中消失时触发 handler。
 */
import { navigationRef } from './navigationRef'

const routeKeyExists = (state: any, id: string): boolean => {
  if (!state?.routes) return false
  for (const r of state.routes) {
    if (r.key === id) return true
    if (r.state && routeKeyExists(r.state, id)) return true
  }
  return false
}

export const onModalDismissed = (id: string, handler: () => void) => {
  let removed = false
  const cleanup = () => {
    if (removed) return
    removed = true
    try { unsubscribe() } catch {}
  }
  const check = () => {
    if (removed || !navigationRef.isReady()) return
    if (!routeKeyExists(navigationRef.getRootState(), id)) {
      cleanup()
      handler()
    }
  }
  const unsubscribe = navigationRef.isReady()
    ? navigationRef.addListener('state', check)
    : () => {}
  return cleanup
}
