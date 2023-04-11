import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowNotificationImage = useSettingValue('player.isShowNotificationImage')
  const setShowNotificationImage = (isShowNotificationImage: boolean) => {
    updateSetting({ 'player.isShowNotificationImage': isShowNotificationImage })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowNotificationImage} onChange={setShowNotificationImage} label={t('setting_play_show_notification_image')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

