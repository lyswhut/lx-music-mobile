import React, { memo, useCallback, useEffect, useState, useRef } from 'react'
// import { StyleSheet, View, Text, StatusBar, ScrollView } from 'react-native'

// import { useGetter, useDispatch } from '@/store'
import List from './List'

import { useTranslation } from '@/plugins/i18n'
import { checkStoragePermissions, requestStoragePermission } from '@/utils/common'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import { toast } from '@/utils/tools'


export default ({
  visible = false,
  hide = () => {},
  dirOnly = false,
  title = '',
  filter,
  onConfirm = () => {},
}) => {
  const { t } = useTranslation()
  const [granted, setGranted] = useState(false)
  const [visibleTips, setVisibleTips] = useState(false)

  useEffect(() => {
    if (visible) {
      checkStoragePermissions().then(isGranted => {
        // console.log(isGranted)
        if (isGranted) {
          setGranted(isGranted)
        } else {
          setVisibleTips(true)
        }
      })
    }
  }, [visible])

  const handleTipsCancel = useCallback(() => {
    toast(t('disagree_tip'), 'long')
    setVisibleTips(false)
    hide()
  }, [t, hide])
  const handleTipsConfirm = useCallback(() => {
    setVisibleTips(false)
    if (granted === null) return hide()
    requestStoragePermission().then(result => {
      // console.log(result)
      setGranted(result)
      if (!result) {
        setVisibleTips(true)
        toast(t('storage_permission_tip_disagree'), 'long')
      }
    })
  }, [granted, t, hide])

  return (
    <>
      <List
        dirOnly={dirOnly}
        filter={filter}
        title={title}
        granted={granted}
        hide={hide}
        onConfirm={onConfirm}
        visible={visible} />
      <ConfirmAlert
        visible={visibleTips}
        onHide={handleTipsCancel}
        onConfirm={handleTipsConfirm}
        bgHide={false}
        closeBtn={false}
        showCancel={granted !== null}
        cancelText={t('disagree')}
        confirmText={t('agree')}
        text={t(granted === null ? 'storage_permission_tip_disagree_ask_again' : 'storage_permission_tip_request')} />
    </>
  )
}
