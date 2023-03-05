import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { cancelTimeoutExit, getTimeoutExitTime, onTimeUpdate, startTimeoutExit, stopTimeoutExit, useTimeoutExitTimeInfo } from '@/core/player/timeoutExit'
import { useI18n } from '@/lang'
import CheckBox from './common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'

const MAX_MIN = 1440
const rxp = /([1-9]\d*)/
const formatTime = (time: number) => {
  // let d = parseInt(time / 86400)
  // d = d ? d.toString() + ':' : ''
  // time = time % 86400
  let h = Math.trunc(time / 3600)
  let hStr = h ? h.toString() + ':' : ''
  time = time % 3600
  const m = Math.trunc(time / 60).toString().padStart(2, '0')
  const s = Math.trunc(time % 60).toString().padStart(2, '0')
  return `${hStr}${m}:${s}`
}
const Status = () => {
  const theme = useTheme()
  const t = useI18n()
  const exitTimeInfo = useTimeoutExitTimeInfo()
  return (
    <View style={styles.tip}>
      {
      exitTimeInfo.time < 0
        ? (
            <Text>{t('timeout_exit_tip_off')}</Text>
          )
        : (
            <Text>{t('timeout_exit_tip_on', { time: formatTime(exitTimeInfo.time) })}</Text>
          )
      }
      {exitTimeInfo.isPlayedStop ? <Text color={theme['c-font-label']} size={13}>{t('timeout_exit_btn_wait_tip')}</Text> : null}
    </View>
  )
}


interface TimeInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const TimeInput = forwardRef<TimeInputType, {}>((props, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={t('timeout_exit_input_tip')}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})


const Setting = () => {
  const t = useI18n()
  const timeoutExitPlayed = useSettingValue('player.timeoutExitPlayed')
  const onCheckChange = (check: boolean) => {
    updateSetting({ 'player.timeoutExitPlayed': check })
  }

  return (
    <View style={styles.checkbox}>
      <CheckBox check={timeoutExitPlayed} label={t('timeout_exit_label_isPlayed')} onChange={onCheckChange} />
    </View>
  )
}

export const useTimeInfo = () => {
  const [exitTimeInfo, setExitTimeInfo] = useState({
    cancelText: '',
    confirmText: '',
    isPlayedStop: false,
    active: false,
  })
  const t = useI18n()

  useEffect(() => {
    let active: boolean | null = null
    const remove = onTimeUpdate((time, isPlayedStop) => {
      if (time < 0) {
        if (active) {
          setExitTimeInfo({
            cancelText: isPlayedStop ? t('timeout_exit_btn_wait_cancel') : '',
            confirmText: '',
            isPlayedStop,
            active: false,
          })
          active = false
        }
      } else {
        if (active !== true) {
          setExitTimeInfo({
            cancelText: t('timeout_exit_btn_cancel'),
            confirmText: t('timeout_exit_btn_update'),
            isPlayedStop,
            active: true,
          })
          active = true
        }
      }
    })

    return () => {
      remove()
    }
  }, [t])

  return exitTimeInfo
}

export interface TimeoutExitEditModalType {
  show: () => void
}
interface TimeoutExitEditModalProps {
  timeInfo: ReturnType<typeof useTimeInfo>
}

export default forwardRef<TimeoutExitEditModalType, TimeoutExitEditModalProps>(({ timeInfo }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const timeInputRef = useRef<TimeInputType>(null)
  const [visible, setVisible] = useState(false)
  const t = useI18n()

  const handleShow = () => {
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      if (settingState.setting['player.timeoutExit']) timeInputRef.current?.setText(settingState.setting['player.timeoutExit'])
      //   setTimeout(() => {
      //     timeInputRef.current?.focus()
      //   }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleCancel = () => {
    if (timeInfo.isPlayedStop) {
      cancelTimeoutExit()
      return
    }
    if (!timeInfo.active) return
    stopTimeoutExit()
    toast(t('timeout_exit_tip_cancel'))
  }
  const handleConfirm = () => {
    let timeStr = timeInputRef.current?.getText() ?? ''
    if (rxp.test(timeStr)) {
      // if (timeStr != RegExp.$1) toast(t('input_error'))
      timeStr = RegExp.$1
      if (parseInt(timeStr) > MAX_MIN) {
        toast(t('timeout_exit_tip_max', { num: MAX_MIN }))
        // timeStr = timeStr.substring(0, timeStr.length - 1)
        return
      }
    } else {
      if (timeStr.length) toast(t('input_error'))
      timeStr = ''
    }
    if (!timeStr) return
    const time = parseInt(timeStr)
    cancelTimeoutExit()
    startTimeoutExit(time * 60)
    toast(t('timeout_exit_tip_on', { time: formatTime(getTimeoutExitTime()) }))
    updateSetting({ 'player.timeoutExit': String(time) })
    alertRef.current?.setVisible(false)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          cancelText={timeInfo.cancelText}
          confirmText={timeInfo.confirmText}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        >
          <View style={styles.alertContent}>
            <Status />
            <View style={styles.inputContent}>
              <TimeInput ref={timeInputRef} />
              <Text style={styles.inputLabel}>{t('timeout_exit_min')}</Text>
            </View>
            <Setting />
          </View>
        </ConfirmAlert>
      : null
  )
})

const styles = createStyle({
  alertContent: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  tip: {
    marginBottom: 8,
  },
  checkbox: {
    marginTop: 5,
  },
  inputContent: {
    marginTop: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    // borderRadius: 4,
    // paddingTop: 2,
    // paddingBottom: 2,
  },
  inputLabel: {
    marginLeft: 8,
  },
})


