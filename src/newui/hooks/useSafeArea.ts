import { useMemo } from 'react'
import { Platform, StatusBar, useWindowDimensions, type PlatformIOSStatic } from 'react-native'

export interface NewUiSafeArea {
  /** 状态栏高度（原型 .statusbar 52px 那一层） */
  top: number
  /** 底部安全区（原型 --safe-b） */
  bottom: number
}

// 全面屏判定：iPhone X 之后高宽比 ≥ 2；灵动岛机型逻辑高度 ≥ 900
const getIosTop = (isPad: boolean, height: number, width: number): number => {
  if (isPad) return 24
  if (height / width < 2) return 20
  return height >= 900 ? 59 : 47
}

// RN 类型只把 isPad 挂在 iOS 分支上，Android 运行时该字段不存在，故统一取值并兜底 false
const getIsPad = (): boolean => (Platform as PlatformIOSStatic).isPad === true

/**
 * 安全区高度（新 UI 自有实现，不依赖旧 PageContent / SizeView）。
 * TODO(真机联调)：如需像素级 insets，改引 react-native-safe-area-context，替换点仅此一处。
 */
export const useSafeArea = (): NewUiSafeArea => {
  const { height, width } = useWindowDimensions()
  return useMemo<NewUiSafeArea>(() => {
    if (Platform.OS === 'android') {
      // Android 状态栏由系统给值；底部导航栏交 RNN navigationBar 处理，不额外留白
      return { top: StatusBar.currentHeight ?? 0, bottom: 0 }
    }
    const notch = height / width >= 2 || getIsPad()
    return { top: getIosTop(getIsPad(), height, width), bottom: notch ? 34 : 0 }
  }, [height, width])
}
