import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * 磁吸圆点的「贴哪一侧」共享状态（原型 app.js `MINI.side`，L2589-2594）。
 *
 * 为什么不能放在某个屏的组件状态里：圆点是全站常驻的一颗——首页 / 五个 Tab / 每一层推入屏
 * 都有自己的挂点（RNN 每个屏是独立原生视图，主屏那颗压不到推入层之上，见 MinibarHost 头注），
 * 而用户拖到左边这件事必须**跨屏记住**。所以侧边收在这一份模块级状态里：
 * 挂点挂载时读它、吸附时写它，同一个 JS 线程里所有挂点立刻同源。
 *
 * 持久化照主题那套（theme/launchScheme.ts）的最小形态：热路径只读写内存，
 * 落盘是旁路 fire-and-forget，读失败 / 无存值一律回出厂档（原型 MINI.side 的初值 'right'）。
 */

/** 贴边侧（原型 `MINI.side`：'left' | 'right'） */
export type NewUiMiniSide = 'left' | 'right'

/** 持久化 key 单一定义 */
export const NEW_UI_MINI_SIDE_STORAGE_KEY = 'newui.miniSnappedSide'

/** 出厂档 = 原型 MINI.side 初值（右侧） */
const DEFAULT_SIDE: NewUiMiniSide = 'right'

const isMiniSide = (value: unknown): value is NewUiMiniSide =>
  value === 'left' || value === 'right'

let currentSide: NewUiMiniSide = DEFAULT_SIDE

/** 用户在异步读盘回来之前就拖过 / 吸过 → 以用户那一下为准，别被旧存值盖回去 */
let touched = false

let hydrating: Promise<NewUiMiniSide> | null = null

/** 同步读当前侧（挂点首帧就用它，不必等 IO） */
export const getNewUiMiniSide = (): NewUiMiniSide => currentSide

/** 写入当前侧（内存立即生效 + 落盘旁路） */
export const setNewUiMiniSide = (next: NewUiMiniSide) => {
  touched = true
  if (currentSide === next) return
  currentSide = next
  void AsyncStorage.setItem(NEW_UI_MINI_SIDE_STORAGE_KEY, next).catch(() => {
    // 落盘失败不影响本次吸附（下次启动回到上一次成功的值，同主题持久化口径）
  })
}

/**
 * 首次调用时读一次持久化侧（并发调用共享同一个 Promise）。
 * 读到的值与内存当前值不同、且期间用户没碰过，则采用存值；返回最终生效的侧。
 */
export const hydrateNewUiMiniSide = (): Promise<NewUiMiniSide> => {
  if (hydrating == null) {
    hydrating = AsyncStorage.getItem(NEW_UI_MINI_SIDE_STORAGE_KEY)
      .then(saved => {
        if (!touched && isMiniSide(saved)) currentSide = saved
        return currentSide
      })
      .catch(() => currentSide)
  }
  return hydrating
}
