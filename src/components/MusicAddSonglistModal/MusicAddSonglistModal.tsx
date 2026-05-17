import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { toast } from '@/utils/tools'
import Title from './Title'
import List from './List'
import { useI18n } from '@/lang'
import { addListMusics } from '@/core/list'
import settingState from '@/store/setting/state'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoLocal | null
  listId: string
}
const initSelectInfo = {}

export interface MusicAddSonglistModalProps {
  onAdded?: () => void
}
export interface MusicAddSonglistModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicAddSonglistModalType, MusicAddSonglistModalProps>(({ onAdded }, ref) => {
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)
  const [selectInfo, setSelectInfo] = useState<SelectInfo>(initSelectInfo as SelectInfo)

  useImperativeHandle(ref, () => ({
    show(selectInfo) {
      setSelectInfo(selectInfo)

      requestAnimationFrame(() => {
        dialogRef.current?.setVisible(true)
      })
    },
  }))

  const handleHide = () => {
    requestAnimationFrame(() => {
      setSelectInfo({ ...selectInfo, musicInfo: null })
    })
  }

  const handleSelect = (listInfo: LX.List.MyListInfo) => {
    dialogRef.current?.setVisible(false)
    void addListMusics(listInfo.id,
      [selectInfo.musicInfo!],
      settingState.setting['list.addMusicLocationType'],
    ).then(() => {
      onAdded?.()
      toast(t('list_edit_action_tip_add_success'))
    }).catch(() => {
      toast(t('list_edit_action_tip_add_failed'))
    })
  }

  return (
    <Dialog ref={dialogRef} onHide={handleHide}>
      {
        selectInfo.musicInfo
          ? (<>
              <Title musicInfo={selectInfo.musicInfo} />
              <List musicInfo={selectInfo.musicInfo} onPress={handleSelect} />
            </>)
          : null
      }
    </Dialog>
  )
})
