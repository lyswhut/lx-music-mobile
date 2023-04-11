import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')
  const handleUpdate = (isShowHistorySearch: boolean) => {
    updateSetting({ 'search.isShowHistorySearch': isShowHistorySearch })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowHistorySearch} onChange={handleUpdate} label={t('setting_search_show_history_search')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})

