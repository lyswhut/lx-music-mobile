import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Image from '@/components/common/Image'
import Modal, { type ModalType } from '@/components/common/Modal'

export interface ImagePreviewModalType {
  show: (url: string) => void
}

export default forwardRef<ImagePreviewModalType>((_, ref) => {
  const [url, setUrl] = useState('')
  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    show(imageUrl: string) {
      setUrl(imageUrl)
      modalRef.current?.setVisible(true)
    },
  }))

  const handleClose = useCallback(() => {
    modalRef.current?.setVisible(false)
    setUrl('')
  }, [])

  return (
    <Modal ref={modalRef} bgHide={false} keyHide={true} bgColor="rgba(0,0,0,0.85)">
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image url={url} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
      </TouchableOpacity>
    </Modal>
  )
})
