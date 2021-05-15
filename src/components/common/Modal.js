import React, { memo, useCallback } from 'react'
import { Modal, TouchableWithoutFeedback } from 'react-native'

export default memo(({
  visible = false,
  hideModal = () => {},
  keyHide = true,
  bgHide = true,
  children,
}) => {
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
      <TouchableWithoutFeedback onPress={handleBgClose}>
        {children}
      </TouchableWithoutFeedback>
    </Modal>
  )
})
