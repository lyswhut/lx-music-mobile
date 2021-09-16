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
import CheckBoxItem from '../components/CheckBoxItem'

export default memo(() => {
  const { t } = useTranslation()
  const [visibleNewFolder, setVisibleNewFolder] = useState(false)
  const [logText, setLogText] = useState('')
  const theme = useGetter('common', 'theme')
  const isUnmountedRef = useRef(true)
  const [isEnableSyncErrorLog, setIsEnableSyncErrorLog] = useState(false)

  const getErrorLog = () => {
    getLogs().then(log => {
      if (isUnmountedRef.current) return
      const logArr = log.split(/^----lx log----\n|\n----lx log----\n|\n----lx log----$/)
      // console.log(logArr)
      logArr.reverse()
      setLogText(logArr.join('\n\n').replace(/^\n+|\n+$/, ''))
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

  const handleSetEnableSyncErrorLog = enable => {
    setIsEnableSyncErrorLog(enable)
    global.isEnableSyncLog = enable
  }


  useEffect(() => {
    isUnmountedRef.current = false
    setIsEnableSyncErrorLog(global.isEnableSyncLog)
    return () => {
      isUnmountedRef.current = true
    }
    // handleGetAppCacheSize()
  }, [])

  return (
    <>
      <SubTitle title={t('setting_other_log')}>
        <View style={{ paddingTop: 10, paddingBottom: 15, marginLeft: -25 }}>
          <CheckBoxItem check={isEnableSyncErrorLog} label={t('setting_other_log_sync_error_log')} onChange={handleSetEnableSyncErrorLog} />
        </View>
        <View style={styles.btn}>
          <Button onPress={openLogModal}>{t('setting_other_log_btn_show')}</Button>
        </View>
      </SubTitle>
      <ConfirmAlert
        cancelText={t('setting_other_log_btn_hide')}
        confirmText={t('setting_other_log_btn_clean')}
        visible={visibleNewFolder}
        onHide={handleHide}
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
