import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { useGetter } from '@/store'
import { useTranslation } from '@/plugins/i18n'

export const Loading = memo(() => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  return (
    <View style={{ alignItems: 'center', padding: 10 }}>
      <Text style={{ color: theme.normal30 }}>{t('list_loading')}</Text>
    </View>
  )
})


export const End = memo(() => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  return (
    <View style={{ alignItems: 'center', padding: 10 }}>
      <Text style={{ color: theme.normal30 }}>{t('list_end')}</Text>
    </View>
  )
})

