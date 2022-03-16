import React, { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import ConfirmAlert from '@/components/common/ConfirmAlert'
import CheckBoxItem from '../components/CheckBoxItem'

import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import { checkOverlayPermission, openOverlayPermissionActivity } from '@/utils/lyricDesktop'

export default memo(() => {
  const { t } = useTranslation()
  const isEnableDesktopLyric = useGetter('common', 'isEnableDesktopLyric')
  const setIsShowDesktopLyric = useDispatch('common', 'setIsShowDesktopLyric')
  const [visibleTips, setVisibleTips] = useState(false)

  const handleChangeEnableDesktopLyric = useCallback(async isEnable => {
    if (isEnable) {
      try {
        await checkOverlayPermission()
        await setIsShowDesktopLyric(isEnable)
      } catch (err) {
        setVisibleTips(true)
        return false
      }
    } else await setIsShowDesktopLyric(isEnable)
    return true
  }, [setIsShowDesktopLyric])

  const handleTipsCancel = useCallback(() => {
    toast(t('disagree_tip'), 'long')
    setVisibleTips(false)
  }, [t])
  const handleTipsConfirm = useCallback(() => {
    setVisibleTips(false)
    openOverlayPermissionActivity()
  }, [])

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={isEnableDesktopLyric} label={t('setting_lyric_desktop_enable')} onChange={handleChangeEnableDesktopLyric} />
      <ConfirmAlert
        visible={visibleTips}
        onHide={handleTipsCancel}
        onConfirm={handleTipsConfirm}
        bgHide={false}
        closeBtn={false}
        cancelText={t('disagree')}
        confirmText={t('agree_go')}
        text={t('setting_lyric_dektop_permission_tip')} />
    </View>
  )
})
