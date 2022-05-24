import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const desktopLyricSingleLine = useGetter('common', 'desktopLyricSingleLine')
  const setDesktopLyricSingleLine = useDispatch('common', 'setDesktopLyricSingleLine')

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={desktopLyricSingleLine} label={t('setting_lyric_desktop_single_line')} onChange={setDesktopLyricSingleLine} />
    </View>
  )
})
