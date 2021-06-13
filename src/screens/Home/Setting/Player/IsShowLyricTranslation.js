import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isShowLyricTranslation = useGetter('common', 'isShowLyricTranslation')
  const setIsShowLyricTranslation = useDispatch('common', 'setIsShowLyricTranslation')


  return (
    <View style={{ marginTop: 15 }}>
      <CheckBoxItem check={isShowLyricTranslation} onChange={setIsShowLyricTranslation} label={t('setting_play_show_translation')} />
    </View>
  )
})
