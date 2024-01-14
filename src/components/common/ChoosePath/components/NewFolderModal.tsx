import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import Text from '@/components/common/Text'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { createStyle, toast } from '@/utils/tools'
import { mkdir } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import type { PathItem } from './ListItem'
const filterFileName = /[\\/:*?#"<>|]/


interface NameInputType {
  setName: (text: string) => void
  getText: () => string
  focus: () => void
}
const NameInput = forwardRef<NameInputType, {}>((props, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setName(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={global.i18n.t('create_new_folder_tip')}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})

export interface NewFolderType {
  show: (path: string) => void
}
export default forwardRef<NewFolderType, { onRefreshDir: (dir: string) => Promise<PathItem[]> }>(({ onRefreshDir }, ref) => {
  const confirmAlertRef = useRef<ConfirmAlertType>(null)
  const nameInputRef = useRef<NameInputType>(null)
  const pathRef = useRef<string>('')

  useImperativeHandle(ref, () => ({
    show(path) {
      pathRef.current = path
      confirmAlertRef.current?.setVisible(true)
      requestAnimationFrame(() => {
        setTimeout(() => {
          nameInputRef.current?.focus()
        }, 300)
      })
    },
  }))

  const handleHideNewFolderAlert = () => {
    nameInputRef.current?.setName('')
  }
  const handleConfirmNewFolderAlert = () => {
    const text = nameInputRef.current?.getText() ?? ''
    if (!text) return
    if (filterFileName.test(text)) {
      toast(global.i18n.t('create_new_folder_error_tip'), 'long')
      return
    }
    const newPath = `${pathRef.current}/${text}`
    mkdir(newPath).then(() => {
      void onRefreshDir(pathRef.current).then((list) => {
        const target = list.find(item => item.name == text)
        if (target) void onRefreshDir(target.path)
      })
      nameInputRef.current?.setName('')
    }).catch((err: any) => {
      toast('Create failed: ' + (err.message as string))
    })
    confirmAlertRef.current?.setVisible(false)
  }

  return (
    <ConfirmAlert
      onHide={handleHideNewFolderAlert}
      onConfirm={handleConfirmNewFolderAlert}
      ref={confirmAlertRef}
    >
      <View style={styles.newFolderContent}>
        <Text style={styles.newFolderTitle}>{global.i18n.t('create_new_folder')}</Text>
        <NameInput ref={nameInputRef} />
      </View>
    </ConfirmAlert>
  )
})

const styles = createStyle({
  newFolderContent: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  newFolderTitle: {
    marginBottom: 5,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
})

