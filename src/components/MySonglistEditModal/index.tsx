import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Modal, { type ModalType as BaseModalType } from '@/components/common/Modal'
import { createStyle, toast } from '@/utils/tools'
import Form from './Form'
import CoverPicker from './CoverPicker'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createMySonglist, updateMySonglist, ensureCoverDir } from '@/core/mySonglist'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { BorderWidths } from '@/theme'

export interface MySonglistEditModalType {
  showCreate: () => void
  show: (listInfo: LX.List.UserListInfo) => void
}

interface EditData {
  id: string | null
  name: string
  desc: string
  picUrl: string | undefined
}

const initialData: EditData = {
  id: null,
  name: '',
  desc: '',
  picUrl: undefined,
}

export default forwardRef<MySonglistEditModalType, {}>((_, ref) => {
  const modalRef = useRef<BaseModalType>(null)
  const [visible, setVisible] = useState(false)
  const [editData, setEditData] = useState<EditData>(initialData)
  const [picUrl, setPicUrl] = useState<string | undefined>(undefined)
  const isCreatingRef = useRef(false)
  const theme = useTheme()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    showCreate() {
      isCreatingRef.current = true
      setEditData({ id: null, name: '', desc: '', picUrl: undefined })
      setPicUrl(undefined)
      if (visible) modalRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => modalRef.current?.setVisible(true))
      }
    },
    show(listInfo: LX.List.UserListInfo) {
      isCreatingRef.current = false
      setEditData({
        id: listInfo.id,
        name: listInfo.name,
        desc: listInfo.desc || '',
        picUrl: listInfo.picUrl,
      })
      setPicUrl(listInfo.picUrl)
      if (visible) modalRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => modalRef.current?.setVisible(true))
      }
    },
  }))

  const handleNameChange = useCallback((name: string) => {
    setEditData(prev => ({ ...prev, name }))
  }, [])

  const handleDescChange = useCallback((desc: string) => {
    setEditData(prev => ({ ...prev, desc }))
  }, [])

  const handleCoverChange = useCallback((url: string | undefined) => {
    setPicUrl(url)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!editData.name.trim()) {
      toast('歌单名称不能为空')
      return
    }

    try {
      await ensureCoverDir()

      if (isCreatingRef.current) {
        const id = await createMySonglist(editData.name.trim(), editData.desc.trim() || undefined, picUrl)
        modalRef.current?.setVisible(false)
        setTimeout(() => {
          navigations.pushMySonglistDetailScreen(commonState.componentIds.home!, id)
        }, 300)
      } else {
        if (!editData.id) return
        await updateMySonglist(editData.id, {
          name: editData.name.trim(),
          desc: editData.desc.trim() || undefined,
          picUrl,
        })
        modalRef.current?.setVisible(false)
      }
    } catch {
      toast('操作失败')
    }
  }, [editData, picUrl])

  const handleHide = useCallback(() => {
    // Modal 内部 setVisible(false) 已自动调用 onHide，此处不再重复调用，避免死循环
    // handleHide 仅作为 onHide 回调，不需要额外操作
  }, [])

  return (
    visible ? (
      <Modal ref={modalRef} onHide={handleHide}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text size={16}>{isCreatingRef.current ? '新建歌单' : '编辑歌单'}</Text>
          </View>
          <View style={styles.content}>
            <CoverPicker picUrl={picUrl} onChange={handleCoverChange} />
            <Form
              name={editData.name}
              desc={editData.desc}
              onNameChange={handleNameChange}
              onDescChange={handleDescChange}
            />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerBtn} onPress={handleHide}>
              <Text color={theme['c-button-font']}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtn} onPress={handleSubmit}>
              <Text color={theme['c-button-font']}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ) : null
  )
})

const styles = createStyle({
  container: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  header: {
    width: '85%',
    paddingTop: 15,
    paddingLeft: 20,
    paddingBottom: 10,
  },
  content: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    paddingTop: 10,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  footer: {
    width: '85%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingBottom: 15,
  },
  footerBtn: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
})
