import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const setShowBackBtn = (showBackBtn: boolean) => {
    updateSetting({ 'common.showBackBtn': showBackBtn })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={showBackBtn} label={t('setting_basic_show_back_btn')} onChange={setShowBackBtn} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
