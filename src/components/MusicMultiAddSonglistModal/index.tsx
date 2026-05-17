import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Modal, { type MusicMultiAddSonglistModalType as ModalType, type MusicMultiAddSonglistModalProps as ModalProps, type SelectInfo } from './MusicMultiAddSonglistModal'

export interface MusicAddSonglistModalProps {
  onAdded?: ModalProps['onAdded']
}
export interface MusicMultiAddSonglistModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicMultiAddSonglistModalType, MusicAddSonglistModalProps>(({ onAdded }, ref) => {
  const musicMultiAddSonglistModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(listInfo) {
      if (visible) musicMultiAddSonglistModalRef.current?.show(listInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicMultiAddSonglistModalRef.current?.show(listInfo)
        })
      }
    },
  }))

  return (
    visible
      ? <Modal ref={musicMultiAddSonglistModalRef} onAdded={onAdded} />
      : null
  )
})
