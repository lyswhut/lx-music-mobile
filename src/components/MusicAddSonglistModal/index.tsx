import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Modal, { type MusicAddSonglistModalType as ModalType, type MusicAddSonglistModalProps as ModalProps, type SelectInfo } from './MusicAddSonglistModal'

export interface MusicAddSonglistModalProps {
  onAdded?: ModalProps['onAdded']
}
export interface MusicAddSonglistModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicAddSonglistModalType, MusicAddSonglistModalProps>(({ onAdded }, ref) => {
  const musicAddSonglistModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(listInfo) {
      if (visible) musicAddSonglistModalRef.current?.show(listInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicAddSonglistModalRef.current?.show(listInfo)
        })
      }
    },
  }))

  return (
    visible
      ? <Modal ref={musicAddSonglistModalRef} onAdded={onAdded} />
      : null
  )
})
