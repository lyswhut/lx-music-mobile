import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'
import { getIsSupportedAutoTheme } from '@/utils/tools'

const isSupportedAutoTheme = getIsSupportedAutoTheme()

export default memo(() => {
  const { t } = useTranslation()
  const isAutoTheme = useGetter('common', 'isAutoTheme')
  const setIsAutoTheme = useDispatch('common', 'setIsAutoTheme')


  return (
    isSupportedAutoTheme
      ? (
          <View style={{ marginTop: 5, marginBottom: 15 }}>
            <CheckBoxItem check={isAutoTheme} label={t('setting_basic_theme_auto_theme')} onChange={setIsAutoTheme} />
          </View>
        )
      : null
  )
})
