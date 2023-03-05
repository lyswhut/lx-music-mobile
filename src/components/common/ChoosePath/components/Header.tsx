import React, { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import StatusBar from '@/components/common/StatusBar'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { createStyle, toast } from '@/utils/tools'
import { mkdir } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
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


export default memo(({ title, path, onRefreshDir }: {
  title: string
  path: string
  onRefreshDir: (dir: string) => Promise<void>
}) => {
  const theme = useTheme()
  const confirmAlertRef = useRef<ConfirmAlertType>(null)
  const nameInputRef = useRef<NameInputType>(null)

  const refresh = () => {
    void onRefreshDir(path)
  }

  const handleShow = () => {
    confirmAlertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 300)
    })
  }

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
    const newPath = `${path}/${text}`
    mkdir(newPath).then(() => {
      void onRefreshDir(path).then(() => {
        void onRefreshDir(newPath)
      })
      nameInputRef.current?.setName('')
    }).catch((err: any) => {
      toast('Create failed: ' + (err.message as string))
    })
    confirmAlertRef.current?.setVisible(false)
  }

  return (
    <>
      <View style={{
        ...styles.header,
        height: scaleSizeH(50) + StatusBar.currentHeight,
        paddingTop: StatusBar.currentHeight,
        backgroundColor: theme['c-content-background'],
      }} onStartShouldSetResponder={() => true}>
        <View style={styles.titleContent}>
          <Text color={theme['c-primary-font']} numberOfLines={1}>{title}</Text>
          <Text style={styles.subTitle} color={theme['c-primary-font']} size={13} numberOfLines={1}>{path}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShow}>
            <Icon name="add_folder" color={theme['c-primary-font']} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={refresh}>
            <Icon name="available_updates" color={theme['c-primary-font']} size={22} />
          </TouchableOpacity>
        </View>
      </View>
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
    </>
  )
})

const styles = createStyle({
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    elevation: 2,
    // borderBottomWidth: BorderWidths.normal,
  },
  titleContent: {
    flexGrow: 1,
    flexShrink: 1,
    // height: 57,
    // paddingRight: 5,
    // paddingBottom: 10,
  },
  // title: {
  //   paddingTop: 10,
  // },
  subTitle: {
    paddingTop: 1,
  },
  actions: {
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionBtn: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 6,
    paddingRight: 6,
    marginLeft: 10,
  },
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

