import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
// import { StyleSheet, View, Text, StatusBar, ScrollView } from 'react-native'

// import { useGetter, useDispatch } from '@/store'
import List, { type ListType } from './List'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { toast, TEMP_FILE_PATH, checkStoragePermissions, requestStoragePermission, confirmDialog } from '@/utils/tools'
import { useI18n } from '@/lang'
import { selectFile, unlink } from '@/utils/fs'
import { useUnmounted } from '@/utils/hooks'
import settingState from '@/store/setting/state'
import { log } from '@/utils/log'
import { updateSetting } from '@/core/common'

export interface ReadOptions {
  title: string
  isPersist?: boolean
  dirOnly?: boolean
  filter?: string[]
}
const initReadOptions = {}

interface ChoosePathProps {
  onConfirm: (path: string) => void
}

export interface ChoosePathType {
  show: (options: ReadOptions) => void
}

export default forwardRef<ChoosePathType, ChoosePathProps>(({
  onConfirm = () => {},
}: ChoosePathProps, ref) => {
  const t = useI18n()
  const listRef = useRef<ListType>(null)
  const confirmAlertRef = useRef<ConfirmAlertType>(null)
  const [deny, setDeny] = useState(false)
  const readOptions = useRef<ReadOptions>(initReadOptions as ReadOptions)
  const isUnmounted = useUnmounted()

  const handleOpenExternalStorage = async(options: ReadOptions) => {
    return checkStoragePermissions().then(isGranted => {
      readOptions.current = options
      if (isGranted) {
        listRef.current?.show(options.title, '', options.dirOnly, options.filter)
      } else {
        confirmAlertRef.current?.setVisible(true)
      }
    })
  }

  useImperativeHandle(ref, () => ({
    show(options) {
      if (!settingState.setting['common.useSystemFileSelector'] || options.dirOnly) {
        // if (options.isPersist) {
        void handleOpenExternalStorage(options)
        // } else {
        //   void selectManagedFolder().then((dir) => {
        //     if (!dir || isUnmounted.current) return
        //     listRef.current?.show(options.title, dir.path, options.dirOnly, options.filter)
        //   })
        // }
      } else {
        void selectFile({
          extTypes: options.filter,
          toPath: TEMP_FILE_PATH,
        }).then((file) => {
          // console.log(file)
          if (!file || isUnmounted.current) return
          if (options.filter && !options.filter.some(ext => file.data.endsWith('.' + ext))) {
            toast(t('storage_file_no_match'), 'long')
            void unlink(file.data)
            return
          }
          onConfirm(file.data)
        }).catch(err => {
          if (isUnmounted.current) return
          log.warn('open document failed: ' + err.message)
          void confirmDialog({
            message: t('storage_file_no_select_file_failed_tip'),
            bgClose: false,
          }).then((confirm) => {
            if (!confirm) {
              toast(t('disagree_tip'), 'long')
              return
            }
            updateSetting({ 'common.useSystemFileSelector': false })
            void handleOpenExternalStorage(options)
          })
        })
      }
    },
  }))

  const handleTipsCancel = () => {
    toast(t('disagree_tip'), 'long')
  }
  const handleTipsConfirm = () => {
    confirmAlertRef.current?.setVisible(false)
    void requestStoragePermission().then(result => {
      // console.log(result)
      setDeny(result == null)
      if (result) {
        listRef.current?.show(readOptions.current.title, '', readOptions.current.dirOnly, readOptions.current.filter)
      } else {
        toast(t('storage_permission_tip_disagree'), 'long')
      }
    })
  }
  const onPathConfirm = (path: string) => {
    listRef.current?.hide()
    onConfirm(path)
  }

  return (
    <>
      <List ref={listRef} onConfirm={onPathConfirm} />
      <ConfirmAlert
        ref={confirmAlertRef}
        onCancel={handleTipsCancel}
        onConfirm={handleTipsConfirm}
        bgHide={false}
        closeBtn={false}
        showConfirm={!deny}
        cancelText={t('disagree')}
        confirmText={t('agree')}
        text={t(deny ? 'storage_permission_tip_disagree_ask_again' : 'storage_permission_tip_request')} />
    </>
  )
})
