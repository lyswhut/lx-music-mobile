// import { createStyle } from '@/utils/tools'
import React, { useImperativeHandle, forwardRef, useState, useMemo, useCallback } from 'react'
import { type LayoutChangeEvent, Modal, TouchableWithoutFeedback, View, type ModalProps as _ModalProps, StyleSheet } from 'react-native'
import StatusBar from './StatusBar'
// import { useDimensions } from '@/utils/hooks'

// const styles = createStyle({
//   container: {
//     flex: 1,
//   },
//   // mask: {
//   //   position: 'absolute',
//   //   top: 0,
//   //   left: 0,
//   //   bottom: 0,
//   //   right: 0,
//   //   // width: '100%',
//   //   // height: '100%',
//   // },
// })

export interface ModalProps extends Omit<_ModalProps, 'visible'> {
  onHide?: () => void
  /**
   * 按返回键是否隐藏
   */
  keyHide?: boolean
  /**
   * 点击背景是否隐藏
   */
  bgHide?: boolean
  /**
   * 背景颜色
   */
  bgColor?: string
  /**
   * 是否填充状态栏
   */
  statusBarPadding?: boolean
}


export interface ModalType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<ModalType, ModalProps>(({
  onHide = () => {},
  keyHide = true,
  bgHide = true,
  bgColor = 'rgba(0,0,0,0)',
  statusBarPadding = true,
  children,
  ...props
}: ModalProps, ref) => {
  const [visible, setVisible] = useState(false)
  const [height, setHeight] = useState<number>(0)
  // const { window: windowSize } = useDimensions()
  const handleRequestClose = () => {
    if (keyHide) {
      setVisible(false)
      onHide()
    }
  }
  const handleBgClose = () => {
    if (bgHide) {
      setVisible(false)
      onHide()
    }
  }

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    // console.log('e.nativeEvent.layout.height', e.nativeEvent.layout.height)
    setHeight(e.nativeEvent.layout.height + StatusBar.currentHeight)
  }, [])

  useImperativeHandle(ref, () => ({
    setVisible(_visible) {
      if (visible == _visible) return
      setVisible(_visible)
      if (!_visible) onHide()
    },
  }))

  const memoChildren = useMemo(() => children, [children])

  return (
    <Modal
      animationType="fade"
      transparent={true}
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      visible={visible}
      onRequestClose={handleRequestClose}
      {...props}
    >
      {/* <StatusBar /> */}
      <View style={StyleSheet.absoluteFill} onLayout={handleLayout} />
      {/* <View style={{ flex: 1, paddingTop: statusBarPadding ? StatusBar.currentHeight : 0 }}> */}
      {
        height == 0 ? null
          : (
              <TouchableWithoutFeedback style={{ flex: 1, paddingTop: statusBarPadding ? StatusBar.currentHeight : 0 }} onPress={handleBgClose}>
                <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height, backgroundColor: bgColor }}>
                  {memoChildren}
                </View>
              </TouchableWithoutFeedback>
            )
      }
      {/* </View> */}
    </Modal>
  )
})
