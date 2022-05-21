import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isS2t = useGetter('common', 'isS2t')
  const setIsS2T = useDispatch('common', 'setIsS2T')


  return (
    <View style={{ marginTop: 15 }}>
      <CheckBoxItem check={isS2t} onChange={setIsS2T} label={t('setting_play_s2t')} />
    </View>
  )
})
