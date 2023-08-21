import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Modal, { type MusicAddModalType as ModalType, type MusicAddModalProps as ModalProps, type SelectInfo } from './MusicAddModal'

export interface MusicAddModalProps {
  onAdded?: ModalProps['onAdded']
}
export interface MusicAddModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicAddModalType, MusicAddModalProps>(({ onAdded }, ref) => {
  const musicAddModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(listInfo) {
      if (visible) musicAddModalRef.current?.show(listInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicAddModalRef.current?.show(listInfo)
        })
      }
    },
  }))

  return (
    visible
      ? <Modal ref={musicAddModalRef} onAdded={onAdded} />
      : null
  )
})
