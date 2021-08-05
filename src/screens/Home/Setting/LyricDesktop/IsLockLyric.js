import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isLockDesktopLyric = useGetter('common', 'isLockDesktopLyric')
  const setIsLockDesktopLyric = useDispatch('common', 'setIsLockDesktopLyric')

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={isLockDesktopLyric} label={t('setting_lyric_desktop_lock')} onChange={setIsLockDesktopLyric} />
    </View>
  )
})
