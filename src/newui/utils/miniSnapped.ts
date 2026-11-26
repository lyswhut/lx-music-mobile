import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * 磁吸圆点「贴哪一侧」的模块级共享状态：跨屏记住，热路径只读写内存，落盘为旁路。
 */

/** 贴边侧 */
export type NewUiMiniSide = 'left' | 'right'

/** 持久化 key 单一定义 */
export const NEW_UI_MINI_SIDE_STORAGE_KEY = 'newui.miniSnappedSide'

/** 出厂档：右侧 */
const DEFAULT_SIDE: NewUiMiniSide = 'right'

const isMiniSide = (value: unknown): value is NewUiMiniSide =>
  value === 'left' || value === 'right'

let currentSide: NewUiMiniSide = DEFAULT_SIDE

/** 用户在异步读盘回来之前就拖过 / 吸过 → 以用户那一下为准 */
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
    // 落盘失败不影响本次吸附（下次启动回到上一次成功的值）
  })
}

/**
 * 首次调用时读一次持久化侧（并发调用共享同一个 Promise）。
 * 读到的值与内存当前值不同、且期间用户没碰过，则采用存值。
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
