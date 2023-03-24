import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const setAutoHidePlayBar = (autoHidePlayBar: boolean) => {
    updateSetting({ 'common.autoHidePlayBar': autoHidePlayBar })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={autoHidePlayBar} label={t('setting_basic_auto_hide_play_bar')} onChange={setAutoHidePlayBar} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
