import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const startupAutoPlay = useGetter('common', 'startupAutoPlay')
  const setStartupAutoPlay = useDispatch('common', 'setStartupAutoPlay')


  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={startupAutoPlay} label={t('setting_basic_startup_auto_play')} onChange={setStartupAutoPlay} />
    </View>
  )
})
