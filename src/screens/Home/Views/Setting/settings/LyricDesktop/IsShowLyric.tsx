import React, { memo, useRef } from 'react'
import { View } from 'react-native'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import CheckBoxItem from '../../components/CheckBoxItem'

import { createStyle, toast } from '@/utils/tools'

import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { checkDesktopLyricOverlayPermission, hideDesktopLyric, openDesktopLyricOverlayPermissionActivity, showDesktopLyric } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isEnable = useSettingValue('desktopLyric.enable')
  // const setIsShowDesktopLyric = useDispatch('common', 'setIsShowDesktopLyric')
  const confirmAlertRef = useRef<ConfirmAlertType>(null)

  const handleChangeEnableDesktopLyric = async(isEnable: boolean) => {
    if (isEnable) {
      try {
        await checkDesktopLyricOverlayPermission()
        await showDesktopLyric()
      } catch (err) {
        console.log(err)
        confirmAlertRef.current?.setVisible(true)
        // return false
      }
    } else await hideDesktopLyric()
    // return true
    updateSetting({ 'desktopLyric.enable': isEnable })
  }

  const handleTipsCancel = () => {
    toast(t('disagree_tip'), 'long')
  }
  const handleTipsConfirm = () => {
    confirmAlertRef.current?.setVisible(false)
    void openDesktopLyricOverlayPermissionActivity()
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isEnable} onChange={(enable) => { void handleChangeEnableDesktopLyric(enable) }} label={t('setting_lyric_desktop_enable')} />
      <ConfirmAlert
        ref={confirmAlertRef}
        onCancel={handleTipsCancel}
        onConfirm={handleTipsConfirm}
        bgHide={false}
        closeBtn={false}
        cancelText={t('disagree')}
        confirmText={t('agree_go')}
        text={t('setting_lyric_dektop_permission_tip')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
