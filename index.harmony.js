/**
 * HarmonyOS 入口(全量 App)。
 *
 * 用 AppRegistry 注册 react-navigation 根组件 Root(appKey='lxmusic',
 * 与 harmony/.../pages/Index.ets 的 RNApp appKey 一致)。
 * import './src/app' 启动既有初始化编排(字体/核心 init 等),Root 挂载时触发启动链。
 *
 * 构建: npm run bundle-harmony:probe（当前复用此入口）或 bundle-harmony
 */
import './shim'
import { AppRegistry } from 'react-native'
import { Root } from '@/navigation'
import './src/app'

AppRegistry.registerComponent('lxmusic', () => Root)
