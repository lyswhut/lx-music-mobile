import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()
  const isShowNotificationImage = useGetter('common', 'isShowNotificationImage')
  const setIsShowNotificationImage = useDispatch('common', 'setIsShowNotificationImage')

  return (
    <View style={{ marginTop: 15 }}>
      <CheckBoxItem check={isShowNotificationImage} onChange={setIsShowNotificationImage} label={t('setting_play_show_notification_image')} />
    </View>
  )
})
