import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isClickPlayList = useSettingValue('list.isClickPlayList')
  const setClickPlayList = (isClickPlayList: boolean) => {
    updateSetting({ 'list.isClickPlayList': isClickPlayList })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isClickPlayList} onChange={setClickPlayList} label={t('setting_list_click_action')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})

