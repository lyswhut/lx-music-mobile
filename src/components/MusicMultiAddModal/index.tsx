import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Modal, { type MusicMultiAddModalType as ModalType, type SelectInfo } from './MusicMultiAddModal'

export interface MusicMultiAddModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicMultiAddModalType, {}>((props, ref) => {
  const musicMultiAddModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(listInfo) {
      if (visible) musicMultiAddModalRef.current?.show(listInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicMultiAddModalRef.current?.show(listInfo)
        })
      }
    },
  }))

  return (
    visible
      ? <Modal ref={musicMultiAddModalRef} />
      : null
  )
})
