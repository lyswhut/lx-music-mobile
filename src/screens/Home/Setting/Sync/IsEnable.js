import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { useTranslation } from '@/plugins/i18n'
import { connect, disconnect, SYNC_CODE } from '@/plugins/sync'
import { getSyncHost, setSyncHost, toast, addSyncHostHistory } from '@/utils/tools'
import InputItem from '../components/InputItem'
import { getWIFIIPV4Address } from '@/utils/utils'

const addressRxp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
const portRxp = /(\d+)/

const HostInput = memo(({ setHost, host, disabled }) => {
  const { t } = useTranslation()

  const hostAddress = useMemo(() => {
    return addressRxp.test(host) ? RegExp.$1 : ''
  }, [host])

  const setHostAddress = useCallback((value, callback) => {
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
      onChange={setHostAddress}
      keyboardType="number-pad"
      placeholder={t('setting_sync_host_tip')} />
  )
})

const PortInput = memo(({ setPort, port, disabled }) => {
  const { t } = useTranslation()

  const portNum = useMemo(() => {
    return portRxp.test(port) ? RegExp.$1 : ''
  }, [port])

  const setPortAddress = useCallback((value, callback) => {
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
      onChange={setPortAddress}
      keyboardType="number-pad"
      placeholder={t('setting_sync_port_tip')} />
  )
})


export default memo(({ hostInfo, setHostInfo, isWaiting, setIsWaiting }) => {
  const { t } = useTranslation()
  const setIsEnableSync = useDispatch('common', 'setIsEnableSync')
  const syncStatus = useGetter('common', 'syncStatus')
  const isEnableSync = useGetter('common', 'isEnableSync')
  const isUnmountedRef = useRef(true)
  const theme = useGetter('common', 'theme')
  const [address, setAddress] = useState('')
  const [visibleCodeModal, setVisibleCodeModal] = useState(false)
  const [authCode, setAuthCode] = useState('')

  useEffect(() => {
    isUnmountedRef.current = false
    getSyncHost().then(hostInfo => {
      if (isUnmountedRef.current) return
      setHostInfo(hostInfo)
    })
    getWIFIIPV4Address().then(address => {
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
        setVisibleCodeModal(true)
        break
      default:
        break
    }
  }, [syncStatus.message, t])

  const handleSetEnableSync = useCallback(flag => {
    setIsEnableSync(flag)

    if (flag) addSyncHostHistory(hostInfo.host, hostInfo.port)

    global.isSyncEnableing = true
    setIsWaiting(true)
    ;(flag ? connect() : disconnect()).finally(() => {
      global.isSyncEnableing = false
      setIsWaiting(false)
    })
  }, [hostInfo, setIsEnableSync, setIsWaiting])


  const setHost = useCallback(host => {
    if (host == hostInfo.host) return
    const newHostInfo = { ...hostInfo, host }
    setSyncHost(newHostInfo)
    setHostInfo(newHostInfo)
  }, [hostInfo])
  const setPort = useCallback(port => {
    if (port == hostInfo.host) return
    const newHostInfo = { ...hostInfo, port }
    setSyncHost(newHostInfo)
    setHostInfo(newHostInfo)
  }, [hostInfo])

  const host = useMemo(() => hostInfo.host, [hostInfo.host])
  const port = useMemo(() => hostInfo.port, [hostInfo.port])

  const status = useMemo(() => {
    return `${syncStatus.message ? syncStatus.message : syncStatus.status ? t('setting_sync_status_enabled') : t('sync_status_disabled')}`
  }, [syncStatus.message, syncStatus.status, t])

  const handleCancelSetCode = useCallback(() => {
    setVisibleCodeModal(false)
  }, [])
  const handleSetCode = useCallback(() => {
    const code = authCode.trim()
    if (code.length != 6) return
    connect(code)
    setAuthCode('')
    setVisibleCodeModal(false)
  }, [authCode])

  return (
    <>
      <View style={{ marginTop: 5 }}>
        <CheckBoxItem disabled={isWaiting || !port || !host} check={isEnableSync} label={t('setting_sync_enbale')} onChange={handleSetEnableSync} />
        <Text style={{ color: theme.normal, marginLeft: 25, marginTop: 10, fontSize: 12 }}>{t('setting_sync_address', { address })}</Text>
        <Text style={{ color: theme.normal, marginLeft: 25, fontSize: 12 }}>{t('setting_sync_status', { status })}</Text>
      </View>
      <View style={{ marginTop: 10 }} >
        <HostInput setHost={setHost} host={host} disabled={isWaiting || isEnableSync} />
        <PortInput setPort={setPort} port={port} disabled={isWaiting || isEnableSync} />
      </View>
      <ConfirmAlert
        visible={visibleCodeModal}
        onHide={handleCancelSetCode}
        onConfirm={handleSetCode}
        >
        <View style={styles.authCodeContent}>
          <Text style={{ color: theme.normal, marginBottom: 5 }}>{t('setting_sync_code_label')}</Text>
          <Input
            placeholder={t('setting_sync_code_input_tip')}
            value={authCode}
            onChangeText={setAuthCode}
            style={{ ...styles.authCodeInput, backgroundColor: theme.secondary40 }}
          />
        </View>
      </ConfirmAlert>
    </>
  )
})


const styles = StyleSheet.create({
  authCodeContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  authCodeInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
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
