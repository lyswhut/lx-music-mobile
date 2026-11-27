import { useMemo } from 'react'
import { Platform, StatusBar, useWindowDimensions, type PlatformIOSStatic } from 'react-native'

// 直连具体实现（不走 @/newui/utils 桶口，避免 hooks↔utils 环）
import { useGestureBarInset } from '@/newui/utils/gestureBar'

export interface NewUiSafeArea {
  /** 状态栏高度 */
  top: number
  /** 底部安全区 */
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

/** 安全区高度（新 UI 自有实现；Android 底部取手势栏 inset，见 utils/gestureBar） */
export const useSafeArea = (): NewUiSafeArea => {
  const { height, width } = useWindowDimensions()
  const gestureInset = useGestureBarInset()
  return useMemo<NewUiSafeArea>(() => {
    if (Platform.OS === 'android') {
      // Android 状态栏由系统给值；底部取手势栏 inset（未融合/三键栏同样成立）
      return { top: StatusBar.currentHeight ?? 0, bottom: gestureInset }
    }
    const notch = height / width >= 2 || getIsPad()
    return { top: getIosTop(getIsPad(), height, width), bottom: notch ? 34 : 0 }
  }, [height, width, gestureInset])
}
