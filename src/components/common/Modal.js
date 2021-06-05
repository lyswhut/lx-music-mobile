import React, { memo, useCallback } from 'react'
import { Modal, TouchableWithoutFeedback, StyleSheet, View } from 'react-native'
import { useDimensions } from '@/utils/hooks'

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
})

export default memo(({
  visible = false,
  hideModal = () => {},
  keyHide = true,
  bgHide = true,
  bgColor = 'rgba(0,0,0,0)',
  children,
}) => {
  const { window: windowSize } = useDimensions()
  const handleRequestClose = useCallback(() => {
    if (keyHide) hideModal(false)
  }, [hideModal, keyHide])
  const handleBgClose = useCallback(() => {
    if (bgHide) hideModal(false)
  }, [hideModal, bgHide])

  return (
    <Modal
      animationType="fade"
      transparent={true}
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      visible={visible}
      onRequestClose={handleRequestClose}
    >
      <>
        <TouchableWithoutFeedback style={{ ...styles.mask, width: windowSize.width, height: windowSize.height }} onPress={handleBgClose}>
          <View style={{ ...styles.mask, width: windowSize.width, height: windowSize.height, backgroundColor: bgColor }}></View>
        </TouchableWithoutFeedback>
        {children}
      </>
    </Modal>
  )
})
