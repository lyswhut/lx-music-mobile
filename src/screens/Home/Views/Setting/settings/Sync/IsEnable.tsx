import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { connectServer, disconnectServer } from '@/plugins/sync'
import InputItem from '../../components/InputItem'
import { getWIFIIPV4Address } from '@/utils/nativeModules/utils'
import { createStyle, toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { addSyncHostHistory, getSyncHost, setSyncHost } from '@/utils/data'
import { setSyncMessage } from '@/core/sync'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { useStatus } from '@/store/sync/hook'
import Text from '@/components/common/Text'
import { SYNC_CODE } from '@/config/constant'

const addressRxp = /^https?:\/\/\S+/i

const HostInput = memo(({ setHost, host, disabled }: {
  setHost: (host: string) => void
  host: string
  disabled?: boolean
}) => {
  const t = useI18n()

  const hostAddress = useMemo(() => {
    return addressRxp.test(host) ? host : ''
  }, [host])

  const setHostAddress = useCallback((value: string, callback: (host: string) => void) => {
    let hostAddress: string
    if (addressRxp.test(value)) hostAddress = value.trim()
    else {
      hostAddress = ''
      if (value) toast(t('setting_sync_host_value_error_tip'), 'long')
    }
    callback(hostAddress)
    if (host == hostAddress) return
    setHost(hostAddress)
  }, [host, setHost, t])

  return (
    <InputItem
      editable={!disabled}
      value={hostAddress}
      label={t('setting_sync_host_label')}
      onChanged={setHostAddress}
      inputMode="url"
      // keyboardType="url"
      placeholder={t('setting_sync_host_value_tip')} />
  )
})


export default memo(({ host, setHost }: {
  host: string
  setHost: (host: string) => void
}) => {
  const t = useI18n()
  const setIsEnableSync = useCallback((enable: boolean) => {
    updateSetting({ 'sync.enable': enable })
  }, [])
  const syncStatus = useStatus()
  const isEnableSync = useSettingValue('sync.enable')
  const isUnmountedRef = useRef(true)
  const theme = useTheme()
  const [address, setAddress] = useState('')
  const [authCode, setAuthCode] = useState('')
  const confirmAlertRef = useRef<ConfirmAlertType>(null)

  useEffect(() => {
    isUnmountedRef.current = false
    void getSyncHost().then(host => {
      if (isUnmountedRef.current) return
      setHost(host)
    })
    void getWIFIIPV4Address().then(address => {
      if (isUnmountedRef.current) return
      setAddress(address)
    })

    return () => {
      isUnmountedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    switch (syncStatus.message) {
      case SYNC_CODE.authFailed:
        toast(t('setting_sync_code_fail'))
      case SYNC_CODE.missingAuthCode:
        confirmAlertRef.current?.setVisible(true)
        break
      case SYNC_CODE.msgBlockedIp:
        toast(t('setting_sync_code_blocked_ip'))
        break
      default:
        break
    }
  }, [syncStatus.message, t])

  const handleSetEnableSync = useCallback((enable: boolean) => {
    setIsEnableSync(enable)

    if (enable) void addSyncHostHistory(host)

    void (enable ? connectServer(host) : disconnectServer())
  }, [host, setIsEnableSync])


  const handleUpdateHost = useCallback((h: string) => {
    if (h == host) return
    void setSyncHost(h)
    setHost(h)
  }, [host, setHost])


  const status = useMemo(() => {
    let status
    switch (syncStatus.message) {
      case SYNC_CODE.msgBlockedIp:
        status = t('setting_sync_code_blocked_ip')
        break
      case SYNC_CODE.authFailed:
        status = t('setting_sync_code_fail')
        break
      default:
        status = syncStatus.message
          ? syncStatus.message
          : syncStatus.status
            ? t('setting_sync_status_enabled')
            : t('sync_status_disabled')
        break
    }
    return status
  }, [syncStatus.message, syncStatus.status, t])

  const handleCancelSetCode = useCallback(() => {
    setSyncMessage('')
    confirmAlertRef.current?.setVisible(false)
  }, [])
  const handleSetCode = useCallback(() => {
    // const code = authCode.trim()
    // if (code.length != 6) return
    void connectServer(host, authCode)
    setAuthCode('')
    confirmAlertRef.current?.setVisible(false)
  }, [host, authCode])

  return (
    <>
      <View style={styles.infoContent}>
        <CheckBoxItem disabled={!host} check={isEnableSync} label={t('setting_sync_enbale')} onChange={handleSetEnableSync} />
        <Text style={styles.textAddr} size={13}>{t('setting_sync_address', { address })}</Text>
        <Text style={styles.text} size={13}>{t('setting_sync_status', { status })}</Text>
      </View>
      <View style={styles.inputContent} >
        <HostInput setHost={handleUpdateHost} host={host} disabled={isEnableSync} />
      </View>
      <ConfirmAlert
        onCancel={handleCancelSetCode}
        onConfirm={handleSetCode}
        ref={confirmAlertRef}
        >
        <View style={styles.authCodeContent}>
          <Text style={styles.authCodeLabel}>{t('setting_sync_code_label')}</Text>
          <Input
            placeholder={t('setting_sync_code_input_tip')}
            value={authCode}
            onChangeText={setAuthCode}
            style={{ ...styles.authCodeInput, backgroundColor: theme['c-primary-background'] }}
          />
        </View>
      </ConfirmAlert>
    </>
  )
})


const styles = createStyle({
  infoContent: {
    marginTop: 5,
  },
  textAddr: {
    marginLeft: 25,
    marginTop: 5,
  },
  text: {
    marginLeft: 25,
  },
  inputContent: {
    marginTop: 8,
  },
  authCodeContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  authCodeLabel: {
    marginBottom: 5,
  },
  authCodeInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 260,
    borderRadius: 4,
    // paddingTop: 2,
    // paddingBottom: 2,
    // fontSize: 14,
  },

  // tagTypeList: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  // },
  // tagButton: {
  //   // marginRight: 10,
  //   borderRadius: 4,
  //   marginRight: 10,
  //   marginBottom: 10,
  // },
  // tagButtonText: {
  //   paddingLeft: 12,
  //   paddingRight: 12,
  //   paddingTop: 8,
  //   paddingBottom: 8,
  // },
})
