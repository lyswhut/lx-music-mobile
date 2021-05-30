import React, { useCallback, memo, useMemo, useEffect, useState, useRef } from 'react'
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import { useTranslation } from '@/plugins/i18n'
import Input from '@/components/common/Input'
import { startTimeoutExit, stopTimeoutExit, useTimeoutExitTime, getTimeoutExitTime } from '@/utils/timeoutExit'
import { toast } from '@/utils/tools'
import CheckBox from '@/components/common/CheckBox'

const MAX_MIN = 1440
const formatTime = time => {
  // let d = parseInt(time / 86400)
  // d = d ? d.toString() + ':' : ''
  // time = time % 86400
  let h = parseInt(time / 3600)
  h = h ? h.toString() + ':' : ''
  time = time % 3600
  const m = parseInt(time / 60).toString().padStart(2, '0')
  const s = parseInt(time % 60).toString().padStart(2, '0')
  return `${h}${m}:${s}`
}
const rxp = /([1-9]\d*)/
const Status = ({ exitTime }) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  return (
    <View style={styles.tip}>
      {
      exitTime < 0
        ? (
            <Text style={{ color: theme.normal }}>{t('timeout_exit_tip_off')}</Text>
          )
        : (
            <Text style={{ color: theme.normal }}>{t('timeout_exit_tip_on', { time: formatTime(exitTime) })}</Text>
          )
    }
    </View>
  )
}

export default memo(() => {
  const theme = useGetter('common', 'theme')
  const [visibleAlert, setVisibleAlert] = useState(false)
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const exitTime = useTimeoutExitTime()
  const inputRef = useRef()
  const timeoutExit = useGetter('common', 'timeoutExit')
  const timeoutExitPlayed = useGetter('common', 'timeoutExitPlayed')
  const setTimeoutExit = useDispatch('common', 'setTimeoutExit')
  const timeInfo = useMemo(() => {
    return exitTime < 0
      ? { cancelText: '', confirmText: '', active: false }
      : {
          cancelText: t('timeout_exit_btn_cancel'),
          confirmText: t('timeout_exit_btn_update'),
          active: true,
        }
  }, [exitTime, t])

  const handleShowTimeoutAlert = () => {
    setText(timeoutExit)
    setVisibleAlert(true)
    global.requestAnimationFrame(() => {
      inputRef.current.focus()
    })
  }
  const handleAlertHide = () => {
    setVisibleAlert(false)
  }
  const handleAlertCancel = () => {
    setVisibleAlert(false)
    if (!timeInfo.active) return
    stopTimeoutExit()
    toast(t('timeout_exit_tip_cancel'))
  }
  const handleAlertConfirm = () => {
    // if (filterFileName.test(text)) {
    //   toast(t('create_new_folder_error_tip'), 'long')
    //   return
    // }
    const time = parseInt(text)
    if (!time) return
    startTimeoutExit(time * 60)
    setVisibleAlert(false)
    toast(t('timeout_exit_tip_on', { time: formatTime(getTimeoutExitTime()) }))
    global.isPlayedExit = false
    setTimeoutExit({ time: String(time) })
  }
  const onChangeText = useCallback(text => {
    if (rxp.test(text)) {
      if (text != RegExp.$1) toast(t('input_error'))
      text = RegExp.$1
      if (parseInt(text) > MAX_MIN) {
        toast(t('timeout_exit_tip_max', { num: MAX_MIN }))
        text = text.substring(0, text.length - 1)
      }
    } else {
      if (text.length) toast(t('input_error'))
      text = ''
    }
    setText(text)
  }, [t])

  const onCheckChange = check => {
    setTimeoutExit({ isPlayed: check })
  }


  return (
    <>
      <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={handleShowTimeoutAlert}>
        <Icon name="alarm-snooze" style={{ color: timeInfo.active ? theme.secondary20 : theme.normal30 }} size={24} />
      </TouchableOpacity>
      <ConfirmAlert
        visible={visibleAlert}
        onHide={handleAlertHide}
        onCancel={handleAlertCancel}
        onConfirm={handleAlertConfirm}
        cancelText={timeInfo.cancelText}
        confirmText={timeInfo.confirmText}
        >
        <View style={styles.alertContent}>
          <Status exitTime={exitTime} />
          <View style={styles.inputContent}>
            <Input
              ref={inputRef}
              value={text}
              onChangeText={onChangeText}
              style={{ ...styles.input, backgroundColor: theme.secondary40 }} />
            <Text style={{ marginLeft: 5, color: theme.normal }}>{t('timeout_exit_min')}</Text>
          </View>
          <View style={styles.checkbox}>
            <CheckBox check={timeoutExitPlayed} label={t('timeout_exit_label_isPlayed')} onChange={onCheckChange} />
          </View>
        </View>
      </ConfirmAlert>
    </>
  )
})

const styles = StyleSheet.create({
  cotrolBtn: {
    marginLeft: 5,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
  alertContent: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  tip: {
    marginBottom: 8,
  },
  checkbox: {
    marginTop: 5,
    marginBottom: -5,
  },
  inputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
  },
})
