import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isPlayHighQuality = useGetter('common', 'isPlayHighQuality')
  const setIsPlayHighQuality = useDispatch('common', 'setIsPlayHighQuality')


  return (
    <View style={{ marginTop: 5, marginBottom: 10 }}>
      <CheckBoxItem check={isPlayHighQuality} label={t('setting_play_quality')} onChange={setIsPlayHighQuality} />
    </View>
  )
})
