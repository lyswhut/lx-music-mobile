import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { BackHandler, Pressable, StyleSheet, View, type DrawerLayoutAndroidProps, type LayoutChangeEvent } from 'react-native'
import { usePageVisible } from '@/store/common/hook'
import { type COMPONENT_IDS } from '@/config/constant'

interface Props extends DrawerLayoutAndroidProps {
  visibleNavNames: COMPONENT_IDS[]
  widthPercentage: number
  widthPercentageMax?: number
}

export interface DrawerLayoutFixedType {
  openDrawer: () => void
  closeDrawer: () => void
  fixWidth: () => void
}

export default forwardRef<DrawerLayoutFixedType, Props>(({ children, visibleNavNames, widthPercentage, widthPercentageMax, drawerPosition = 'left', drawerBackgroundColor, renderNavigationView, onDrawerOpen, onDrawerClose, drawerLockMode, style }, ref) => {
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const closeDrawer = useCallback(() => { setVisible(false) }, [])

  useImperativeHandle(ref, () => ({
    openDrawer: () => { if (drawerLockMode !== 'locked-closed') setVisible(true) },
    closeDrawer,
    fixWidth: () => {},
  }), [closeDrawer, drawerLockMode])

  usePageVisible(visibleNavNames, useCallback((pageVisible) => {
    if (!pageVisible) closeDrawer()
  }, [closeDrawer]))

  useEffect(() => {
    if (!visible) return
    onDrawerOpen?.()
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDrawer()
      return true
    })
    return () => {
      subscription.remove()
      onDrawerClose?.()
    }
  }, [visible, closeDrawer, onDrawerOpen, onDrawerClose])

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setWidth(Math.min(Math.floor(layout.width * widthPercentage), widthPercentageMax ?? layout.width))
  }, [widthPercentage, widthPercentageMax])

  return (
    <View style={[{ flex: 1 }, style]} onLayout={handleLayout}>
      <View style={{ flex: 1 }}>{children}</View>
      <View style={[StyleSheet.absoluteFill, { display: visible ? 'flex' : 'none', zIndex: 1 }]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={closeDrawer} />
        <View style={{ position: 'absolute', top: 0, bottom: 0, width, [drawerPosition]: 0, backgroundColor: drawerBackgroundColor }}>
          {renderNavigationView()}
        </View>
      </View>
    </View>
  )
})
