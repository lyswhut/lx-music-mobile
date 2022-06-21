import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const autoHidePlayBar = useGetter('common', 'autoHidePlayBar')
  const setAutoHidePlayBar = useDispatch('common', 'setAutoHidePlayBar')


  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={autoHidePlayBar} label={t('setting_basic_auto_hide_play_bar')} onChange={setAutoHidePlayBar} />
    </View>
  )
})
