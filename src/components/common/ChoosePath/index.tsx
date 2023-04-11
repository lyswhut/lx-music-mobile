import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
// import { StyleSheet, View, Text, StatusBar, ScrollView } from 'react-native'

// import { useGetter, useDispatch } from '@/store'
import List, { type ListType } from './List'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { checkStoragePermissions, requestStoragePermission, toast } from '@/utils/tools'
import { useI18n } from '@/lang'

interface ReadOptions {
  title: string
  dirOnly?: boolean
  filter?: RegExp
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

  useImperativeHandle(ref, () => ({
    show(options) {
      void checkStoragePermissions().then(isGranted => {
        readOptions.current = options
        if (isGranted) {
          listRef.current?.show(options.title, options.dirOnly, options.filter)
        } else {
          confirmAlertRef.current?.setVisible(true)
        }
      })
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
        listRef.current?.show(readOptions.current.title, readOptions.current.dirOnly, readOptions.current.filter)
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
