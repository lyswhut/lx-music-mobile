import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isEnableDesktopLyric = useGetter('common', 'isEnableDesktopLyric')
  const setIsShowDesktopLyric = useDispatch('common', 'setIsShowDesktopLyric')

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={isEnableDesktopLyric} label={t('setting_lyric_desktop_enable')} onChange={setIsShowDesktopLyric} />
    </View>
  )
})
