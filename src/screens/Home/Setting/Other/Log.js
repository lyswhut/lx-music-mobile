import React, { memo, useRef, useState, useEffect } from 'react'
import { StyleSheet, View, Text, InteractionManager } from 'react-native'
import { getLogs, clearLogs } from '@/utils/log'
import { useGetter } from '@/store'
// import { gzip, ungzip } from 'pako'

import SubTitle from '../components/SubTitle'
import Button from '../components/Button'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import ConfirmAlert from '@/components/common/ConfirmAlert'

export default memo(() => {
  const { t } = useTranslation()
  const [visibleNewFolder, setVisibleNewFolder] = useState(false)
  const [logText, setLogText] = useState('')
  const theme = useGetter('common', 'theme')
  const isUnmountedRef = useRef(true)

  const getErrorLog = () => {
    getLogs().then(log => {
      if (isUnmountedRef.current) return
      const logArr = log.split('\n\n')
      logArr.reverse()
      setLogText(logArr.join('\n').replace(/\n+$/, ''))
    })
  }

  const openLogModal = () => {
    getErrorLog()
    setVisibleNewFolder(true)
  }

  const handleHide = () => {
    setVisibleNewFolder(false)
  }

  const handleCleanLog = () => {
    clearLogs().then(() => {
      toast(t('setting_other_log_tip_clean_success'))
      getErrorLog()
    })
  }


  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
    // handleGetAppCacheSize()
  }, [])

  return (
    <>
      <SubTitle title={t('setting_other_log')}>
        <View style={styles.btn}>
          <Button onPress={openLogModal}>{t('setting_other_log_btn_show')}</Button>
        </View>
      </SubTitle>
      <ConfirmAlert
        cancelText={t('setting_other_log_btn_hide')}
        confirmText={t('setting_other_log_btn_clean')}
        visible={visibleNewFolder}
        onCancel={handleHide}
        onConfirm={handleCleanLog}
        showConfirm={!!logText}
        reverseBtn={true}
        >
        <View style={styles.newFolderContent} onStartShouldSetResponder={() => true}>
          {
            logText
              ? <Text selectable style={{ ...styles.logText, color: theme.normal10 }}>{ logText }</Text>
              : <Text style={{ ...styles.tipText, color: theme.normal10 }}>{t('setting_other_log_tip_null')}</Text>
          }
        </View>
      </ConfirmAlert>
    </>
  )
})

const styles = StyleSheet.create({
  cacheSize: {
    marginBottom: 5,
  },
  btn: {
    flexDirection: 'row',
  },
  tipText: {
    fontSize: 14,
  },
  logText: {
    fontSize: 12,
  },
})
