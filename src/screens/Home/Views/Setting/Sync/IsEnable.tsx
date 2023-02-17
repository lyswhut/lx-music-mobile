import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../components/CheckBoxItem'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { connect, disconnect, SYNC_CODE } from '@/plugins/sync'
import InputItem from '../components/InputItem'
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

const addressRxp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
const portRxp = /(\d+)/

const HostInput = memo(({ setHost, host, disabled }: {
  setHost: (host: string) => void
  host: string
  disabled?: boolean
}) => {
  const t = useI18n()

  const hostAddress = useMemo(() => {
    return addressRxp.test(host) ? RegExp.$1 : ''
  }, [host])

  const setHostAddress = useCallback((value: string, callback: (host: string) => void) => {
    let hostAddress = addressRxp.test(value) ? RegExp.$1 : ''
    callback(hostAddress)
    if (host == hostAddress) return
    setHost(hostAddress)
  }, [host, setHost])

  return (
    <InputItem
      editable={!disabled}
      value={hostAddress}
      label={t('setting_sync_host_label')}
      onChanged={setHostAddress}
      keyboardType="number-pad"
      placeholder={t('setting_sync_host_tip')} />
  )
})

const PortInput = memo(({ setPort, port, disabled }: {
  setPort: (port: string) => void
  port: string
  disabled?: boolean
}) => {
  const t = useI18n()

  const portNum = useMemo(() => {
    return portRxp.test(port) ? RegExp.$1 : ''
  }, [port])

  const setPortAddress = useCallback((value: string, callback: (port: string) => void) => {
    let portNum = portRxp.test(value) ? RegExp.$1 : ''
    callback(portNum)
    if (port == portNum) return
    setPort(portNum)
  }, [port, setPort])

  return (
    <InputItem
      editable={!disabled}
      value={portNum}
      label={t('setting_sync_port_label')}
      onChanged={setPortAddress}
      keyboardType="number-pad"
      placeholder={t('setting_sync_port_tip')} />
  )
})


export default memo(({ hostInfo, setHostInfo, isWaiting, setIsWaiting }: {
  hostInfo: { host: string, port: string }
  isWaiting: boolean
  setHostInfo: (hostInfo: { host: string, port: string }) => void
  setIsWaiting: (isWaiting: boolean) => void
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
    void getSyncHost().then(hostInfo => {
      if (isUnmountedRef.current) return
      setHostInfo(hostInfo)
    })
    void getWIFIIPV4Address().then(address => {
      if (isUnmountedRef.current) return
      setAddress(address)
    })

    return () => {
      isUnmountedRef.current = true
    }
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

    if (enable) void addSyncHostHistory(hostInfo.host, hostInfo.port)

    global.lx.isSyncEnableing = true
    setIsWaiting(true)
    ;(enable ? connect() : disconnect()).finally(() => {
      global.lx.isSyncEnableing = false
      setIsWaiting(false)
    })
  }, [hostInfo, setIsEnableSync, setIsWaiting])


  const setHost = useCallback((host: string) => {
    if (host == hostInfo.host) return
    const newHostInfo = { ...hostInfo, host }
    void setSyncHost(newHostInfo)
    setHostInfo(newHostInfo)
  }, [hostInfo])
  const setPort = useCallback((port: string) => {
    if (port == hostInfo.host) return
    const newHostInfo = { ...hostInfo, port }
    void setSyncHost(newHostInfo)
    setHostInfo(newHostInfo)
  }, [hostInfo])

  const host = useMemo(() => hostInfo.host, [hostInfo.host])
  const port = useMemo(() => hostInfo.port, [hostInfo.port])

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
    const code = authCode.trim()
    if (code.length != 6) return
    void connect(code)
    setAuthCode('')
    confirmAlertRef.current?.setVisible(false)
  }, [authCode])

  return (
    <>
      <View style={styles.infoContent}>
        <CheckBoxItem disabled={isWaiting || !port || !host} check={isEnableSync} label={t('setting_sync_enbale')} onChange={handleSetEnableSync} />
        <Text style={styles.textAddr} size={13}>{t('setting_sync_address', { address })}</Text>
        <Text style={styles.text} size={13}>{t('setting_sync_status', { status })}</Text>
      </View>
      <View style={styles.inputContent} >
        <HostInput setHost={setHost} host={host} disabled={isWaiting || isEnableSync} />
        <PortInput setPort={setPort} port={port} disabled={isWaiting || isEnableSync} />
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
