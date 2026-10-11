import * as screenNames from './screenNames'
import * as navigations from './navigation'
import { onAppLaunched } from './regLaunchedEvent'

const init = (callback: () => void | Promise<void>) => {
  // react-navigation 下根组件(Root)由 AppRegistry 注册并渲染,
  // 启动处理链在 Root 挂载时触发(fireAppLaunched)。此处仅注册启动回调。
  onAppLaunched(callback)
}

export * from './utils'
export * from './event'
export * from './hooks'

export {
  init,
  screenNames,
  navigations,
}
export { default as Root } from './Root'
