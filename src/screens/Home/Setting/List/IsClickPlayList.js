import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isClickPlayList = useGetter('common', 'isClickPlayList')
  const setIsClickPlayList = useDispatch('common', 'setIsClickPlayList')

  return (
    <View style={{ marginTop: 5, marginBottom: 15 }}>
      <CheckBoxItem check={isClickPlayList} onChange={setIsClickPlayList} label={t('setting_list_click_action')} />
    </View>
  )
})
