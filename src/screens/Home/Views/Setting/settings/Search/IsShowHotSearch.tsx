import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowHotSearch = useSettingValue('search.isShowHotSearch')
  const handleUpdate = (isShowHotSearch: boolean) => {
    updateSetting({ 'search.isShowHotSearch': isShowHotSearch })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowHotSearch} onChange={handleUpdate} label={t('setting_search_show_hot_search')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

