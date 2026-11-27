import { useSyncExternalStore } from 'react'
import { NativeModules, Platform } from 'react-native'
import { Navigation } from 'react-native-navigation'

/**
 * 全面屏手势栏与 App 底栏融合（newui 侧实现，桥接直连 NativeModules，不碰主代码）。
 *
 * 做法（edge-to-edge）：窗口内容延伸到手势栏之下 + 导航栏透明 + 关对比度蒙层，
 * TabBar 自己的底色铺到物理屏幕底边，手势条浮在底栏像素上，天然一体。
 * 窗口底色同步铺成主题 bg 作兜底：RNN 在屏幕转场时会把布局抢回非 edge 模式
 * （Presenter 调 setDecorFitsSystemWindows(true)），过渡帧透出的是窗口底色，不会闪色带。
 *
 * 两个必须持续维护的点：
 * 1. RNN 每次 apply 屏幕 options 都会重置布局模式，故每个屏幕 componentDidAppear
 *    都要重铺一次（installGestureBarFusion 装全局监听统一处理）；
 * 2. JS 布局需要手势栏 inset 高度补底部留白（getGestureBarInset 查询后广播给
 *    useSafeArea，Android 的 bottom 即取此值）。
 */

type GestureBarModule = {
  setGestureBarAppearance: (color: string, lightIcons: boolean) => void
  getNavigationBarHeight: () => Promise<number>
}

const nativeModule = (Platform.OS === 'android'
  ? (NativeModules.UtilsModule as GestureBarModule | undefined)
  : undefined) as GestureBarModule | undefined

// 最近一次融合参数：componentDidAppear 重铺时沿用（主题切换由 effect 再调覆盖）
let lastArgs: [string, boolean] | null = null

// ---------- 手势栏高度 store ----------
let navInset = 0
const listeners = new Set<() => void>()

const setInset = (value: number) => {
  if (value === navInset) return
  navInset = value
  listeners.forEach(fn => fn())
}

const refreshInset = () => {
  void nativeModule?.getNavigationBarHeight().then(h => {
    if (typeof h === 'number' && h > 0) setInset(h)
  }).catch(() => { /* 查询失败保持 0，等同未融合前的旧行为 */ })
}

/**
 * 把系统手势栏融进 App 底栏（幂等，主题切换 / 屏幕挂载 / 转场落位时都可调）。
 * iOS 无系统导航栏，直接忽略。
 */
export const fuseGestureBar = (bg: string, lightBackground: boolean): void => {
  if (!nativeModule) return
  lastArgs = [bg, lightBackground]
  nativeModule.setGestureBarAppearance(bg, lightBackground)
  // 布局模式切换后 inset 才稳定，延后一拍再量
  setTimeout(refreshInset, 0)
}

/** 订阅手势栏高度（dp）。未融合 / 查询失败时为 0，行为回退旧版。 */
export const useGestureBarInset = (): number =>
  useSyncExternalStore(
    fn => {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
    () => navInset,
  )

let fusionInstalled = false
/**
 * 安装全局重铺监听（registerNewUiScreens 时调一次）：
 * RNN 每次屏幕转场都会把窗口抢回非 edge 布局（Presenter.showNavigationBar →
 * setDecorFitsSystemWindows(true)），手势栏区域随之跳变。
 * willAppear 在入场动画起步前就抢回来（消掉动画期间的可见跳变），
 * didAppear 再兜一次底并复量 inset（pop 回来时主屏不重挂载，全靠这里）。
 */
export const installGestureBarFusion = (): void => {
  if (fusionInstalled || !nativeModule) return
  fusionInstalled = true
  const refusion = () => {
    if (lastArgs) nativeModule?.setGestureBarAppearance(...lastArgs)
  }
  Navigation.events().registerComponentWillAppearListener(refusion)
  Navigation.events().registerComponentDidAppearListener(() => {
    refusion()
    refreshInset()
  })
}
