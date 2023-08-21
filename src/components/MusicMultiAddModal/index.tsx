import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Modal, { type MusicMultiAddModalType as ModalType, type MusicMultiAddModalProps as ModalProps, type SelectInfo } from './MusicMultiAddModal'

export interface MusicAddModalProps {
  onAdded?: ModalProps['onAdded']
}
export interface MusicMultiAddModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicMultiAddModalType, MusicAddModalProps>(({ onAdded }, ref) => {
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
      ? <Modal ref={musicMultiAddModalRef} onAdded={onAdded} />
      : null
  )
})
