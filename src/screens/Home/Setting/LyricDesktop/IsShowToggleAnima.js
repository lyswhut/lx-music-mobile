import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const desktopLyricShowToggleAnima = useGetter('common', 'desktopLyricShowToggleAnima')
  const setDesktopLyricShowToggleAnima = useDispatch('common', 'setDesktopLyricShowToggleAnima')

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={desktopLyricShowToggleAnima} label={t('setting_lyric_desktop_toggle_anima')} onChange={setDesktopLyricShowToggleAnima} />
    </View>
  )
})
