import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isShowLyricRoma = useGetter('common', 'isShowLyricRoma')
  const setIsShowLyricRoma = useDispatch('common', 'setIsShowLyricRoma')


  return (
    <View style={{ marginTop: 15 }}>
      <CheckBoxItem check={isShowLyricRoma} onChange={setIsShowLyricRoma} label={t('setting_play_show_roma')} />
    </View>
  )
})
