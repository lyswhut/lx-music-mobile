import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { toast } from '@/utils/tools'
import Title from './Title'
import List from './List'
import { useI18n } from '@/lang'
import { addListMusics } from '@/core/list'
import settingState from '@/store/setting/state'

export interface SelectInfo {
  selectedList: LX.Music.MusicInfoLocal[]
  listId: string
}
const initSelectInfo: SelectInfo = { selectedList: [], listId: '' }

export interface MusicMultiAddSonglistModalProps {
  onAdded?: () => void
}
export interface MusicMultiAddSonglistModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicMultiAddSonglistModalType, MusicMultiAddSonglistModalProps>(({ onAdded }, ref) => {
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)
  const [selectInfo, setSelectInfo] = useState<SelectInfo>(initSelectInfo)

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
      setSelectInfo({ selectedList: [], listId: selectInfo.listId })
    })
  }

  const handleSelect = (listInfo: LX.List.MyListInfo) => {
    dialogRef.current?.setVisible(false)
    void addListMusics(listInfo.id,
      [...selectInfo.selectedList],
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
        selectInfo.selectedList.length
          ? (<>
              <Title selectedList={selectInfo.selectedList} />
              <List listId={selectInfo.listId} onPress={handleSelect} />
            </>)
          : null
      }
    </Dialog>
  )
})
