/**
 * react-navigation 全局导航引用 + 启动就绪协调。
 *
 * 原 Wix RNN 用 componentId(字符串)跨组件寻址导航;迁移后改为全局 navigationRef
 * 命令式导航,业务层传入的 componentId 不再用于寻址(仅作为 route.key 存入 store 以
 * 兼容既有逻辑)。
 */
import { createNavigationContainerRef, StackActions, CommonActions } from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<any>()

/** 压入一个新页面(等价 RNN Navigation.push) */
export const navigate = (name: string, params?: Record<string, any>) => {
  if (navigationRef.isReady()) navigationRef.dispatch(StackActions.push(name, params))
}

/** 返回上一页(等价 RNN pop / dismissOverlay) */
export const goBack = () => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack()
}

/** 回到栈底(等价 RNN popToRoot) */
export const popToTop = () => {
  if (navigationRef.isReady()) navigationRef.dispatch(StackActions.popToTop())
}

/** 重置到首页为唯一根(等价 RNN setRoot 到 Home) */
export const resetToHome = (homeName: string) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: homeName }] }))
  }
}

// ── 启动就绪协调 ──
// 保证「核心 init 完成后才渲染导航/首页」的原有时序:Root 等待 appReadyPromise。
let resolveReady: () => void = () => {}
export const appReadyPromise = new Promise<void>((resolve) => { resolveReady = resolve })
let _ready = false
export const markAppReady = () => {
  if (_ready) return
  _ready = true
  resolveReady()
}
